import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(path, modules = {}, env = {}) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  runInNewContext(source, { exports, require: (name) => modules[name] || require(name), Buffer, Request, Response, process: { env } });
  return exports;
}
const validation = load("lib/validation/lovable-application.ts");
const input = () => validation.lovableSubmissionSchema.parse({
  submissionId: "external-unique-id", data: {
    fullName: "Ayşe Yılmaz", email: "AYSE@example.com", phone: "05550000000", city: "Muğla",
    roleInStartup: "Kurucu", startupName: "Test Girişim", oneLiner: "Müşteri problemini çözüyoruz.",
    problem: "Problem", solution: "Çözüm", targetCustomer: "Küçük işletmeler", trlLevel: "TRL 4",
    trlEvidence: "Prototip", teamSize: "5+ kişi", founders: "Ayşe Yılmaz - Kurucu",
    weeklyCommitment: "Evet", physicalDays: "Emin değilim", last30Days: "Prototip geliştirdik.",
    expectation: "Mentorluk", consentTruth: true, consentCommitment: true, consentKvkk: true,
  },
});

test("validation normalizes email, requires consents and rejects malformed team/TRL values", () => {
  const valid = input();
  assert.equal(valid.data.email, "ayse@example.com");
  for (const patch of [{ consentKvkk: false }, { consentTruth: false }, { trlLevel: "not a level" }, { teamSize: "unknown" }, { email: "invalid" }]) {
    assert.equal(validation.lovableSubmissionSchema.safeParse({ ...valid, data: { ...valid.data, ...patch } }).success, false);
  }
});

test("imports into the review queue with all original answers and no account writes", async () => {
  let record;
  const db = { program: { findUnique: async () => ({ applicationOpen: true }) }, application: {
    findUnique: async () => record || null,
    create: async ({ data }) => { record = { ...data, id: "new-id" }; return record; },
  } };
  const service = load("lib/services/lovable-applications-service.ts", { "@/lib/db": { db } });
  const result = await service.importLovableApplication(input());
  assert.equal(result.duplicate, false); assert.equal(record.status, "NEW"); assert.equal(record.stage, "Prototip");
  assert.equal(record.teamSize, 5); assert.equal(record.externalPayload.founders, input().data.founders);
  assert.equal(record.externalPayload.consentKvkk, true); assert.equal(record.programId, "program-3");
  record.status = "UNDER_REVIEW";
  const duplicate = await service.importLovableApplication(input());
  assert.equal(duplicate.duplicate, true); assert.equal(duplicate.application.status, "UNDER_REVIEW");
});

test("closed and missing programs reject new imports", async () => {
  let program = null;
  const db = { program: { findUnique: async () => program }, application: { findUnique: async () => null } };
  const service = load("lib/services/lovable-applications-service.ts", { "@/lib/db": { db } });
  await assert.rejects(service.importLovableApplication(input()), /INTAKE_PROGRAM_NOT_FOUND/);
  program = { applicationOpen: false };
  await assert.rejects(service.importLovableApplication(input()), /INTAKE_CLOSED/);
});

test("concurrent deliveries recover unique-key conflicts without replacing the reviewed application", async () => {
  let checks = 0;
  const db = { program: { findUnique: async () => ({ applicationOpen: true }) }, application: {
    findUnique: async () => checks++ ? { id: "existing", status: "UNDER_REVIEW" } : null,
    create: async () => { throw Object.assign(new Error("Duplicate"), { code: "P2002" }); },
  } };
  const service = load("lib/services/lovable-applications-service.ts", { "@/lib/db": { db } });
  const result = await service.importLovableApplication(input());
  assert.equal(result.duplicate, true); assert.equal(result.application.status, "UNDER_REVIEW");
});

test("webhook authenticates before touching storage and handles JSON, receipt and retries", async () => {
  let imports = 0, duplicate = false;
  const secret = "test-only-secret-at-least-32-characters";
  const env = { LOVABLE_APPLICATION_WEBHOOK_SECRET: secret };
  const route = load("app/api/integrations/lovable/applications/route.ts", {
    "@/lib/api": load("lib/api.ts"), "@/lib/validation/lovable-application": validation,
    "@/lib/services/lovable-applications-service": { importLovableApplication: async () => {
      imports++; return { application: { id: "new-id", applicationNo: "test-number" }, duplicate };
    } },
  }, env);
  const request = (body, token = secret, type = "application/json") => new Request("http://localhost/api", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": type }, body });
  assert.equal((await route.POST(request(JSON.stringify(input()), "wrong"))).status, 401); assert.equal(imports, 0);
  assert.equal((await route.POST(request("{"))).status, 400);
  assert.equal((await route.POST(request("{}"))).status, 400);
  assert.equal((await route.POST(request("{}", secret, "text/plain"))).status, 415);
  assert.equal((await route.POST(request("x".repeat(65537)))).status, 413);
  const receipt = await route.POST(request(JSON.stringify(input())));
  assert.equal(receipt.status, 201); assert.equal((await receipt.json()).applicationId, "new-id");
  duplicate = true;
  assert.equal((await route.POST(request(JSON.stringify(input())))).status, 200);
  env.LOVABLE_APPLICATION_WEBHOOK_SECRET = "";
  assert.equal((await route.POST(request(JSON.stringify(input())))).status, 503);
});
