import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

// Run the real browser storage modules without a DOM or unrelated startup fixtures.
function workspace() {
  const storage = new Map();
  const window = { localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, dispatchEvent() {} };
  function load(path, modules) {
    const exports = {};
    const source = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    runInNewContext(source, { exports, require: (name) => {
      if (!(name in modules)) throw new Error(`Unexpected dependency: ${name}`);
      return modules[name];
    }, window, crypto: { randomUUID }, Event: class {}, TextEncoder, URL, URLSearchParams });
    return exports;
  }
  const notifications = load("lib/notifications.ts", {
    "@/lib/applications": { readApplications: () => [] },
    "@/lib/evaluators": { readEvaluators: () => [] },
    "@/lib/mentors": { readMentors: () => [] },
    "@/lib/startups": { syncAcceptedApplicationsToStartups: () => [] },
  });
  return { ...load("lib/events.ts", { "@/lib/notifications": notifications }), notifications };
}

function fixture(overrides = {}) {
  return { id: randomUUID(), title: "Girişim buluşması", description: "Soru, cevap; ve\nyeni fikirler", startsAt: "2030-01-10T09:00:00.000Z", endsAt: "2030-01-10T10:00:00.000Z",
    mode: "online", location: "", meetingUrl: "https://meet.google.com/old", status: "published", hostEmail: "admin@example.com",
    guests: [{ email: "founder@example.com", response: "invited", joinedAt: "" }], reminders: [1440, 60, 10], createdAt: "2030-01-01T00:00:00.000Z", updatedAt: "2030-01-01T00:00:00.000Z", ...overrides };
}

test("drafts do not send invitations; publication and added guests do", () => {
  const w = workspace(), event = fixture({ status: "draft" });
  w.saveEvent(event); assert.equal(w.notifications.readNotifications().length, 0);
  w.saveEvent({ ...event, status: "published" });
  assert.equal(w.notifications.readNotifications().length, 1);
  w.saveEvent({ ...w.readEvents()[0], guests: [...event.guests, { email: "second@example.com", response: "invited", joinedAt: "" }] });
  const notices = w.notifications.readNotifications();
  assert.equal(notices.length, 2); assert.equal(notices[0].recipients[0].email, "second@example.com");
});

test("RSVP preserves guests, informs host and resolves the latest meeting URL", () => {
  const w = workspace(), event = fixture();
  w.saveEvent(event);
  assert.throws(() => w.joinEvent(event.id, "founder@example.com"));
  assert.throws(() => w.respondToEvent(event.id, "outsider@example.com", "going"));
  w.respondToEvent(event.id, "FOUNDER@example.com", "going");
  w.saveEvent({ ...w.readEvents()[0], meetingUrl: "https://meet.google.com/new" });
  assert.equal(w.readEvents()[0].guests[0].response, "going");
  assert.equal(w.joinEvent(event.id, "founder@example.com"), "https://meet.google.com/new");
  assert.ok(w.readEvents()[0].guests[0].joinedAt);
  assert.ok(w.notifications.readNotifications().some((notice) => notice.eventCategory === "registration" && notice.recipients[0].email === event.hostEmail));
  const count = w.notifications.readNotifications().length;
  w.respondToEvent(event.id, "founder@example.com", "going"); assert.equal(w.notifications.readNotifications().length, count);
});

test("cancellation disables joining and notifies guests; expired events reject RSVP", () => {
  const w = workspace(), event = fixture();
  w.saveEvent(event); w.respondToEvent(event.id, "founder@example.com", "going");
  w.saveEvent({ ...w.readEvents()[0], status: "cancelled" });
  assert.throws(() => w.joinEvent(event.id, "founder@example.com"));
  assert.throws(() => w.respondToEvent(event.id, "founder@example.com", "going"));
  assert.ok(w.notifications.readNotifications()[0].title.includes("iptal"));
  w.saveEvent(event);
  assert.throws(() => w.respondToEvent(event.id, "founder@example.com", "going", Date.parse(event.endsAt)));
});

test("reminders respect preferences, attendance and deduplicate across refreshes", () => {
  const w = workspace(), event = fixture({ guests: [
    { email: "founder@example.com", response: "going", joinedAt: "" },
    { email: "declined@example.com", response: "declined", joinedAt: "" },
    { email: "muted@example.com", response: "going", joinedAt: "" },
    { email: "late@example.com", response: "invited", joinedAt: "" },
  ] });
  w.saveEventPreferences("muted@example.com", { ...w.defaultEventPreferences, reminder: false });
  w.saveEvent(event);
  const now = Date.parse(event.startsAt) - 30 * 60_000;
  w.processEventReminders(now); w.processEventReminders(now);
  let reminders = w.notifications.readNotifications().filter((notice) => notice.eventCategory === "reminder");
  assert.equal(reminders.length, 1); assert.equal(reminders[0].recipients.length, 1);
  w.respondToEvent(event.id, "late@example.com", "going", now); w.processEventReminders(now);
  reminders = w.notifications.readNotifications().filter((notice) => notice.eventCategory === "reminder");
  assert.equal(reminders.length, 1); assert.equal(reminders[0].recipients.length, 2);
  w.processEventReminders(Date.parse(event.startsAt));
  assert.equal(w.notifications.readNotifications().filter((notice) => notice.eventCategory === "reminder").length, 1);
});

test("notification read state persists and does not mark other guests", () => {
  const w = workspace(), event = fixture({ guests: [...fixture().guests, { email: "second@example.com", response: "invited", joinedAt: "" }] });
  w.saveEvent(event);
  const notice = w.notifications.readNotifications()[0];
  w.notifications.markLocalNotificationRead(notice.id, "FOUNDER@example.com");
  const saved = w.notifications.readNotifications()[0];
  assert.equal(saved.recipients[0].read, true); assert.equal(saved.recipients[1].read, false);
  assert.equal(saved.eventId, event.id);
});

test("validation prevents unsafe URLs and reversed dates; calendar exports UTC and escaped text", () => {
  const w = workspace(), event = fixture();
  assert.throws(() => w.saveEvent({ ...event, meetingUrl: "javascript:alert(1)" }));
  assert.throws(() => w.saveEvent({ ...event, endsAt: event.startsAt }));
  assert.throws(() => w.saveEvent({ ...event, mode: "in-person", location: "" }));
  const calendar = w.eventCalendar({ ...event, title: "ğ".repeat(100) }, "https://example.com/girisimci?etkinlik=123");
  assert.ok(calendar.includes("DTSTART:20300110T090000Z"));
  assert.ok(calendar.includes("Soru\\, cevap\\; ve\\nyeni fikirler"));
  assert.ok(calendar.includes("LOCATION:https://example.com/girisimci?etkinlik=123"));
  assert.ok(calendar.split("\r\n").every((line) => Buffer.byteLength(line, "utf8") <= 75));
  assert.equal(w.eventDateKey("2030-01-10T22:00:00Z"), "2030-01-11");
  assert.equal(new URL(w.googleCalendarUrl(event, "https://example.com")).searchParams.get("ctz"), "Europe/Istanbul");
});
