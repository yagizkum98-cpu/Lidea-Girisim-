import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { getAdminReportSummary } from "@/lib/services/reports-service";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    requirePermission(user.role, "reports:read");
    const programId = new URL(req.url).searchParams.get("programId") || undefined;
    const summary = await getAdminReportSummary(programId);
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return apiError(error);
  }
}
