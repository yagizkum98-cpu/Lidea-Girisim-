import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api";
import { trainingActor, trainingApiError, trainingDatabaseTask } from "@/lib/training-api";
import { trainingSchedule } from "@/lib/trainings";
import { trainingUpdateSchema } from "@/lib/validation/training";
import { saveTraining } from "@/lib/services/trainings-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await trainingActor(true);
    if (!user) return unauthorized();
    const { id } = await context.params;
    const existing = trainingSchedule.find((training) => training.id === id);
    if (!existing) return NextResponse.json({ ok: false, error: "TRAINING_NOT_FOUND" }, { status: 404 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 }); }
    const parsed = trainingUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    const training = await trainingDatabaseTask(saveTraining({ ...existing, ...parsed.data, hostEmail: user.email.toLowerCase() }));
    return NextResponse.json({ ok: true, training });
  } catch (error) { return trainingApiError(error); }
}
