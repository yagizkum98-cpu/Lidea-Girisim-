import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { db } from "@/lib/db";
import { listApplications } from "@/lib/services/applications-service";
import { createApplicationSchema } from "@/lib/validation/platform";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    requirePermission(user.role, "applications:manage");
    const applications = await listApplications();
    return NextResponse.json({ ok: true, applications });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createApplicationSchema.safeParse({
      ...body,
      teamSize: Number(body.teamSize || 1),
    });

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const { password, ...applicationData } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 10);
    const existingUser = await db.user.findUnique({ where: { email: applicationData.email.toLowerCase() } });
    if (existingUser && existingUser.role !== "ENTREPRENEUR") {
      return NextResponse.json({ ok: false, error: "EMAIL_ALREADY_IN_USE" }, { status: 409 });
    }
    const application = await db.$transaction(async (tx) => {
      const entrepreneur = await tx.user.upsert({
        where: { email: applicationData.email.toLowerCase() },
        update: { name: applicationData.founder, passwordHash, active: true },
        create: {
          name: applicationData.founder,
          email: applicationData.email.toLowerCase(),
          passwordHash,
          role: "ENTREPRENEUR",
        },
      });

      const created = await tx.application.create({
        data: {
        ...applicationData,
        email: applicationData.email.toLowerCase(),
        userId: entrepreneur.id,
        kvkkAcceptedAt: new Date(),
        applicationNo: `LID-${Date.now().toString().slice(-8)}`,
        },
      });

      await tx.notification.create({
        data: {
          title: "Başvurunuz alındı",
          message: `${created.startupName} başvurunuz alındı ve değerlendirme kuyruğuna eklendi.`,
          type: "STATUS_UPDATE",
          status: "SENT",
          sentAt: new Date(),
          recipients: { create: { email: created.email, userId: entrepreneur.id, role: "ENTREPRENEUR" } },
        },
      });

      return created;
    });

    return NextResponse.json({ ok: true, application }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
