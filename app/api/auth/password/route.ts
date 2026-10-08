import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { credentialVersion, getSessionUser, setSessionCookie } from "@/lib/auth";
import { apiError, unauthorized } from "@/lib/api";
import { db } from "@/lib/db";
import { platformEmails } from "@/lib/login";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (platformEmails.includes(user.email)) return NextResponse.json({ ok: false, error: "Bu hesabın şifresi platform tarafından tanımlıdır." }, { status: 403 });
    const parsed = z.object({ currentPassword: z.string().min(1).max(72), nextPassword: z.string().min(8).max(72) }).safeParse(await request.json());
    if (!parsed.success || Buffer.byteLength(parsed.data.nextPassword, "utf8") > 72) return NextResponse.json({ ok: false, error: "Yeni şifre en az 8 karakter ve en fazla 72 bayt olmalı." }, { status: 400 });
    const stored = await db.user.findUnique({ where: { id: user.id } });
    if (!stored || !(await bcrypt.compare(parsed.data.currentPassword, stored.passwordHash))) return NextResponse.json({ ok: false, error: "Mevcut şifre hatalı." }, { status: 401 });
    const passwordHash = await bcrypt.hash(parsed.data.nextPassword, 12);
    await db.user.update({ where: { id: user.id }, data: { passwordHash } });
    await setSessionCookie({ ...user, credentialVersion: credentialVersion(passwordHash) });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
