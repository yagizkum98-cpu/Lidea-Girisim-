import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    requirePermission(user.role, "startups:manage");
    const startups = await db.startup.findMany({
      orderBy: { createdAt: "desc" },
      include: { owner: true, mentorTasks: { include: { mentor: true, sessions: true } } },
    });
    return NextResponse.json({ ok: true, startups });
  } catch (error) {
    return apiError(error);
  }
}
