import test, { after } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.DEMO_LOGIN_ENABLED = "true";
await import("dotenv/config");
const [{ default: app }, { default: prisma }] = await Promise.all([
  import("../src/app.js"),
  import("../src/config/database.js"),
]);

const server = await new Promise((resolve) => {
  const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
});
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

async function login(role) {
  const response = await fetch(`${baseUrl}/api/auth/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  const body = await response.json();
  assert.equal(response.status, 200, body.message);
  return response.headers.get("set-cookie").split(";", 1)[0];
}

async function authenticatedGet(path, cookie) {
  const response = await fetch(`${baseUrl}${path}`, { headers: { Cookie: cookie, Accept: "application/json" } });
  const body = await response.json();
  assert.equal(response.status, 200, body.message);
  return body;
}

async function authenticatedRequest(path, cookie, method, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { Cookie: cookie, Accept: "application/json", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = response.status === 204 ? null : await response.json();
  return { response, result };
}

test("Admin login persists and protected user/profile endpoints load", async () => {
  const cookie = await login("ADMIN");
  const me = await authenticatedGet("/api/auth/me", cookie);
  assert.equal(me.authenticated, true);
  assert.ok(me.data.roles.includes("ADMIN"));
  const users = await authenticatedGet("/api/users", cookie);
  assert.ok(users.data.length >= 3);
  const profile = await authenticatedGet(`/api/profile?userId=${users.data[0].id}`, cookie);
  assert.equal(profile.success, true);
});

test("Recruiter login persists and inside data pages load", async () => {
  const cookie = await login("RECRUITER");
  const me = await authenticatedGet("/api/auth/me", cookie);
  assert.equal(me.authenticated, true);
  assert.ok(me.data.roles.includes("RECRUITER"));
  const [attributes, positions, cvs] = await Promise.all([
    authenticatedGet("/api/attributes", cookie),
    authenticatedGet("/api/positions", cookie),
    authenticatedGet("/api/cvs", cookie),
  ]);
  assert.ok(attributes.data.length > 0);
  assert.ok(positions.data.length > 0);
  assert.ok(Array.isArray(cvs.data));
});

test("PostgreSQL full-text position search returns matching positions", async () => {
  const positions = await authenticatedGet("/api/positions?q=Business");
  assert.ok(positions.data.some((position) => position.title === "Business Analyst"));
});

test("Bengali preference persists on the authenticated user", async () => {
  const cookie = await login("CANDIDATE");
  try {
    const { response, result } = await authenticatedRequest("/api/profile/preferences", cookie, "PATCH", { preferredLanguage: "BN" });
    assert.equal(response.status, 200, result?.message);
    assert.equal(result.data.preferredLanguage, "BN");
    const me = await authenticatedGet("/api/auth/me", cookie);
    assert.equal(me.data.preferredLanguage, "BN");
  } finally {
    await authenticatedRequest("/api/profile/preferences", cookie, "PATCH", { preferredLanguage: "EN" });
  }
});

test("a candidate can publish a complete CV and recruiters can then see it", async () => {
  const candidateCookie = await login("CANDIDATE");
  const recruiterCookie = await login("RECRUITER");
  const attribute = await prisma.attributeDefinition.findUnique({ where: { name: "Professional Summary" } });
  const positionId = `publish-test-${Date.now()}`;
  await prisma.position.create({
    data: {
      id: positionId,
      title: "Publish flow verification",
      company: "Test Company",
      isPublic: true,
      attributes: { create: { attributeId: attribute.id, required: true } },
    },
  });

  try {
    const created = await authenticatedRequest("/api/cvs", candidateCookie, "POST", { positionId });
    assert.equal(created.response.status, 201, created.result?.message);
    assert.equal(created.result.data.status, "DRAFT");

    const beforePublish = await authenticatedGet("/api/cvs", recruiterCookie);
    assert.ok(!beforePublish.data.some((cv) => cv.id === created.result.data.id));

    const published = await authenticatedRequest(`/api/cvs/${created.result.data.id}/publish`, candidateCookie, "POST");
    assert.equal(published.response.status, 200, published.result?.message);
    assert.equal(published.result.data.status, "PUBLISHED");

    const afterPublish = await authenticatedGet("/api/cvs", recruiterCookie);
    assert.ok(afterPublish.data.some((cv) => cv.id === created.result.data.id));
  } finally {
    await prisma.position.deleteMany({ where: { id: positionId } });
  }
});

test("Demo login is unavailable unless explicitly enabled", async () => {
  process.env.DEMO_LOGIN_ENABLED = "false";
  const response = await fetch(`${baseUrl}/api/auth/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "ADMIN" }),
  });
  assert.equal(response.status, 404);
  process.env.DEMO_LOGIN_ENABLED = "true";
});

test("Candidate cannot assign staff roles through the API", async () => {
  const cookie = await login("CANDIDATE");
  const me = await authenticatedGet("/api/auth/me", cookie);
  const response = await fetch(`${baseUrl}/api/users/bulk`, {
    method: "PATCH",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ ids: [me.data.id], action: "addRole", role: "ADMIN" }),
  });
  assert.equal(response.status, 403);
});

test("built frontend and deep routes are served by Express", async () => {
  for (const path of ["/", "/cvs", "/admin/users"]) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /<div id="root"><\/div>/);
  }
});

test("OAuth entry routes are configured or return a useful setup redirect", async () => {
  const github = await fetch(`${baseUrl}/api/auth/github`, { redirect: "manual" });
  assert.equal(github.status, 302);
  assert.match(github.headers.get("location"), /^https:\/\/github\.com\/login\/oauth\/authorize/);
  const google = await fetch(`${baseUrl}/api/auth/google`, { redirect: "manual" });
  assert.equal(google.status, 302);
  assert.match(google.headers.get("location"), /^(https:\/\/accounts\.google\.com\/|http:\/\/localhost:5000\/login\?login=failed&provider=google&reason=not_configured)/);
});
