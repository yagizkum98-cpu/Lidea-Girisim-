import { z } from "zod";

const optionalText = (max = 2000) => z.string().trim().max(max).optional().default("");
const requiredText = (max = 2000) => z.string().trim().min(1).max(max);

export const lovableApplicationSchema = z.object({
  fullName: requiredText(100), email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  phone: requiredText(30), city: requiredText(100), birthYear: optionalText(4), education: optionalText(100),
  currentStatus: optionalText(100), linkedin: optionalText(300), roleInStartup: requiredText(200), heardFrom: optionalText(100),
  startupName: requiredText(150), oneLiner: requiredText(150), problem: requiredText(1000), solution: requiredText(),
  targetCustomer: requiredText(), sector: optionalText(100), businessModel: optionalText(50), ideaAge: optionalText(50),
  customerInterviews: optionalText(50), companyStatus: optionalText(100), previousSupport: z.array(z.string().max(100)).max(10).default([]),
  previousPrograms: optionalText(1000), links: optionalText(500), trlLevel: z.enum(["TRL 1", "TRL 2", "TRL 3", "TRL 4", "TRL 5", "TRL 6", "TRL 7", "TRL 8", "TRL 9", "Teknoloji geliştirmiyoruz"]),
  trlEvidence: requiredText(), teamSize: requiredText(50), founders: requiredText(), hasTechnical: optionalText(100),
  teamLinkedin: optionalText(1000), teamOrigin: optionalText(), missingSkill: optionalText(1000), equityDiscussed: optionalText(100),
  weeklyCommitment: requiredText(50), physicalDays: requiredText(100), hoursPerWeek: optionalText(50),
  last30Days: requiredText(), expectation: requiredText(), anythingElse: optionalText(),
  consentTruth: z.literal(true), consentCommitment: z.literal(true), consentKvkk: z.literal(true),
  consentMedia: z.boolean().default(false), consentNewsletter: z.boolean().default(false),
}).superRefine((data, context) => {
  if (!/^(?:Tek kişi \(solopreneur\)|[2-4] kişi|5\+ kişi)$/.test(data.teamSize)) {
    context.addIssue({ code: "custom", path: ["teamSize"], message: "Geçersiz ekip büyüklüğü." });
  }
  if (data.birthYear && !/^(19|20)\d{2}$/.test(data.birthYear)) {
    context.addIssue({ code: "custom", path: ["birthYear"], message: "Geçersiz doğum yılı." });
  }
});

export const lovableSubmissionSchema = z.object({
  submissionId: z.string().trim().min(1).max(200),
  submittedAt: z.string().datetime().optional(),
  data: lovableApplicationSchema,
});
export type LovableSubmission = z.infer<typeof lovableSubmissionSchema>;
