import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api";
import { trainingActor, trainingApiError, trainingDatabaseTask } from "@/lib/training-api";
import { trainingSchedule } from "@/lib/trainings";
import { joinTraining } from "@/lib/services/trainings-service";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await trainingActor();
    if (!user) return unauthorized();
    const { id } = await context.params;
    if (!trainingSchedule.some((training) => training.id === id)) return NextResponse.json({ ok: false, error: "TRAINING_NOT_FOUND" }, { status: 404 });
    const url = await trainingDatabaseTask(joinTraining(id, user.email));
    return NextResponse.redirect(url, 303);
  } catch (error) { return trainingApiError(error); }
}
