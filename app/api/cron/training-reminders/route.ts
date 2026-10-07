import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processTrainingReminders } from "@/lib/services/trainings-service";
import { trainingApiError, trainingDatabaseTask } from "@/lib/training-api";

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) return NextResponse.json({ ok: false, error: "CRON_NOT_CONFIGURED" }, { status: 503 });
  const actual = Buffer.from(request.headers.get("authorization") || ""), expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  try { return NextResponse.json({ ok: true, ...await trainingDatabaseTask(processTrainingReminders(), 45_000) }); }
  catch (error) { return trainingApiError(error); }
}
