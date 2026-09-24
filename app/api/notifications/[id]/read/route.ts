import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ENTREPRENEUR") return unauthorized();
    const { id } = await context.params;
    await db.notificationRecipient.updateMany({
      where: { notificationId: id, email: user.email },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
