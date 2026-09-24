import { db } from "@/lib/db";

export async function getAdminReportSummary(programId?: string) {
  const where = programId ? { programId } : {};
  const [applications, accepted, startups, evaluators, mentors, notifications] = await Promise.all([
    db.application.count({ where }),
    db.application.count({ where: { ...where, status: "ACCEPTED" } }),
    db.startup.count({ where }),
    db.user.count({ where: { role: { in: ["EVALUATOR", "JURY"] }, active: true } }),
    db.user.count({ where: { role: "MENTOR", active: true } }),
    db.notification.count(),
  ]);

  return { applications, accepted, startups, evaluators, mentors, notifications };
}
