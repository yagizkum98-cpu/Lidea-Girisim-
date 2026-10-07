import { normalizeNotification, readNotifications, saveNotification } from "@/lib/notifications";
import { TrainingSession, trainingSchedule, dueTrainingReminder, trainingJoinAvailable } from "@/lib/trainings";
import { trainingUpdateSchema } from "@/lib/validation/training";

export const trainingsUpdated = "lidea-trainings-updated";
const trainingsKey = "lidea-training-schedule";
const followsKey = "lidea-training-follows";
let processingReminders = false;
type Follow = { trainingId: string; email: string; following: boolean; joinedAt: string };

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(window.localStorage.getItem(key) || "null") || fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new Event(trainingsUpdated));
}

export function readLocalTrainings(email = "", admin = false): TrainingSession[] {
  const saved = read<TrainingSession[]>(trainingsKey, []), follows = read<Follow[]>(followsKey, []);
  return trainingSchedule.map((defaultTraining) => {
    const training = saved.find((item) => item.id === defaultTraining.id) || defaultTraining;
    const guests = follows.filter((follow) => follow.trainingId === training.id);
    const own = guests.find((follow) => follow.email === email.toLowerCase());
    return { ...training, following: own?.following || false, joinedAt: own?.joinedAt || "",
      ...(admin ? { followerCount: guests.filter((follow) => follow.following).length, joinedCount: guests.filter((follow) => follow.joinedAt).length } : {}) };
  });
}

function localTrainingNotification(training: TrainingSession, email: string, reminder: boolean, suffix: string) {
  const id = `training:${training.id}:${suffix}:${email}`;
  if (readNotifications().some((notification) => notification.id === id)) return;
  saveNotification(normalizeNotification({ id, trainingId: training.id, title: `${reminder ? "Eğitim hatırlatması" : training.status === "cancelled" ? "Eğitim iptal edildi" : "Eğitim güncellendi"}: ${training.title}`,
    message: `${training.date}${training.startTime ? ` · ${training.startTime}` : " · Saat belirlenecek"}. Eğitim takvimini kontrol edin.`,
    type: reminder ? "Hatırlatma" : "Etkinlik", status: "Gönderildi", channels: ["Platform İçi"], sentAt: new Date().toISOString(),
    recipients: [{ name: email, email, role: email === training.hostEmail ? "Admin" : "Girişimci", read: false, readAt: "" }],
  }));
}

export function saveLocalTraining(training: TrainingSession) {
  trainingUpdateSchema.parse(training);
  if (!trainingSchedule.some((item) => item.id === training.id)) throw new Error("Eğitim bulunamadı.");
  const saved = read<TrainingSession[]>(trainingsKey, []);
  const follows = read<Follow[]>(followsKey, []).filter((follow) => follow.trainingId === training.id && follow.following);
  write(trainingsKey, [...saved.filter((item) => item.id !== training.id), training]);
  const emails = [...new Set([training.hostEmail, ...follows.map((follow) => follow.email)].filter(Boolean))];
  const revision = crypto.randomUUID();
  emails.forEach((email) => localTrainingNotification(training, email, false, `update:${revision}`));
}

export function followLocalTraining(id: string, email: string, following: boolean) {
  const training = readLocalTrainings().find((item) => item.id === id);
  if (!training || (following && training.status === "cancelled")) throw new Error("Bu eğitim takip edilemiyor.");
  const normalized = email.toLowerCase(), follows = read<Follow[]>(followsKey, []);
  const previous = follows.find((follow) => follow.trainingId === id && follow.email === normalized);
  write(followsKey, [...follows.filter((follow) => follow !== previous), { trainingId: id, email: normalized, following, joinedAt: previous?.joinedAt || "" }]);
}

export function joinLocalTraining(id: string, email: string, now = Date.now()) {
  const training = readLocalTrainings().find((item) => item.id === id);
  if (!training || !trainingJoinAvailable(training, now)) throw new Error("Eğitim bağlantısı henüz hazır değil veya eğitim sona erdi.");
  const normalized = email.toLowerCase(), follows = read<Follow[]>(followsKey, []);
  const previous = follows.find((follow) => follow.trainingId === id && follow.email === normalized);
  write(followsKey, [...follows.filter((follow) => follow !== previous), { trainingId: id, email: normalized, following: previous?.following || false, joinedAt: new Date(now).toISOString() }]);
  return training.meetingUrl;
}

export function processLocalTrainingReminders(now = Date.now()) {
  if (processingReminders) return;
  processingReminders = true;
  try {
  const follows = read<Follow[]>(followsKey, []);
  readLocalTrainings().forEach((training) => {
    const minutes = dueTrainingReminder(training, now);
    if (minutes === undefined) return;
    const emails = [...new Set([...follows.filter((follow) => follow.trainingId === training.id && follow.following).map((follow) => follow.email), ...(training.adminReminders && training.hostEmail ? [training.hostEmail] : [])])];
    emails.forEach((email) => localTrainingNotification(training, email, true, `reminder:${training.date}:${training.startTime}:${minutes}`));
  });
  } finally { processingReminders = false; }
}
