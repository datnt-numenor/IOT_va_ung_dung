const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

process.env.JWT_SECRET = "test-secret-with-at-least-sixteen-chars";

const authService = require("../services/authService");
const authenticate = require("../middleware/authenticate");
const { authorize, ROLES } = require("../middleware/authorize");
const jwt = require("jsonwebtoken");
const rateLimit = require("../utils/loginRateLimit");

test("hashes passwords with bcrypt and verifies them", async () => {
  const hash = await authService.hashPassword("123456");
  assert.notEqual(hash, "123456");
  assert.deepEqual(await authService.verifyPassword("123456", hash), { ok: true, needsRehash: false });
  assert.equal((await authService.verifyPassword("wrong", hash)).ok, false);
});

test("accepts a legacy SHA-256 hash once and asks for a rehash", async () => {
  const legacy = crypto.createHash("sha256").update("123456").digest("hex");
  assert.ok(authService.isLegacySha256(legacy));
  assert.deepEqual(await authService.verifyPassword("123456", legacy), { ok: true, needsRehash: true });
  assert.equal((await authService.verifyPassword("nope", legacy)).ok, false);
});

test("signs and verifies tokens, rejecting tampered ones", () => {
  const token = authService.signToken({ id: 7, username: "admin", role: "admin" });
  assert.deepEqual(authService.verifyToken(token), { id: 7, username: "admin", role: "admin" });
  assert.throws(() => authService.verifyToken(`${token}x`));
  assert.throws(() => authService.verifyToken("not-a-token"));
});

test("authenticate sets req.user for a valid bearer token", () => {
  const token = authService.signToken({ id: 3, username: "admin", role: "admin" });
  const req = { header: (name) => (name === "authorization" ? `Bearer ${token}` : undefined) };
  let error;
  authenticate(req, {}, (value) => { error = value; });
  assert.equal(error, undefined);
  assert.deepEqual(req.user, { id: 3, username: "admin", role: "admin" });
});

test("rejects a token issued without a role so the user must sign in again", () => {
  const legacy = jwt.sign({ username: "admin" }, process.env.JWT_SECRET, { subject: "1" });
  assert.throws(() => authService.verifyToken(legacy), /role/);
});

function runAuthorize(user, ...roles) {
  let error;
  authorize(...roles)({ user }, {}, (value) => { error = value; });
  return error;
}

test("authorize lets an allowed role through", () => {
  assert.equal(runAuthorize({ id: 1, role: "admin" }, ROLES.ADMIN), undefined);
});

test("authorize returns 403 for a role without permission", () => {
  assert.equal(runAuthorize({ id: 2, role: "viewer" }, ROLES.ADMIN)?.status, 403);
  assert.equal(runAuthorize({ id: 2 }, ROLES.ADMIN)?.status, 403);
});

test("authorize returns 401 when nobody is authenticated", () => {
  assert.equal(runAuthorize(undefined, ROLES.ADMIN)?.status, 401);
});

test("authenticate rejects missing and invalid tokens with 401", () => {
  for (const header of [undefined, "Bearer", "Basic abc", "Bearer garbage"]) {
    const req = { header: () => header };
    let error;
    authenticate(req, {}, (value) => { error = value; });
    assert.equal(error?.status, 401, `header: ${header}`);
  }
});

test("login rate limit blocks after repeated failures and resets", () => {
  const key = "203.0.113.9";
  rateLimit.reset(key);
  for (let i = 0; i < rateLimit.MAX_FAILURES; i += 1) rateLimit.recordFailure(key);
  assert.throws(() => rateLimit.assertAllowed(key), (error) => error.status === 429);
  rateLimit.reset(key);
  assert.doesNotThrow(() => rateLimit.assertAllowed(key));
});
