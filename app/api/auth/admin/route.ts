import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { login, sessionResponse } from "@/lib/login";

export async function GET() { return sessionResponse("admin"); }
export async function POST(request: Request) { return login(request, "admin"); }
export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
