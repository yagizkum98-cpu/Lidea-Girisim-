export type TrainingSession = {
  id: string; title: string; week: number; date: string; startTime: string; endTime: string;
  description: string; mode: "online" | "in-person"; location: string; meetingUrl: string;
  status: "scheduled" | "cancelled"; reminders: number[]; adminReminders: boolean; hostEmail: string;
  following?: boolean; joinedAt?: string; followerCount?: number; joinedCount?: number;
};

const curriculum = [
  ["2026-11-02", "Ekip Tanışma ve Problem Seçimi"],
  ["2026-11-04", "Müşteri Keşfi / The Mom Test"],
  ["2026-11-11", "Çözüm Daraltma ve Konsept Testi"],
  ["2026-11-18", "İş Modeli, Fiyat ve Pazar"],
  ["2026-11-25", "İlk Temas ve Ölçeklenmeyen Erişim"],
  ["2026-12-02", "Öğrenme Panosu ve Anlatıya Hazırlık"],
  ["2026-12-09", "Şirket Zamanlaması, BİGG ve KOSGEB"],
  ["2026-12-16", "3 Dakika Anlatı Mimarisi, Q&A ve Dayanıklılık"],
  ["2026-12-19", "DEMO DAY"],
];

export const trainingSchedule: TrainingSession[] = curriculum.map(([date, title], index) => ({
  id: `pre-incubation-2026-${index + 1}`, title, week: index < 8 ? index + 1 : 0, date,
  startTime: "", endTime: "", description: "", mode: index < 8 ? "online" : "in-person",
  location: "", meetingUrl: "", status: "scheduled", reminders: [1440, 60, 10], adminReminders: true, hostEmail: "",
}));

export function trainingDate(value: string, weekday = false) {
  return new Date(`${value}T12:00:00+03:00`).toLocaleDateString("tr-TR", weekday
    ? { timeZone: "Europe/Istanbul", weekday: "long" }
    : { timeZone: "Europe/Istanbul", day: "2-digit", month: "long", year: "numeric" });
}

export function trainingDateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

export function trainingStartsAt(training: TrainingSession) {
  return new Date(`${training.date}T${training.startTime || "00:00"}:00+03:00`);
}

export function trainingIsPast(training: TrainingSession, now = Date.now()) {
  return training.startTime && training.endTime
    ? new Date(`${training.date}T${training.endTime}:00+03:00`).getTime() <= now
    : training.date < trainingDateKey(new Date(now));
}

export function trainingJoinAvailable(training: TrainingSession, now = Date.now()) {
  if (training.mode !== "online" || training.status === "cancelled" || trainingIsPast(training, now)) return false;
  try { return new URL(training.meetingUrl).protocol === "https:"; } catch { return false; }
}

export function dueTrainingReminder(training: TrainingSession, now = Date.now()) {
  if (!training.startTime || training.status === "cancelled") return undefined;
  const starts = trainingStartsAt(training).getTime();
  if (starts <= now) return undefined;
  return [...training.reminders].filter((minutes) => starts - minutes * 60_000 <= now).sort((a, b) => a - b)[0];
}

export function publicTraining(training: TrainingSession) {
  const { id, title, week, date, startTime, endTime, mode, status } = training;
  return { id, title, week, date, startTime, endTime, mode, status };
}

export function trainingWeekStart(date: string) {
  const value = new Date(`${date}T12:00:00+03:00`);
  value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7));
  return value.toISOString().slice(0, 10);
}
