import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api";
import { trainingActor, trainingApiError, trainingDatabaseTask } from "@/lib/training-api";
import { processTrainingReminders } from "@/lib/services/trainings-service";

export const maxDuration = 60;

export async function POST() {
  try {
    if (!await trainingActor()) return unauthorized();
    return NextResponse.json({ ok: true, ...await trainingDatabaseTask(processTrainingReminders(), 45_000) });
  } catch (error) { return trainingApiError(error); }
}
