import { normalizeNotification, readNotifications, saveNotification } from "@/lib/notifications";

export type EventGuest = { email: string; response: "invited" | "going" | "declined"; joinedAt: string };
export type ProgramEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  mode: "online" | "in-person";
  location: string;
  meetingUrl: string;
  status: "draft" | "published" | "cancelled";
  hostEmail: string;
  guests: EventGuest[];
  reminders: number[];
  createdAt: string;
  updatedAt: string;
};
export type EventPreferences = { invite: boolean; update: boolean; reminder: boolean; registration: boolean };
const eventsKey = "lidea-events";
const preferencesKey = "lidea-event-preferences";
export const eventsUpdated = "lidea-events-updated";
export const defaultEventPreferences: EventPreferences = { invite: true, update: true, reminder: true, registration: true };

export function readEvents(): ProgramEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = JSON.parse(window.localStorage.getItem(eventsKey) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}

export function readEventPreferences(email: string): EventPreferences {
  if (typeof window === "undefined") return defaultEventPreferences;
  try {
    const saved = JSON.parse(window.localStorage.getItem(preferencesKey) || "{}");
    return { ...defaultEventPreferences, ...saved[email.toLowerCase()] };
  } catch { return defaultEventPreferences; }
}

export function saveEventPreferences(email: string, preferences: EventPreferences) {
  let saved: Record<string, EventPreferences> = {};
  try { saved = JSON.parse(window.localStorage.getItem(preferencesKey) || "{}"); } catch { /* Recover invalid preferences. */ }
  window.localStorage.setItem(preferencesKey, JSON.stringify({ ...saved, [email.toLowerCase()]: preferences }));
  window.dispatchEvent(new Event(eventsUpdated));
}

export function validMeetingUrl(value: string) {
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}

export function validateEvent(event: ProgramEvent) {
  if (!event.title.trim()) throw new Error("Etkinlik adı zorunludur.");
  if (!Number.isFinite(Date.parse(event.startsAt)) || !Number.isFinite(Date.parse(event.endsAt)) || Date.parse(event.endsAt) <= Date.parse(event.startsAt)) {
    throw new Error("Bitiş zamanı başlangıçtan sonra olmalıdır.");
  }
  if (event.status === "published" && event.mode === "online" && !validMeetingUrl(event.meetingUrl)) throw new Error("Geçerli bir toplantı bağlantısı girin (https://).");
  if (event.status === "published" && event.mode === "in-person" && !event.location.trim()) throw new Error("Etkinlik konumunu girin.");
  if (event.guests.some((guest) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email))) throw new Error("Davetli e-posta adreslerini kontrol edin.");
}

function writeEvent(event: ProgramEvent) {
  const events = readEvents();
  window.localStorage.setItem(eventsKey, JSON.stringify([...events.filter((item) => item.id !== event.id), event]));
  window.dispatchEvent(new Event(eventsUpdated));
}

function notify(event: ProgramEvent, category: keyof EventPreferences, emails: string[], title: string, message: string, key: string) {
  const id = `event:${event.id}:${key}`;
  const existing = readNotifications().find((notification) => notification.id === id);
  const recipients = [...new Set(emails.map((email) => email.toLowerCase()))]
    .filter((email) => readEventPreferences(email)[category] && !existing?.recipients.some((recipient) => recipient.email === email))
    .map((email) => ({ name: email, email, role: category === "registration" ? "Admin" : "Girişimci", read: false, readAt: "" }));
  if (!recipients.length) return;
  if (existing) {
    saveNotification({ ...existing, recipients: [...existing.recipients, ...recipients] });
    return;
  }
  saveNotification(normalizeNotification({
    id, eventId: event.id, eventCategory: category, title, message,
    audience: "Özel Kullanıcılar",
    type: category === "reminder" ? "Hatırlatma" : "Etkinlik",
    status: "Gönderildi", channels: ["Platform İçi"], recipients, sentAt: new Date().toISOString(),
  }));
}

export function saveEvent(event: ProgramEvent) {
  validateEvent(event);
  const previous = readEvents().find((item) => item.id === event.id);
  const next = { ...event, updatedAt: new Date().toISOString() };
  // Invitations are separate from updates so newly added guests get an actionable invitation.
  const newGuests = next.guests.filter((guest) => previous?.status !== "published" || !previous.guests.some((old) => old.email === guest.email));
  if (next.status === "published") {
    notify(next, "invite", newGuests.map((guest) => guest.email), `Davet: ${next.title}`, `${formatEventDate(next.startsAt)} · Katılım yanıtınız bekleniyor.`, `invite:${crypto.randomUUID()}`);
    const changed = previous?.status === "published" && ["title", "description", "startsAt", "endsAt", "mode", "location", "meetingUrl"].some((field) => previous[field as keyof ProgramEvent] !== next[field as keyof ProgramEvent]);
    if (changed) notify(next, "update", next.guests.filter((guest) => guest.response !== "declined" && !newGuests.some((added) => added.email === guest.email)).map((guest) => guest.email), `Etkinlik güncellendi: ${next.title}`, `Güncel tarih: ${formatEventDate(next.startsAt)}. Etkinlik detaylarını kontrol edin.`, `update:${crypto.randomUUID()}`);
  }
  if (next.status === "cancelled" && previous?.status === "published") notify(next, "update", next.guests.filter((guest) => guest.response !== "declined").map((guest) => guest.email), `Etkinlik iptal edildi: ${next.title}`, "Bu etkinlik iptal edildi. Katılım bağlantısı artık kullanılamaz.", `cancel:${crypto.randomUUID()}`);
  writeEvent(next);
  return next;
}

export function respondToEvent(id: string, email: string, response: "going" | "declined", now = Date.now()) {
  const event = readEvents().find((item) => item.id === id);
  if (!event || event.status !== "published" || Date.parse(event.endsAt) <= now) throw new Error("Bu etkinlik katılım yanıtı kabul etmiyor.");
  const guest = event.guests.find((item) => item.email === email.toLowerCase());
  if (!guest) throw new Error("Bu etkinlik için davetiniz bulunamadı.");
  if (guest.response === response) return;
  const next = { ...event, guests: event.guests.map((item) => item === guest ? { ...item, response } : item) };
  writeEvent(next);
  notify(next, "registration", [event.hostEmail], `${response === "going" ? "Katılım onayı" : "Katılım reddi"}: ${event.title}`, `${email} ${response === "going" ? "katılacak" : "katılmayacak"}.`, `response:${crypto.randomUUID()}`);
  if (response === "going") notify(next, "update", [email], `Katılımınız onaylandı: ${event.title}`, `${formatEventDate(event.startsAt)} · Etkinliği takviminize ekleyebilirsiniz.`, `confirmation:${crypto.randomUUID()}`);
}

export function joinEvent(id: string, email: string, now = Date.now()) {
  const event = readEvents().find((item) => item.id === id);
  const guest = event?.guests.find((item) => item.email === email.toLowerCase());
  if (!event || event.status !== "published" || !guest || guest.response !== "going" || event.mode !== "online" || !validMeetingUrl(event.meetingUrl) || Date.parse(event.endsAt) <= now) throw new Error("Katılım bağlantısı kullanılamıyor. Önce daveti onaylayın.");
  writeEvent({ ...event, guests: event.guests.map((item) => item === guest ? { ...item, joinedAt: new Date(now).toISOString() } : item) });
  return event.meetingUrl;
}

export function processEventReminders(now = Date.now()) {
  readEvents().filter((event) => event.status === "published" && Date.parse(event.startsAt) > now).forEach((event) => {
    // Only emit the nearest due reminder; reopening the panel must not send stale reminders in a burst.
    const due = event.reminders.filter((minutes) => Date.parse(event.startsAt) - minutes * 60_000 <= now).sort((a, b) => a - b)[0];
    if (due === undefined) return;
    notify(event, "reminder", event.guests.filter((guest) => guest.response === "going").map((guest) => guest.email), `Hatırlatma: ${event.title}`, `${formatEventDate(event.startsAt)} · Etkinliğiniz yaklaşıyor.`, `reminder:${event.startsAt}:${due}`);
  });
}

export function formatEventDate(value: string) {
  return new Date(value).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "medium", timeStyle: "short" });
}

export function eventDateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function calendarTime(value: string) { return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
function escapeCalendar(value: string) { return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,"); }
export function eventCalendar(event: ProgramEvent, detailUrl: string, options: { allDay?: boolean; reminders?: number[] } = {}) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Lidea//Program Events//TR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${event.id}@lideagirisim.com`, `DTSTAMP:${calendarTime(event.updatedAt)}`,
    options.allDay ? `DTSTART;VALUE=DATE:${eventDateKey(event.startsAt).replace(/-/g, "")}` : `DTSTART:${calendarTime(event.startsAt)}`,
    options.allDay ? `DTEND;VALUE=DATE:${eventDateKey(event.endsAt).replace(/-/g, "")}` : `DTEND:${calendarTime(event.endsAt)}`,
    `SUMMARY:${escapeCalendar(event.title)}`, `DESCRIPTION:${escapeCalendar(`${event.description}\n${detailUrl}`)}`,
    `LOCATION:${escapeCalendar(event.mode === "online" ? detailUrl : event.location)}`, `URL:${detailUrl}`,
    `STATUS:${event.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
    ...(options.reminders || []).flatMap((minutes) => ["BEGIN:VALARM", `TRIGGER:-PT${minutes}M`, "ACTION:DISPLAY", `DESCRIPTION:${escapeCalendar(event.title)}`, "END:VALARM"]),
    "END:VEVENT", "END:VCALENDAR"];
  // RFC 5545 lines are folded at 75 UTF-8 octets, without splitting Turkish characters.
  const encoder = new TextEncoder();
  return lines.map((line) => {
    let folded = "", size = 0;
    for (const char of line) {
      const bytes = encoder.encode(char).length;
      if (size + bytes > 75) { folded += "\r\n "; size = 1; }
      folded += char; size += bytes;
    }
    return folded;
  }).join("\r\n") + "\r\n";
}

export function googleCalendarUrl(event: ProgramEvent, detailUrl: string) {
  return `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: "TEMPLATE", text: event.title,
    dates: `${calendarTime(event.startsAt)}/${calendarTime(event.endsAt)}`, details: `${event.description}\n${detailUrl}`,
    location: event.mode === "online" ? detailUrl : event.location, ctz: "Europe/Istanbul" })}`;
}
