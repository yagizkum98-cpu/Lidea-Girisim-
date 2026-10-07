import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api";
import { trainingActor, trainingApiError, trainingDatabaseTask } from "@/lib/training-api";
import { publicTraining } from "@/lib/trainings";
import { listTrainings } from "@/lib/services/trainings-service";

export async function GET(request: Request) {
  try {
    const view = new URL(request.url).searchParams.get("view") || "public";
    if (!["public", "participant", "admin"].includes(view)) return NextResponse.json({ ok: false, error: "INVALID_VIEW" }, { status: 400 });
    const admin = view === "admin";
    const user = view === "public" ? null : await trainingActor(admin);
    if (view !== "public" && !user) return unauthorized();
    const trainings = await trainingDatabaseTask(listTrainings(user?.email, admin));
    return NextResponse.json({ ok: true, trainings: view === "public" ? trainings.map(publicTraining) : trainings });
  } catch (error) { return trainingApiError(error); }
}
