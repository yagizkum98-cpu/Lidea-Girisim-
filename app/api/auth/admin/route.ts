import { NextResponse } from "next/server";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const expectedEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedEmail || !expectedPassword || email !== expectedEmail || password !== expectedPassword) {
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  await setSessionCookie({
    id: "platform-super-admin",
    email,
    name: "Super Admin",
    role: "SUPER_ADMIN",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
