import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api";
import { getAdminSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAdminSessionUser();
    if (!user) return unauthorized();
    requirePermission(user.role, "startups:manage");

    const { id } = await params;
    const startup = await db.startup.findFirst({ where: { OR: [{ id }, { applicationId: id }] }, select: { id: true } });
    if (!startup) return NextResponse.json({ ok: false, error: "Girişim bulunamadı." }, { status: 404 });

    const decks = await db.pitchDeck.findMany({
      where: { startupId: startup.id },
      orderBy: { version: "desc" },
      select: { id: true, version: true, fileName: true, uploadedAt: true },
    });
    return NextResponse.json({ ok: true, startupId: startup.id, decks });
  } catch (error) {
    return apiError(error);
  }
}
