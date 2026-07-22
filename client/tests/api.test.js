import test from "node:test";
import assert from "node:assert/strict";
import { api, apiEnvelope } from "../src/api/client.js";

test("apiEnvelope preserves authentication metadata", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true, authenticated: true, data: { email: "admin@demo.local", roles: ["ADMIN"] }, oauthAvailability: { github: false, google: false } }), { status: 200, headers: { "Content-Type": "application/json" } });
  try {
    const result = await apiEnvelope("/auth/me");
    assert.equal(result.authenticated, true);
    assert.equal(result.data.roles[0], "ADMIN");
  } finally { globalThis.fetch = originalFetch; }
});

test("api unwraps ordinary data responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true, data: [{ id: "one" }] }), { status: 200, headers: { "Content-Type": "application/json" } });
  try { assert.deepEqual(await api("/positions"), [{ id: "one" }]); }
  finally { globalThis.fetch = originalFetch; }
});
