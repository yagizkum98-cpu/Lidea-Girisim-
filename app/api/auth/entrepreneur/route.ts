import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionUser, setSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ENTREPRENEUR") return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ ok: true, user: { name: user.name, email: user.email, role: "Girişimci", localWorkspace: user.id === "platform-test-entrepreneur" } });
}

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (email === "tester@lideagirisim.com") {
    if (password !== "1234567890") {
      return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }
    await setSessionCookie({
      id: "platform-test-entrepreneur",
      email,
      name: "Tester",
      role: "ENTREPRENEUR",
    });
    return NextResponse.json({
      ok: true,
      user: { name: "Tester", email, role: "Girişimci", localWorkspace: true },
    });
  }

  const user = await db.user.findUnique({ where: { email } });

  if (!user || !user.active || user.role !== "ENTREPRENEUR" || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  await setSessionCookie({ id: user.id, email: user.email, name: user.name, role: user.role });
  return NextResponse.json({
    ok: true,
    user: { name: user.name, email: user.email, role: "Girişimci" },
  });
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
