import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.$runCommandRaw({ ping: 1 });
    return NextResponse.json({ ok: true, database: "mongodb" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database connection failed";
    return NextResponse.json({ ok: false, database: "mongodb", error: message }, { status: 503 });
  }
}
