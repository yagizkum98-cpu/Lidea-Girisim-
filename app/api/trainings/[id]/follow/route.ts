import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api";
import { trainingActor, trainingApiError, trainingDatabaseTask } from "@/lib/training-api";
import { trainingSchedule } from "@/lib/trainings";
import { followTraining } from "@/lib/services/trainings-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await trainingActor();
    if (!user) return unauthorized();
    const { id } = await context.params;
    if (!trainingSchedule.some((training) => training.id === id)) return NextResponse.json({ ok: false, error: "TRAINING_NOT_FOUND" }, { status: 404 });
    const body = await request.json().catch(() => null);
    if (typeof body?.following !== "boolean") return NextResponse.json({ ok: false, error: "FOLLOWING_REQUIRED" }, { status: 400 });
    await trainingDatabaseTask(followTraining(id, user.email, body.following));
    return NextResponse.json({ ok: true });
  } catch (error) { return trainingApiError(error); }
}
