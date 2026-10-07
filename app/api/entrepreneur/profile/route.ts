import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStartupProfileCompletion, normalizeStartup } from "@/lib/startups";
import { startupProfileSchema } from "@/lib/validation/startup-profile";

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role !== "ENTREPRENEUR" || user.id === "platform-test-entrepreneur") return NextResponse.json({ ok: false, error: "Bu oturum sunucu profilini düzenleyemez." }, { status: 403 });
    const body = await request.text();
    if (body.length > 1_500_000) return NextResponse.json({ ok: false, error: "Dosya çok büyük." }, { status: 413 });
    let raw: unknown;
    try { raw = JSON.parse(body); } catch { return NextResponse.json({ ok: false, error: "Geçersiz veri." }, { status: 400 }); }
    const parsed = startupProfileSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0].message }, { status: 400 });
    const application = await db.application.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { startup: { include: { members: true } } } });
    const current = application?.startup;
    if (!current || (current.ownerId && current.ownerId !== user.id)) return NextResponse.json({ ok: false, error: "Düzenlenebilir girişim kaydı bulunamadı." }, { status: 404 });
    const { members, founder, traction, ...fields } = parsed.data;
    const progress = getStartupProfileCompletion(normalizeStartup({ name: current.name, logo: current.logo || "", sector: current.sector || "", stage: current.stage || "", website: current.website || "", problem: current.problem || "", solution: current.solution || "", businessModel: current.businessModel || "", members: current.members.map((member) => ({ ...member, title: member.title || "" })), founder: application.founder, traction: application.traction || "", ...parsed.data })).percent;
    await db.$transaction(async (tx) => {
      await tx.startup.update({ where: { id: current.id }, data: { ...fields, progress } });
      if (founder !== undefined || traction !== undefined) await tx.application.update({ where: { id: application.id }, data: { ...(founder !== undefined ? { founder } : {}), ...(traction !== undefined ? { traction } : {}) } });
      if (members !== undefined) {
        await tx.startupMember.deleteMany({ where: { startupId: current.id } });
        for (const member of members) await tx.startupMember.create({ data: { startupId: current.id, name: member.name, role: member.role, title: member.title, active: member.active } });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
