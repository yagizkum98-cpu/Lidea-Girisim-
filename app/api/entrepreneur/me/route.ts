import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ENTREPRENEUR") return unauthorized();

    const application = await db.application.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { startup: { include: { members: true, documents: true, mentorTasks: { include: { mentor: true } } } } },
    });
    const notifications = await db.notification.findMany({
      where: { recipients: { some: { email: user.email } }, status: "SENT" },
      orderBy: { createdAt: "desc" },
      include: { recipients: { where: { email: user.email } } },
    });

    return NextResponse.json({
      ok: true,
      user: { name: user.name, email: user.email, role: "Girişimci" },
      application,
      startup: application?.startup || null,
      notifications,
    });
  } catch (error) {
    return apiError(error);
  }
}
