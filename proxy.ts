import { NextRequest, NextResponse } from "next/server";
import { canEnterPanel, readSessionToken, sessionCookie } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const panel = request.nextUrl.pathname.split("/")[1];
  const user = await readSessionToken(request.cookies.get(sessionCookie)?.value);
  if (!user || !canEnterPanel(user, panel)) {
    const url = new URL("/giris", request.url);
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/girisimci/:path*", "/lideacheck/:path*"] };
