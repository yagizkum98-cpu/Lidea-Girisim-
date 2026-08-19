import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { createProgramSchema } from "@/lib/validation/platform";

export async function GET() {
  try {
    const programs = await db.program.findMany({
      orderBy: { createdAt: "desc" },
      include: { stages: true },
    });
    return NextResponse.json({ ok: true, programs });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    requirePermission(user.role, "program:manage");
    const parsed = createProgramSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    const program = await db.program.create({ data: parsed.data });
    return NextResponse.json({ ok: true, program }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
