import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { clearSessionCookie, getAdminSessionUser, setSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";

const defaultAdminEmail = "admin@lideagirisim.com";
const defaultAdminPassword = "1234567890";

export async function GET() {
  const user = await getAdminSessionUser();
  return NextResponse.json({ ok: Boolean(user), user: user ? { email: user.email, role: user.role } : null });
}

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const expectedEmail = (process.env.ADMIN_EMAIL || defaultAdminEmail).toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD || defaultAdminPassword;

  if (email === expectedEmail && password === expectedPassword) {
    await setSessionCookie({
      id: "platform-super-admin",
      email,
      name: "Super Admin",
      role: "SUPER_ADMIN",
    });

    return NextResponse.json({ ok: true });
  }

  const user = await db.user.findUnique({ where: { email } });

  if (
    !user ||
    !user.active ||
    !["SUPER_ADMIN", "PROGRAM_ADMIN"].includes(user.role) ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  await setSessionCookie({ id: user.id, email: user.email, name: user.name, role: user.role });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
