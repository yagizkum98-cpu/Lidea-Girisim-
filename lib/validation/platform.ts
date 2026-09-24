import { z } from "zod";
import { sectorOptions } from "@/lib/application-options";
import turkeyLocations from "@/lib/turkey-locations.json";

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
  password: z.string().min(8),
  phone: z.string().optional(),
  startupName: z.string().min(2),
  sector: z.enum(sectorOptions),
  city: z.string().min(1),
  district: z.string().min(1),
  stage: z.string().min(1),
  website: z.string().optional(),
  teamSize: z.number().int().positive().default(1),
  problem: z.string().optional(),
  solution: z.string().optional(),
    targetMarket: z.string().optional(),
    businessModel: z.string().optional(),
    competitors: z.string().optional(),
    differentiation: z.string().optional(),
    traction: z.string().optional(),
    futureGoals: z.string().optional(),
  programExpectations: z.array(
    z.enum(["Satış ve Pazarlama", "Mentorluk", "Eğitim", "Network", "Diğer"]),
  ).default([]),
  programExpectationOther: z.string().optional(),
  kvkkAccepted: z.literal(true, { error: "KVKK Aydınlatma Metni okunmalıdır." }),
}).superRefine((data, context) => {
  const province = turkeyLocations.find((location) => location.province === data.city);
  if (!province?.districts.includes(data.district)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["district"],
      message: "Seçilen ilçe bu ile bağlı değildir.",
    });
  }

  if (data.programExpectations.includes("Diğer") && !data.programExpectationOther?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["programExpectationOther"],
      message: "Diğer seçildiğinde açıklama zorunludur.",
    });
  }
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
