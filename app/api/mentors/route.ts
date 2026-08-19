import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    requirePermission(user.role, "mentors:manage");
    const mentors = await db.user.findMany({ where: { role: "MENTOR" }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ ok: true, mentors });
  } catch (error) {
    return apiError(error);
  }
}
