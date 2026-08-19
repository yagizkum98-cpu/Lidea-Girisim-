import { NextResponse } from "next/server";

export function apiError(error: unknown) {
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json({ ok: false, error: "Yetkiniz yok." }, { status: 403 });
  }

  return NextResponse.json({ ok: false, error: "Sunucu hatası." }, { status: 500 });
}

export function unauthorized() {
  return NextResponse.json({ ok: false, error: "Oturum gerekli." }, { status: 401 });
}
