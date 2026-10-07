import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { lovableSubmissionSchema } from "@/lib/validation/lovable-application";
import { importLovableApplication } from "@/lib/services/lovable-applications-service";

export async function POST(request: Request) {
  const secret = process.env.LOVABLE_APPLICATION_WEBHOOK_SECRET;
  if (!secret || secret.length < 32) return NextResponse.json({ ok: false, error: "INTEGRATION_NOT_CONFIGURED" }, { status: 503 });
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  const actual = Buffer.from(token), expected = Buffer.from(secret);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED_WEBHOOK" }, { status: 401 });
  }
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ ok: false, error: "JSON_REQUIRED" }, { status: 415 });
  }
  if (Number(request.headers.get("content-length")) > 65_536) return NextResponse.json({ ok: false, error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  let payload: unknown;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 65_536) return NextResponse.json({ ok: false, error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    payload = JSON.parse(raw);
  } catch { return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 }); }
  const parsed = lovableSubmissionSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  try {
    const { application, duplicate } = await importLovableApplication(parsed.data);
    return NextResponse.json({ ok: true, applicationId: application.id, applicationNo: application.applicationNo, duplicate }, { status: duplicate ? 200 : 201 });
  } catch (error) {
    if (error instanceof Error && ["INTAKE_PROGRAM_NOT_FOUND", "INTAKE_CLOSED"].includes(error.message)) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.message === "INTAKE_CLOSED" ? 409 : 503 });
    }
    return apiError(error);
  }
}
