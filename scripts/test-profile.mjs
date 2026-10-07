import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
const require = createRequire(import.meta.url);
function load(file, modules = {}) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  runInNewContext(source, { exports, require: (name) => modules[name] || require(name), atob, URL, Request, Response, Error });
  return exports;
}
const validation = load("lib/validation/startup-profile.ts");
const startups = load("lib/startups.ts", { "@/lib/applications": {} });
test("profile fields reject unsafe URLs, invalid TRL, disguised images and oversized logos", () => {
  const schema = validation.startupProfileSchema;
  for (const value of [{ website: "javascript:alert(1)" }, { stage: "TRL 10" }, { logo: "AB" }, { logo: "data:image/png;base64,YWJj" }, { sector: "unknown" }, { members: [{ id: "1", name: "", role: "", active: true, title: "" }] }, { ownerId: "other" }]) assert.equal(schema.safeParse(value).success, false);
  const png = "data:image/png;base64," + Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString("base64");
  assert.equal(schema.safeParse({ logo: png }).success, true);
  assert.equal(schema.safeParse({ logo: png + "A".repeat(1_400_000) }).success, false);
  assert.equal(schema.safeParse({ stage: "TRL 9", sector: "Yapay Zeka", website: "https://example.com" }).success, true);
});
test("empty fields stay empty; initials, legacy stages and inactive team do not count", () => {
  const startup = startups.normalizeStartup({ name: "", founder: "", logo: "", sector: "", stage: "", members: [] });
  assert.equal(startup.logo, ""); assert.equal(startup.stage, ""); assert.equal(startups.getStartupProfileCompletion(startup).percent, 0);
  const incomplete = { ...startup, logo: "AB", stage: "MVP", members: [{ name: "A", role: "Founder", active: false }] };
  assert.equal(startups.getStartupProfileCompletion(incomplete).completedCount, 0);
  assert.equal(startups.getStartupProfileCompletion({ ...startup, stage: "TRL 4" }).percent, 10);
});
test("profile API checks ownership and updates fields/team transactionally", async () => {
  let actor = null, ownerId = "u1", writes = 0, transactions = 0;
  const tx = { startup: { update: async () => writes++ }, application: { update: async () => writes++ }, startupMember: { deleteMany: async () => writes++, create: async () => writes++ } };
  const api = load("app/api/entrepreneur/profile/route.ts", {
    "next/server": { NextResponse: Response }, "@/lib/api": { unauthorized: () => Response.json({}, { status: 401 }), apiError: () => Response.json({}, { status: 500 }) },
    "@/lib/auth": { getSessionUser: async () => actor }, "@/lib/startups": startups, "@/lib/validation/startup-profile": validation,
    "@/lib/db": { db: { application: { findFirst: async () => ({ id: "a1", founder: "Owner", traction: "", startup: { id: "s1", ownerId, name: "Name", members: [] } }) }, $transaction: async (callback) => { transactions++; await callback(tx); } } },
  });
  const request = (body) => new Request("https://example.com", { method: "PATCH", body: JSON.stringify(body) });
  assert.equal((await api.PATCH(request({ name: "New" }))).status, 401);
  actor = { id: "u1", role: "SUPER_ADMIN" }; assert.equal((await api.PATCH(request({ name: "New" }))).status, 403);
  actor.role = "ENTREPRENEUR"; ownerId = "u2"; assert.equal((await api.PATCH(request({ name: "New" }))).status, 404); assert.equal(writes, 0);
  ownerId = "u1"; assert.equal((await api.PATCH(request({ ownerId: "u2" }))).status, 400);
  assert.equal((await api.PATCH(request({ name: "New", founder: "Founder", traction: "10 users", members: [{ id: "client-id", name: "Team", role: "CTO", title: "", active: true }] }))).status, 200);
  assert.equal(transactions, 1); assert.equal(writes, 4);
});
