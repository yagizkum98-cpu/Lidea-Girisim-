import { z } from "zod";

export const createProgramSchema = z.object({
  name: z.string().min(2),
  period: z.string().min(1),
  description: z.string().optional(),
  quota: z.number().int().positive().default(40),
});

export const createApplicationSchema = z.object({
  programId: z.string().min(1),
  founder: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  startupName: z.string().min(2),
  sector: z.string().min(1),
  city: z.string().optional(),
  stage: z.string().min(1),
  website: z.string().optional(),
  teamSize: z.number().int().positive().default(1),
  problem: z.string().optional(),
  solution: z.string().optional(),
  targetMarket: z.string().optional(),
  businessModel: z.string().optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["NEW", "UNDER_REVIEW", "MISSING_INFO", "SENT_TO_JURY", "ACCEPTED", "WAITLIST", "REJECTED"]),
});

export const assignEvaluatorSchema = z.object({
  applicationId: z.string().min(1),
  evaluatorId: z.string().min(1),
  dueDate: z.string().datetime().optional(),
});

export const createNotificationSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(2),
  type: z.enum(["ANNOUNCEMENT", "REMINDER", "STATUS_UPDATE", "DOCUMENT_TASK", "EVENT"]),
  status: z.enum(["DRAFT", "SENT", "SCHEDULED", "FAILED"]).default("DRAFT"),
  recipientEmails: z.array(z.string().email()).default([]),
});
