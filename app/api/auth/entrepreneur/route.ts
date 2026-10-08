import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { login, sessionResponse } from "@/lib/login";

export async function GET() { return sessionResponse("girisimci"); }
export async function POST(request: Request) { return login(request, "girisimci"); }
export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
