import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { apiError } from "@/lib/api";

export async function trainingActor(admin = false) {
  const session = await getSessionUser();
  if (!session) return null;
  if (admin) {
    requirePermission(session.role, "program:manage");
    return session;
  }
  if (!["ENTREPRENEUR", "SUPER_ADMIN", "PROGRAM_ADMIN"].includes(session.role)) throw new Error("FORBIDDEN");
  return session;
}

export async function trainingDatabaseTask<T>(task: Promise<T>, timeoutMs = 4000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([task, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("TRAINING_STORAGE_UNAVAILABLE")), timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}

export function trainingApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "TRAINING_NOT_FOUND") return NextResponse.json({ ok: false, error: message }, { status: 404 });
  if (["TRAINING_CANCELLED", "TRAINING_JOIN_UNAVAILABLE"].includes(message)) return NextResponse.json({ ok: false, error: message }, { status: 409 });
  if (["TRAINING_PROGRAM_NOT_FOUND", "TRAINING_STORAGE_UNAVAILABLE"].includes(message)) return NextResponse.json({ ok: false, error: message }, { status: 503 });
  return apiError(error);
}
