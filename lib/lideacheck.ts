import { Startup } from "@/lib/startups";

export type LideaCheckTrack = "Ön Kuluçka" | "Kuluçka";
export type AttendanceStatus = "Geldi" | "Gelmedi";
export type DemoDayDecision = "Aday" | "Onaylandı" | "Reddedildi";

export type AttendanceRecord = {
  id: string;
  startupId: string;
  startupName: string;
  track: LideaCheckTrack;
  week: number;
  date: string;
  quota: number;
  status: AttendanceStatus;
  note: string;
  createdAt: string;
};

export type DemoDayCandidate = {
  id: string;
  startupId: string;
  startupName: string;
  track: LideaCheckTrack;
  week: number;
  status: DemoDayDecision;
  note: string;
  announcement: string;
  decidedAt: string;
  createdAt: string;
};

export const attendanceStorageKey = "lidea-check-attendance";
export const demoDayStorageKey = "lidea-check-demoday";
export const lideaCheckEventName = "lidea-check-updated";

export const lideaCheckTracks: LideaCheckTrack[] = ["Ön Kuluçka", "Kuluçka"];
export const attendanceStatuses: AttendanceStatus[] = ["Geldi", "Gelmedi"];

export function emptyAttendanceStats() {
  return {
    total: 0,
    present: 0,
    absent: 0,
    quota: 0,
    attendanceRate: 0,
  };
}

function readCollection<T>(key: string, normalize: (item: Record<string, unknown>) => T) {
  if (typeof window === "undefined") return [];
  const saved = window.localStorage.getItem(key);
  if (!saved) {
    window.localStorage.setItem(key, JSON.stringify([]));
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    const records = Array.isArray(parsed) ? parsed.map((item) => normalize(item)) : [];
    window.localStorage.setItem(key, JSON.stringify(records));
    return records;
  } catch {
    window.localStorage.setItem(key, JSON.stringify([]));
    return [];
  }
}

function writeCollection<T>(key: string, records: T[]) {
  window.localStorage.setItem(key, JSON.stringify(records));
  window.dispatchEvent(new Event(lideaCheckEventName));
}

export function normalizeAttendance(raw: Record<string, unknown>) {
  return {
    id: String(raw.id || crypto.randomUUID()),
    startupId: String(raw.startupId || ""),
    startupName: String(raw.startupName || "Girişim"),
    track: (lideaCheckTracks.includes(raw.track as LideaCheckTrack) ? raw.track : "Ön Kuluçka") as LideaCheckTrack,
    week: Math.max(1, Number(raw.week || 1)),
    date: String(raw.date || new Date().toISOString().slice(0, 10)),
    quota: Math.max(0, Number(raw.quota || 0)),
    status: (raw.status === "Gelmedi" ? "Gelmedi" : "Geldi") as AttendanceStatus,
    note: String(raw.note || ""),
    createdAt: String(raw.createdAt || new Date().toISOString()),
  } satisfies AttendanceRecord;
}

export function normalizeDemoDayCandidate(raw: Record<string, unknown>) {
  const status = ["Aday", "Onaylandı", "Reddedildi"].includes(String(raw.status))
    ? (raw.status as DemoDayDecision)
    : "Aday";

  return {
    id: String(raw.id || crypto.randomUUID()),
    startupId: String(raw.startupId || ""),
    startupName: String(raw.startupName || "Girişim"),
    track: (lideaCheckTracks.includes(raw.track as LideaCheckTrack) ? raw.track : "Ön Kuluçka") as LideaCheckTrack,
    week: Math.max(1, Number(raw.week || 1)),
    status,
    note: String(raw.note || ""),
    announcement: String(raw.announcement || defaultDemoDayAnnouncement(status)),
    decidedAt: String(raw.decidedAt || ""),
    createdAt: String(raw.createdAt || new Date().toISOString()),
  } satisfies DemoDayCandidate;
}

export function readAttendanceRecords() {
  return readCollection(attendanceStorageKey, normalizeAttendance);
}

export function writeAttendanceRecords(records: AttendanceRecord[]) {
  writeCollection(attendanceStorageKey, records);
}

export function readDemoDayCandidates() {
  return readCollection(demoDayStorageKey, normalizeDemoDayCandidate);
}

export function writeDemoDayCandidates(records: DemoDayCandidate[]) {
  writeCollection(demoDayStorageKey, records);
}

export function attendanceStats(records: AttendanceRecord[], track?: LideaCheckTrack) {
  const scoped = track ? records.filter((record) => record.track === track) : records;
  const present = scoped.filter((record) => record.status === "Geldi").length;
  const absent = scoped.filter((record) => record.status === "Gelmedi").length;
  const quota = scoped.reduce((total, record) => total + record.quota, 0);
  const total = scoped.length;

  return {
    total,
    present,
    absent,
    quota,
    attendanceRate: total ? Math.round((present / total) * 100) : 0,
  };
}

export function defaultDemoDayAnnouncement(status: DemoDayDecision) {
  if (status === "Onaylandı") return "Demo Day final listesinde yer almaya devam ediyor.";
  if (status === "Reddedildi") return "Demo Day final listesine alınmadı. Stant açabilirsiniz.";
  return "Demo Day son aşama değerlendirme listesinde aday olarak yer alıyor.";
}

export function uniqueStartupOptions(startups: Startup[]) {
  const seen = new Set<string>();
  return startups.filter((startup) => {
    if (seen.has(startup.id)) return false;
    seen.add(startup.id);
    return true;
  });
}
