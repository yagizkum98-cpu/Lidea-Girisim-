import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import bcrypt from "bcryptjs";
import * as jose from "jose";

const require = createRequire(import.meta.url);
function load(file, modules = {}) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  runInNewContext(source, { exports, require: (name) => modules[name] || require(name), Buffer, TextEncoder, process, URL, Request, Response });
  return exports;
}
process.env.AUTH_SECRET = "auth-regression-test-secret-with-32-characters";
const session = load("lib/session.ts", { jose });
const apiErrors = { unauthorized: () => Response.json({}, { status: 401 }), apiError: (error) => Response.json({ error: String(error) }, { status: error.message === "FORBIDDEN" ? 403 : 500 }) };
const permissions = load("lib/permissions.ts");
const request = (data) => new Request("http://localhost", { method: "POST", body: JSON.stringify(data) });

test("tokens reject missing, forged, expired and legacy sessions; panel roles are enforced", async () => {
  const user = { id: "platform-test-entrepreneur", email: "tester@lideagirisim.com", name: "Tester", role: "SUPER_ADMIN" };
  const token = await session.createSessionToken(user);
  assert.equal((await session.readSessionToken(token)).email, user.email);
  assert.equal(await session.readSessionToken(), null);
  assert.equal(await session.readSessionToken(token.slice(0, -5) + "wrong"), null);
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
  for (const token of [await new jose.SignJWT(user).setProtectedHeader({ alg: "HS256" }).sign(secret), await new jose.SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuer("lidea").setAudience("lidea-panels").setExpirationTime(2).setIssuedAt(1).sign(secret)]) {
    assert.equal(await session.readSessionToken(token), null);
  }
  for (const panel of ["admin", "girisimci", "lideacheck"]) assert.equal(session.canEnterPanel(user, panel), true);
  assert.equal(session.canEnterPanel({ ...user, role: "ENTREPRENEUR" }, "admin"), false);
});

test("admin and tester use the new password everywhere; unapproved founders and role mismatches are denied", async () => {
  let stored = null, accepted = null, signed = null;
  const login = load("lib/login.ts", {
    "next/server": { NextResponse: Response }, "@/lib/api": apiErrors, "@/lib/session": session,
    "@/lib/auth": { credentialVersion: (hash) => hash, setSessionCookie: async (user) => { signed = user; }, getSessionUser: async () => signed },
    "@/lib/db": { db: { user: { findUnique: async () => stored }, application: { findFirst: async () => accepted } } },
  });
  for (const email of login.platformEmails) {
    for (const panel of ["admin", "girisimci", "lideacheck"]) {
      assert.equal((await login.login(request({ email, password: "1234567890" }), panel)).status, 401);
      assert.equal((await login.login(request({ email, password: "lideagirisim2027!" }), panel)).status, 200);
      assert.equal(signed.role, "SUPER_ADMIN");
    }
  }
  stored = { id: "founder", email: "founder@example.com", name: "Founder", role: "ENTREPRENEUR", active: true, passwordHash: await bcrypt.hash("founder-password", 4) };
  const credentials = request({ email: stored.email, password: "founder-password" });
  assert.equal((await login.login(credentials.clone(), "girisimci")).status, 403);
  accepted = { id: "accepted" };
  assert.equal((await login.login(credentials.clone(), "girisimci")).status, 200);
  assert.equal((await login.login(credentials.clone(), "admin")).status, 403);
  assert.equal((await login.login(credentials.clone(), "lideacheck")).status, 403);
  stored.active = false;
  assert.equal((await login.login(credentials.clone(), "girisimci")).status, 401);
});

test("server sessions check approval, active status and password reset; open admin fallback is gone", async () => {
  let actor = null, stored = null, accepted = { id: "a" };
  const auth = load("lib/auth.ts", {
    "next/headers": { cookies: async () => ({ get: () => ({ value: "token" }) }) }, "next/navigation": { redirect: () => { throw new Error("REDIRECT"); } },
    "@/lib/session": { ...session, readSessionToken: async () => actor },
    "@/lib/db": { db: { user: { findUnique: async () => stored }, application: { findFirst: async () => accepted } } },
  });
  assert.equal(await auth.getAdminSessionUser(), null);
  stored = { id: "founder", email: "founder@example.com", role: "ENTREPRENEUR", active: true, name: "Founder", passwordHash: "hash1" };
  actor = { ...stored, credentialVersion: auth.credentialVersion("hash1") };
  assert.ok(await auth.getSessionUser());
  assert.equal(await auth.getAdminSessionUser(), null);
  accepted = null; assert.equal(await auth.getSessionUser(), null);
  accepted = { id: "a" }; stored.passwordHash = "hash2"; assert.equal(await auth.getSessionUser(), null);
  actor = { id: "platform-test-entrepreneur", email: "tester@lideagirisim.com", name: "Tester", role: "SUPER_ADMIN" };
  assert.ok(await auth.getAdminSessionUser());
  actor.email = "fake@example.com"; assert.equal(await auth.getAdminSessionUser(), null);
});

test("password provisioning requires admin and accepted startup; hashes password and links ownership atomically", async () => {
  let actor = null, application = { id: "a", status: "NEW", email: "owner@example.com", founder: "Owner", startup: { id: "s" } }, existing = null;
  const writes = [];
  const tx = {
    application: { findUnique: async () => application, update: async (args) => writes.push(args) },
    user: { findUnique: async () => existing, upsert: async (args) => { writes.push(args); return { id: "owner" }; } },
    startup: { update: async (args) => writes.push(args) },
  };
  const route = load("app/api/applications/[id]/credentials/route.ts", {
    "next/server": { NextResponse: Response }, "@/lib/api": apiErrors, "@/lib/auth": { getAdminSessionUser: async () => actor },
    "@/lib/db": { db: { $transaction: async (callback) => callback(tx) } }, "@/lib/login": { platformEmails: ["admin@lideagirisim.com", "tester@lideagirisim.com"] }, "@/lib/permissions": permissions,
  });
  const invoke = (password = "new-password") => route.POST(request({ password }), { params: Promise.resolve({ id: "a" }) });
  assert.equal((await invoke()).status, 401);
  actor = { role: "ENTREPRENEUR" }; assert.equal((await invoke()).status, 403);
  actor = { role: "SUPER_ADMIN" }; assert.equal((await invoke("short")).status, 400);
  assert.equal((await invoke()).status, 409); assert.equal(writes.length, 0);
  application.status = "ACCEPTED";
  existing = { role: "SUPER_ADMIN" }; assert.equal((await invoke()).status, 409);
  existing = null;
  assert.equal((await invoke()).status, 200);
  assert.ok(await bcrypt.compare("new-password", writes[0].create.passwordHash));
  assert.equal(writes[1].data.userId, "owner"); assert.equal(writes[2].data.ownerId, "owner");
  assert.equal(writes[0].create.role, "ENTREPRENEUR");
});
