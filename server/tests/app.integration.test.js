import test, { after } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
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
  assert.equal(response.status, 200);
  return response.headers.get("set-cookie").split(";", 1)[0];
}

async function authenticatedGet(path, cookie) {
  const response = await fetch(`${baseUrl}${path}`, { headers: { Cookie: cookie, Accept: "application/json" } });
  const body = await response.json();
  assert.equal(response.status, 200, body.message);
  return body;
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
