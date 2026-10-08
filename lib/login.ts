import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { credentialVersion, getSessionUser, setSessionCookie } from "@/lib/auth";
import { canEnterPanel, isPreviewUser, SessionUser } from "@/lib/session";
import { apiError } from "@/lib/api";

const platformPasswordHash = "$2b$12$VPNgpHr5FwSV1DlVpwX5de/Fu587IJBA/yAfwlrvp0/tiz7QIpSnG";
export const platformEmails = ["admin@lideagirisim.com", "tester@lideagirisim.com"];
const loginSchema = z.object({ email: z.string().trim().email().transform((email) => email.toLowerCase()), password: z.string().min(1).max(72) });

export function portalUser(user: SessionUser) {
  return { name: user.name, email: user.email, role: "Girişimci" as const, localWorkspace: isPreviewUser(user) };
}

export async function login(request: Request, panel: string) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ ok: false, error: "E-posta ve şifrenizi kontrol edin." }, { status: 400 });
    const { email, password } = parsed.data;
    if (Buffer.byteLength(password, "utf8") > 72) return invalidCredentials();
    let user: SessionUser;
    if (platformEmails.includes(email)) {
      if (!(await bcrypt.compare(password, platformPasswordHash))) return invalidCredentials();
      user = { id: email === platformEmails[0] ? "platform-super-admin" : "platform-test-entrepreneur", email,
        name: email === platformEmails[0] ? "Süper Admin" : "Tester", role: "SUPER_ADMIN" };
    } else {
      const stored = await db.user.findUnique({ where: { email } });
      if (!stored?.active || !(await bcrypt.compare(password, stored.passwordHash))) return invalidCredentials();
      user = { id: stored.id, email, name: stored.name, role: stored.role, credentialVersion: credentialVersion(stored.passwordHash) };
      if (user.role === "ENTREPRENEUR") {
        const accepted = await db.application.findFirst({ where: { userId: user.id, status: "ACCEPTED", startup: { is: { ownerId: user.id } } } });
        if (!accepted) return NextResponse.json({ ok: false, error: "Panel erişimi için başvurunuzun onaylanması gerekiyor." }, { status: 403 });
      }
    }
    if (!canEnterPanel(user, panel)) return NextResponse.json({ ok: false, error: "Bu panele erişim yetkiniz yok." }, { status: 403 });
    await setSessionCookie(user);
    return NextResponse.json({ ok: true, user: panel === "girisimci" ? portalUser(user) : { name: user.name, email: user.email, role: user.role } });
  } catch (error) { return apiError(error); }
}

function invalidCredentials() {
  return NextResponse.json({ ok: false, error: "E-posta veya şifre hatalı." }, { status: 401 });
}

export async function sessionResponse(panel: string) {
  try {
    const user = await getSessionUser();
    if (!user || !canEnterPanel(user, panel)) return NextResponse.json({ ok: false, user: null }, { status: 401 });
    return NextResponse.json({ ok: true, localWorkspace: user.id === "platform-test-entrepreneur", user: panel === "girisimci" ? portalUser(user) : { name: user.name, email: user.email, role: user.role } });
  } catch (error) { return apiError(error); }
}
