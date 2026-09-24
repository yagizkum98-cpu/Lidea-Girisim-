import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { assignEvaluator } from "@/lib/services/applications-service";
import { assignEvaluatorSchema } from "@/lib/validation/platform";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    requirePermission(user.role, "applications:manage");
    const parsed = assignEvaluatorSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    const assignment = await assignEvaluator(
      parsed.data.applicationId,
      parsed.data.evaluatorId,
      parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    );
    return NextResponse.json({ ok: true, assignment }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
