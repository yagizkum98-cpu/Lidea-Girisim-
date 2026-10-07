import { z } from "zod";
import { trainingDateKey } from "@/lib/trainings";

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).or(z.literal(""));
export const trainingUpdateSchema = z.object({
  title: z.string().trim().min(1).max(250), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: time, endTime: time, description: z.string().trim().max(4000).default(""),
  mode: z.enum(["online", "in-person"]), location: z.string().trim().max(500).default(""),
  meetingUrl: z.string().trim().max(2048).default(""), status: z.enum(["scheduled", "cancelled"]),
  reminders: z.array(z.union([z.literal(1440), z.literal(60), z.literal(10)])).transform((values) => [...new Set(values)]),
  adminReminders: z.boolean(),
}).superRefine((data, context) => {
  const parsedDate = new Date(`${data.date}T12:00:00+03:00`);
  if (!Number.isFinite(parsedDate.getTime()) || trainingDateKey(parsedDate) !== data.date) {
    context.addIssue({ code: "custom", path: ["date"], message: "Geçerli bir tarih girin." });
  }
  if ((data.startTime && (!data.endTime || data.endTime <= data.startTime)) || (!data.startTime && data.endTime)) {
    context.addIssue({ code: "custom", path: ["endTime"], message: "Başlangıç ve bitiş saatini birlikte girin; bitiş başlangıçtan sonra olmalı." });
  }
  if (data.meetingUrl) {
    let valid = false;
    try { valid = new URL(data.meetingUrl).protocol === "https:"; } catch { /* Invalid URL. */ }
    if (!valid) context.addIssue({ code: "custom", path: ["meetingUrl"], message: "https:// ile başlayan geçerli bir bağlantı girin." });
  }
});
