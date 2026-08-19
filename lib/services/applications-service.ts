import { db } from "@/lib/db";

export async function listApplications() {
  return db.application.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      program: true,
      assignments: { include: { evaluator: true } },
      documents: true,
    },
  });
}

export async function acceptApplication(applicationId: string, adminUserId?: string) {
  return db.$transaction(async (tx) => {
    const application = await tx.application.update({
      where: { id: applicationId },
      data: { status: "ACCEPTED" },
    });

    const startup = await tx.startup.upsert({
      where: { applicationId },
      update: {},
      create: {
        applicationId,
        programId: application.programId,
        ownerId: application.userId,
        name: application.startupName,
        slug: application.startupName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        sector: application.sector,
        stage: application.stage,
        website: application.website,
        problem: application.problem,
        solution: application.solution,
        businessModel: application.businessModel,
        progress: 15,
      },
    });

    await tx.statusHistory.create({
      data: {
        applicationId,
        oldStatus: "UNDER_REVIEW",
        newStatus: "ACCEPTED",
        changedById: adminUserId,
      },
    });

    return { application, startup };
  });
}

export async function assignEvaluator(applicationId: string, evaluatorId: string, dueDate?: Date) {
  return db.evaluationAssignment.upsert({
    where: { applicationId_evaluatorId: { applicationId, evaluatorId } },
    update: { dueDate },
    create: { applicationId, evaluatorId, dueDate },
  });
}
