import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { TrainingSession, dueTrainingReminder, trainingJoinAvailable, trainingSchedule, trainingStartsAt, trainingDateKey } from "@/lib/trainings";
import { Training } from "@prisma/client";

const key = (value: string) => createHash("sha256").update(value).digest("hex");
const followId = (id: string, email: string) => `tf-${key(`${id}:${email.toLowerCase()}`)}`;
const clockTime = (value: Date) => value.toLocaleTimeString("en-GB", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });

export function trainingFromDatabase(row: Training): TrainingSession {
  const fallback = trainingSchedule.find((training) => training.id === row.id);
  return {
    id: row.id, title: row.title, week: row.week ?? fallback?.week ?? 0, date: trainingDateKey(row.startsAt),
    startTime: row.timeConfirmed ? clockTime(row.startsAt) : "", endTime: row.timeConfirmed && row.endsAt ? clockTime(row.endsAt) : "",
    description: row.description || "", mode: row.mode === "in-person" ? "in-person" : "online",
    location: row.location || "", meetingUrl: row.meetingUrl || "", status: row.status === "cancelled" ? "cancelled" : "scheduled",
    reminders: row.reminderMinutes, adminReminders: row.adminReminders, hostEmail: row.hostEmail || process.env.ADMIN_EMAIL || "admin@lideagirisim.com",
  };
}

export async function listTrainings(email?: string, admin = false) {
  const rows = await db.training.findMany({ where: { id: { in: trainingSchedule.map((training) => training.id) } },
    include: { followers: admin ? true : { where: { email: email?.toLowerCase() || "" } } } });
  return trainingSchedule.map((fallback) => {
    const row = rows.find((item) => item.id === fallback.id);
    if (!row) return { ...fallback, following: false, followerCount: 0, joinedCount: 0 };
    const own = row.followers.find((follow) => follow.email === email?.toLowerCase());
    return { ...trainingFromDatabase(row), following: own?.following || false, joinedAt: own?.joinedAt?.toISOString() || "",
      ...(admin ? { followerCount: row.followers.filter((follow) => follow.following).length, joinedCount: row.followers.filter((follow) => follow.joinedAt).length } : {}) };
  });
}

async function trainingData(training: TrainingSession) {
  const programId = process.env.TRAINING_PROGRAM_ID || "program-3";
  if (!await db.program.findUnique({ where: { id: programId } })) throw new Error("TRAINING_PROGRAM_NOT_FOUND");
  return {
    programId, title: training.title, week: training.week, description: training.description,
    startsAt: trainingStartsAt(training), endsAt: training.endTime ? new Date(`${training.date}T${training.endTime}:00+03:00`) : null,
    timeConfirmed: Boolean(training.startTime), mode: training.mode, location: training.location, meetingUrl: training.meetingUrl,
    status: training.status, reminderMinutes: training.reminders, adminReminders: training.adminReminders, hostEmail: training.hostEmail,
  };
}

async function notifyTraining(training: TrainingSession, email: string, type: "EVENT" | "REMINDER", title: string, message: string, suffix: string, database: Pick<typeof db, "notification"> = db) {
  const id = `tn-${key(`${training.id}:${email}:${suffix}`)}`;
  if (await database.notification.findUnique({ where: { id } })) return false;
  try {
    await database.notification.create({ data: { id, trainingId: training.id, title, message, type, status: "SENT", sentAt: new Date(),
      recipients: { create: { email, role: email === training.hostEmail ? "PROGRAM_ADMIN" : "ENTREPRENEUR" } } } });
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return false;
    throw error;
  }
}

export async function saveTraining(training: TrainingSession) {
  const data = await trainingData(training);
  return db.$transaction(async (tx) => {
    const previous = await tx.training.findUnique({ where: { id: training.id }, include: { followers: { where: { following: true } } } });
    const before = previous ? trainingFromDatabase(previous) : null;
    const fields = ["title", "date", "startTime", "endTime", "description", "mode", "location", "meetingUrl", "status", "reminders", "adminReminders", "hostEmail"] as const;
    const changed = !before || fields.some((field) => JSON.stringify(before[field]) !== JSON.stringify(training[field]));
    const result = await tx.training.upsert({ where: { id: training.id }, create: { id: training.id, ...data }, update: data });
    if (changed) {
      const emails = [...new Set([training.hostEmail, ...(previous?.followers.map((follow) => follow.email) || [])])];
      for (const email of emails.filter(Boolean)) await notifyTraining(training, email, "EVENT",
        `${training.status === "cancelled" ? "Eğitim iptal edildi" : "Eğitim güncellendi"}: ${training.title}`,
        `${training.date}${training.startTime ? ` · ${training.startTime}` : " · Saat belirlenecek"}. Güncel detayları eğitim takviminden takip edin.`, `update:${result.updatedAt.toISOString()}`, tx);
    }
    return trainingFromDatabase(result);
  });
}

async function ensureTraining(id: string) {
  const current = await db.training.findUnique({ where: { id } });
  if (current) return trainingFromDatabase(current);
  const training = trainingSchedule.find((item) => item.id === id);
  if (!training) throw new Error("TRAINING_NOT_FOUND");
  const complete = { ...training, hostEmail: process.env.ADMIN_EMAIL || "admin@lideagirisim.com" };
  const data = await trainingData(complete);
  const row = await db.training.upsert({ where: { id }, update: {}, create: { id, ...data } });
  return trainingFromDatabase(row);
}

export async function followTraining(id: string, email: string, following: boolean) {
  const training = await ensureTraining(id);
  if (following && training.status === "cancelled") throw new Error("TRAINING_CANCELLED");
  const normalized = email.toLowerCase();
  return db.trainingFollow.upsert({ where: { id: followId(id, normalized) }, update: { following },
    create: { id: followId(id, normalized), trainingId: id, email: normalized, following } });
}

export async function joinTraining(id: string, email: string) {
  const row = await db.training.findUnique({ where: { id } });
  if (!row) throw new Error("TRAINING_NOT_FOUND");
  const training = trainingFromDatabase(row);
  if (!trainingJoinAvailable(training)) throw new Error("TRAINING_JOIN_UNAVAILABLE");
  const normalized = email.toLowerCase();
  await db.trainingFollow.upsert({ where: { id: followId(id, normalized) }, update: { joinedAt: new Date() },
    create: { id: followId(id, normalized), trainingId: id, email: normalized, following: false, joinedAt: new Date() } });
  return training.meetingUrl;
}

export async function processTrainingReminders(now = Date.now()) {
  const rows = await db.training.findMany({ where: { id: { in: trainingSchedule.map((training) => training.id) }, timeConfirmed: true, status: "scheduled", startsAt: { gt: new Date(now), lte: new Date(now + 86_400_000) } },
    include: { followers: { where: { following: true } } } });
  let sent = 0;
  for (const row of rows) {
    const training = trainingFromDatabase(row), minutes = dueTrainingReminder(training, now);
    if (minutes === undefined) continue;
    const emails = [...new Set([...row.followers.map((follow) => follow.email), ...(training.adminReminders ? [training.hostEmail] : [])])];
    for (const email of emails.filter(Boolean)) {
      if (await notifyTraining(training, email, "REMINDER", `Eğitim hatırlatması: ${training.title}`,
        `${training.date} · ${training.startTime} (Türkiye saati). Eğitim takviminden katılabilirsiniz.`, `reminder:${row.startsAt.toISOString()}:${minutes}`)) sent++;
    }
  }
  return { sent };
}
