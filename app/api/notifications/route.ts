import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { createPlatformNotification } from "@/lib/services/notifications-service";
import { createNotificationSchema } from "@/lib/validation/platform";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    requirePermission(user.role, "notifications:send");
    const notifications = await (await import("@/lib/db")).db.notification.findMany({
      orderBy: { createdAt: "desc" },
      include: { recipients: true },
    });
    return NextResponse.json({ ok: true, notifications });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    requirePermission(user.role, "notifications:send");
    const parsed = createNotificationSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    const notification = await createPlatformNotification(parsed.data);
    return NextResponse.json({ ok: true, notification }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
