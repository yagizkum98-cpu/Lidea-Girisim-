import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { LovableSubmission } from "@/lib/validation/lovable-application";

export function externalApplicationNumber(submissionId: string) {
  return `LID-ONK-${createHash("sha256").update(submissionId).digest("hex")}`;
}

export async function importLovableApplication(input: LovableSubmission) {
  const applicationNo = externalApplicationNumber(input.submissionId);
  const existing = await db.application.findUnique({ where: { applicationNo } });
  if (existing) return { application: existing, duplicate: true };
  const programId = process.env.LOVABLE_APPLICATION_PROGRAM_ID || "program-3";
  const program = await db.program.findUnique({ where: { id: programId } });
  if (!program) throw new Error("INTAKE_PROGRAM_NOT_FOUND");
  if (!program.applicationOpen) throw new Error("INTAKE_CLOSED");
  const data = input.data;
  const level = Number(data.trlLevel.replace("TRL ", ""));
  const stage = !Number.isFinite(level) || level <= 2 ? "Fikir" : level <= 5 ? "Prototip" : level <= 7 ? "MVP" : "İlk Müşteri";
  const teamSize = data.teamSize.startsWith("Tek kişi") ? 1 : Number(data.teamSize.charAt(0));
  try {
    const application = await db.application.create({
      data: {
        applicationNo, programId, status: "NEW", founder: data.fullName, email: data.email, phone: data.phone,
        startupName: data.startupName, sector: data.sector || "Diğer", city: data.city, stage, teamSize,
        problem: data.problem, solution: data.solution, targetMarket: data.targetCustomer, businessModel: data.businessModel,
        traction: data.last30Days, programExpectations: ["Diğer"], programExpectationOther: data.expectation,
        kvkkAccepted: true, kvkkAcceptedAt: input.submittedAt ? new Date(input.submittedAt) : new Date(),
        externalSource: "lovable-onkulucka", externalPayload: data,
      },
    });
    return { application, duplicate: false };
  } catch (error) {
    // Concurrent webhook deliveries can race against the initial duplicate check.
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const duplicate = await db.application.findUnique({ where: { applicationNo } });
      if (duplicate) return { application: duplicate, duplicate: true };
    }
    throw error;
  }
}
