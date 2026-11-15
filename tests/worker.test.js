import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const call = (path, init = {}, env = {}) => worker.fetch(
  new Request("https://manager.example" + path, init),
  env,
  {}
);

test("health reports configured services without exposing secrets", async () => {
  const response = await call("/api/health", {}, { ADMIN_PASSWORD: "not-for-display", SESSION_SECRET: "another-secret" });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.authConfigured, true);
  assert.equal(body.databaseConfigured, false);
  assert.equal(JSON.stringify(body).includes("not-for-display"), false);
});

test("login is unavailable until secrets are configured", async () => {
  const response = await call("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "anything" })
  });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "AUTH_NOT_CONFIGURED");
});

test("owner can sign in and validate a signed session", async () => {
  const env = { ADMIN_PASSWORD: "test-owner-password", SESSION_SECRET: "a-long-test-session-secret-for-local-tests" };
  const login = await call("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: env.ADMIN_PASSWORD })
  }, env);
  assert.equal(login.status, 200);
  const cookie = (login.headers.get("Set-Cookie") || "").split(";")[0];
  assert.match(cookie, /^bkm_session=/);
  const me = await call("/api/auth/me", { headers: { Cookie: cookie } }, env);
  assert.equal(me.status, 200);
  assert.equal((await me.json()).authenticated, true);
});

test("private dashboard routes reject unauthenticated requests", async () => {
  const response = await call("/api/bootstrap");
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "UNAUTHORIZED");
});
