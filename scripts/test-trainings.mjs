import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function loader() {
  const storage = new Map();
  const window = { localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, dispatchEvent() {} };
  return (path, modules = {}, env = {}) => {
    const exports = {};
    const source = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    runInNewContext(source, { exports, require: (name) => modules[name] || require(name), window, crypto: { randomUUID }, Event: class {}, Error, TextEncoder, URL, URLSearchParams, Buffer, Request, Response, setTimeout, clearTimeout, process: { env } });
    return exports;
  };
}
function workspace() {
  const load = loader();
  const shared = load("lib/trainings.ts");
  const validation = load("lib/validation/training.ts", { "@/lib/trainings": shared });
  const notifications = load("lib/notifications.ts", {
    "@/lib/applications": { readApplications: () => [] }, "@/lib/evaluators": { readEvaluators: () => [] },
    "@/lib/mentors": { readMentors: () => [] }, "@/lib/startups": { syncAcceptedApplicationsToStartups: () => [] },
  });
  const modules = { "@/lib/trainings": shared, "@/lib/validation/training": validation, "@/lib/notifications": notifications };
  const local = load("lib/local-trainings.ts", modules);
  const events = load("lib/events.ts", { "@/lib/notifications": notifications });
  const calendar = load("lib/training-calendar.ts", { ...modules, "@/lib/events": events });
  return { load, shared, validation, notifications, local, calendar, modules };
}
const session = (w, patch = {}) => ({ ...w.shared.trainingSchedule[0], startTime: "20:00", endTime: "22:00", meetingUrl: "https://zoom.us/j/123", hostEmail: "admin@example.com", ...patch });

test("shared curriculum contains the exact 8 homepage trainings and Demo Day, without invented hours", () => {
  const w = workspace(), schedule = w.shared.trainingSchedule;
  assert.equal(schedule.length, 9); assert.equal(schedule.filter((training) => training.week).length, 8);
  assert.equal(schedule[1].date, "2026-11-04"); assert.equal(schedule[8].date, "2026-12-19");
  assert.ok(schedule.every((training) => training.startTime === "" && training.meetingUrl === ""));
  assert.equal(w.shared.trainingWeekStart("2026-11-04"), "2026-11-02");
});

test("validation rejects unsafe URLs, impossible dates and partial/reversed time ranges", () => {
  const w = workspace(), valid = session(w);
  assert.equal(w.validation.trainingUpdateSchema.safeParse(valid).success, true);
  for (const patch of [{ meetingUrl: "javascript:alert(1)" }, { date: "2026-02-30" }, { endTime: "19:00" }, { startTime: "" }, { reminders: [2] }]) {
    assert.equal(w.validation.trainingUpdateSchema.safeParse({ ...valid, ...patch }).success, false);
  }
});

test("local follow, updated meeting URLs and cancellation share one authoritative record", () => {
  const w = workspace(), training = session(w);
  w.local.saveLocalTraining(training); w.local.followLocalTraining(training.id, "FOUNDER@example.com", true);
  assert.equal(w.local.readLocalTrainings("founder@example.com")[0].following, true);
  assert.equal(w.local.joinLocalTraining(training.id, "founder@example.com", Date.parse("2026-11-02T16:30:00Z")), training.meetingUrl);
  assert.equal(w.local.readLocalTrainings("", true)[0].joinedCount, 1);
  w.local.saveLocalTraining({ ...training, meetingUrl: "https://zoom.us/j/456" });
  assert.equal(w.local.joinLocalTraining(training.id, "founder@example.com", Date.parse("2026-11-02T16:30:00Z")), "https://zoom.us/j/456");
  assert.ok(w.notifications.readNotifications().some((notice) => notice.trainingId === training.id && notice.recipients[0].email === "founder@example.com"));
  w.local.saveLocalTraining({ ...training, status: "cancelled" });
  assert.throws(() => w.local.joinLocalTraining(training.id, "founder@example.com"));
});

test("local reminders reach host and followers exactly once, and exclude unknown hours/expired/cancelled sessions", () => {
  const w = workspace(), training = session(w), now = Date.parse("2026-11-02T16:15:00Z");
  w.local.saveLocalTraining(training); w.local.followLocalTraining(training.id, "founder@example.com", true);
  w.local.processLocalTrainingReminders(now); w.local.processLocalTrainingReminders(now);
  const reminders = () => w.notifications.readNotifications().filter((notice) => notice.type === "Hatırlatma");
  assert.equal(reminders().length, 2);
  w.local.followLocalTraining(training.id, "founder@example.com", false);
  w.local.processLocalTrainingReminders(Date.parse("2026-11-02T16:55:00Z"));
  assert.equal(reminders().length, 3); assert.equal(reminders()[0].recipients[0].email, "admin@example.com");
  assert.equal(w.shared.dueTrainingReminder({ ...training, startTime: "" }, now), undefined);
  assert.equal(w.shared.dueTrainingReminder({ ...training, status: "cancelled" }, now), undefined);
  assert.equal(w.shared.dueTrainingReminder(training, Date.parse("2026-11-02T17:00:00Z")), undefined);
});

test("public projection does not expose meeting URL, host or attendance", () => {
  const w = workspace();
  const data = w.shared.publicTraining(session(w, { following: true, joinedCount: 3 }));
  for (const key of ["meetingUrl", "hostEmail", "adminReminders", "following", "joinedCount", "description", "location"]) assert.equal(key in data, false);
});

test("calendar exports use all-day dates when hours are absent and timed VALARM when configured", () => {
  const w = workspace();
  const allDay = w.calendar.trainingCalendarFile(w.shared.trainingSchedule[0], "https://lidea.example/girisimci?egitim=1");
  assert.ok(allDay.includes("DTSTART;VALUE=DATE:20261102")); assert.ok(allDay.includes("DTEND;VALUE=DATE:20261103"));
  assert.ok(!allDay.includes("VALARM"));
  const timed = w.calendar.trainingCalendarFile(session(w), "https://lidea.example/girisimci?egitim=1");
  assert.ok(timed.includes("DTSTART:20261102T170000Z")); assert.ok(timed.includes("TRIGGER:-PT60M"));
  assert.ok(!timed.includes("https://zoom.us"));
  assert.equal(new URL(w.calendar.trainingGoogleCalendar(w.shared.trainingSchedule[0], "https://lidea.example")).searchParams.get("dates"), "20261102/20261103");
});

test("server reminders persist idempotent notifications for the host and followers", async () => {
  const w = workspace(), training = session(w), notices = new Map();
  const row = { ...training, startsAt: new Date("2026-11-02T17:00:00Z"), endsAt: new Date("2026-11-02T19:00:00Z"), timeConfirmed: true, reminderMinutes: training.reminders,
    followers: [{ email: "founder@example.com", following: true }] };
  const db = { training: { findMany: async () => [row] }, notification: {
    findUnique: async ({ where }) => notices.get(where.id) || null,
    create: async ({ data }) => { notices.set(data.id, data); return data; },
  } };
  const service = w.load("lib/services/trainings-service.ts", { "@/lib/db": { db }, "@/lib/trainings": w.shared });
  assert.equal((await service.processTrainingReminders(Date.parse("2026-11-02T16:15:00Z"))).sent, 2);
  assert.equal((await service.processTrainingReminders(Date.parse("2026-11-02T16:16:00Z"))).sent, 0);
  assert.ok([...notices.values()].every((notice) => notice.trainingId === training.id && notice.status === "SENT"));
});

test("server admin writes reject entrepreneur sessions; public API strips private fields", async () => {
  const w = workspace();
  const permissions = w.load("lib/permissions.ts"), api = w.load("lib/api.ts");
  let actor = { role: "ENTREPRENEUR", email: "founder@example.com" }, writes = 0;
  const trainingApi = w.load("lib/training-api.ts", {
    "@/lib/api": api, "@/lib/permissions": permissions,
    "@/lib/auth": { getSessionUser: async () => actor, getAdminSessionUser: async () => ({ role: "SUPER_ADMIN", email: "admin@example.com" }) },
  });
  const service = { listTrainings: async () => [session(w)], processTrainingReminders: async () => ({ sent: 0 }), saveTraining: async () => { writes++; return session(w); } };
  const modules = { ...w.modules, "@/lib/api": api, "@/lib/training-api": trainingApi, "@/lib/services/trainings-service": service };
  const patch = w.load("app/api/trainings/[id]/route.ts", modules);
  const request = () => new Request("http://localhost/api", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(session(w)) });
  const context = { params: Promise.resolve({ id: session(w).id }) };
  assert.equal((await patch.PATCH(request(), context)).status, 403); assert.equal(writes, 0);
  actor = null;
  assert.equal((await patch.PATCH(request(), context)).status, 401); assert.equal(writes, 0);
  actor = { role: "SUPER_ADMIN", email: "admin@example.com" };
  assert.equal((await patch.PATCH(request(), context)).status, 200); assert.equal(writes, 1);
  actor = null;
  const get = w.load("app/api/trainings/route.ts", modules);
  const publicResponse = await get.GET(new Request("http://localhost/api?view=public"));
  assert.equal(publicResponse.status, 200); assert.equal("meetingUrl" in (await publicResponse.json()).trainings[0], false);
  assert.equal((await get.GET(new Request("http://localhost/api?view=participant"))).status, 401);
});

test("admin changes and follower notifications are written inside the same transaction", async () => {
  const w = workspace(), training = session(w), notices = [];
  let transactions = 0;
  const row = { ...training, startsAt: new Date("2026-11-02T17:00:00Z"), endsAt: new Date("2026-11-02T19:00:00Z"),
    timeConfirmed: true, reminderMinutes: training.reminders, followers: [{ email: "founder@example.com" }], updatedAt: new Date("2026-10-08T00:00:00Z") };
  const tx = { training: { findUnique: async () => row, upsert: async ({ update }) => Object.assign(row, update, { updatedAt: new Date("2026-10-08T01:00:00Z") }) },
    notification: { findUnique: async () => null, create: async ({ data }) => { notices.push(data); return data; } } };
  const db = { program: { findUnique: async () => ({ id: "program-3" }) }, $transaction: async (callback) => { transactions++; return callback(tx); },
    notification: { create: async () => { throw new Error("Notification escaped transaction"); } } };
  const service = w.load("lib/services/trainings-service.ts", { "@/lib/db": { db }, "@/lib/trainings": w.shared });
  const updated = await service.saveTraining({ ...training, meetingUrl: "https://zoom.us/j/new" });
  assert.equal(transactions, 1); assert.equal(updated.meetingUrl, "https://zoom.us/j/new"); assert.equal(notices.length, 2);
  assert.ok(notices.every((notice) => notice.trainingId === training.id));
});

test("cron is fail-closed without its secret and only accepts the correct bearer", async () => {
  const w = workspace(), secret = "test-only-cron-secret-with-at-least-32-characters", env = { CRON_SECRET: secret };
  const cron = w.load("app/api/cron/training-reminders/route.ts", {
    "@/lib/training-api": { trainingDatabaseTask: async (task) => task },
    "@/lib/services/trainings-service": { processTrainingReminders: async () => ({ sent: 0 }) },
  }, env);
  assert.equal((await cron.GET(new Request("http://localhost/api"))).status, 401);
  assert.equal((await cron.GET(new Request("http://localhost/api", { headers: { authorization: `Bearer ${secret}` } }))).status, 200);
  env.CRON_SECRET = "";
  assert.equal((await cron.GET(new Request("http://localhost/api"))).status, 503);
});
