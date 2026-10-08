import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSessionUser } from "@/lib/auth";
import { apiError, unauthorized } from "@/lib/api";
import { db } from "@/lib/db";
import { platformEmails } from "@/lib/login";
import { requirePermission } from "@/lib/permissions";

const schema = z.object({ password: z.string().min(8).max(72) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) return unauthorized();
    requirePermission(admin.role, "applications:manage");
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success || Buffer.byteLength(parsed.data.password, "utf8") > 72) {
      return NextResponse.json({ ok: false, error: "Şifre en az 8 karakter ve en fazla 72 bayt olmalı." }, { status: 400 });
    }
    const { id } = await context.params;
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const email = await db.$transaction(async (tx) => {
      const application = await tx.application.findUnique({ where: { id }, include: { startup: true } });
      if (!application) throw new Error("APPLICATION_NOT_FOUND");
      if (application.status !== "ACCEPTED" || !application.startup) throw new Error("ACCEPTED_APPLICATION_REQUIRED");
      const email = application.email.trim().toLowerCase();
      if (platformEmails.includes(email)) throw new Error("ACCOUNT_ROLE_CONFLICT");
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing && existing.role !== "ENTREPRENEUR") throw new Error("ACCOUNT_ROLE_CONFLICT");
      const user = await tx.user.upsert({ where: { email },
        update: { passwordHash, active: true },
        create: { email, name: application.founder, passwordHash, role: "ENTREPRENEUR", active: true },
      });
      await tx.application.update({ where: { id }, data: { userId: user.id } });
      await tx.startup.update({ where: { id: application.startup.id }, data: { ownerId: user.id } });
      return email;
    });
    return NextResponse.json({ ok: true, email });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "APPLICATION_NOT_FOUND") return NextResponse.json({ ok: false, error: "Başvuru bulunamadı." }, { status: 404 });
    if (message === "ACCEPTED_APPLICATION_REQUIRED") return NextResponse.json({ ok: false, error: "Önce başvuruyu kabul edin." }, { status: 409 });
    if (message === "ACCOUNT_ROLE_CONFLICT") return NextResponse.json({ ok: false, error: "Bu e-posta başka bir yetkili hesaba ait." }, { status: 409 });
    return apiError(error);
  }
}
