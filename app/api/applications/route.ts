import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { listApplications } from "@/lib/services/applications-service";
import { createApplicationSchema } from "@/lib/validation/platform";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    requirePermission(user.role, "applications:manage");
    const applications = await listApplications();
    return NextResponse.json({ ok: true, applications });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createApplicationSchema.safeParse({
      ...body,
      teamSize: Number(body.teamSize || 1),
    });

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const application = await db.application.create({
      data: {
        ...parsed.data,
        applicationNo: `LID-${Date.now().toString().slice(-8)}`,
      },
    });

    return NextResponse.json({ ok: true, application }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
