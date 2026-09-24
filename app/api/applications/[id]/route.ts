import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { acceptApplication } from "@/lib/services/applications-service";

const updateSchema = z.object({
  status: z
    .enum(["NEW", "UNDER_REVIEW", "MISSING_INFO", "SENT_TO_JURY", "ACCEPTED", "WAITLIST", "REJECTED"])
    .optional(),
  programTrack: z.enum(["Ön Kuluçka", "Kuluçka"]).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    requirePermission(user.role, "applications:manage");

    const { id } = await context.params;
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const current = await db.application.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ ok: false, error: "APPLICATION_NOT_FOUND" }, { status: 404 });
    }

    const programTrack = parsed.data.programTrack || current.programTrack;
    if (parsed.data.status === "ACCEPTED") {
      if (programTrack !== "Ön Kuluçka" && programTrack !== "Kuluçka") {
        return NextResponse.json({ ok: false, error: "PROGRAM_TRACK_REQUIRED" }, { status: 400 });
      }
      const result = await acceptApplication(id, programTrack);
      await db.notification.create({
        data: {
          title: "Programa kabul edildiniz",
          message: `${current.startupName} girişiminiz ${programTrack} programına kabul edildi.`,
          type: "STATUS_UPDATE",
          status: "SENT",
          sentAt: new Date(),
          recipients: { create: { email: current.email, userId: current.userId, role: "ENTREPRENEUR" } },
        },
      });
      return NextResponse.json({ ok: true, ...result });
    }

    const application = await db.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id },
        data: {
          ...(parsed.data.status ? { status: parsed.data.status } : {}),
          ...(parsed.data.programTrack ? { programTrack: parsed.data.programTrack } : {}),
        },
      });

      if (parsed.data.status && parsed.data.status !== current.status) {
        await tx.statusHistory.create({
          data: {
            applicationId: id,
            oldStatus: current.status,
            newStatus: parsed.data.status,
          },
        });
        const statusMessages: Record<string, string> = {
          UNDER_REVIEW: "Başvurunuz incelemeye alındı.",
          MISSING_INFO: "Başvurunuz için ek bilgi bekleniyor.",
          SENT_TO_JURY: "Başvurunuz jüri değerlendirmesine gönderildi.",
          WAITLIST: "Başvurunuz yedek listeye alındı.",
          REJECTED: "Başvurunuz bu dönem için kabul edilmedi.",
        };
        await tx.notification.create({
          data: {
            title: "Başvuru durumu güncellendi",
            message: statusMessages[parsed.data.status] || "Başvuru durumunuz güncellendi.",
            type: "STATUS_UPDATE",
            status: "SENT",
            sentAt: new Date(),
            recipients: { create: { email: current.email, userId: current.userId, role: "ENTREPRENEUR" } },
          },
        });
      }

      if (parsed.data.programTrack) {
        await tx.startup.updateMany({
          where: { applicationId: id },
          data: { programTrack: parsed.data.programTrack },
        });
      }

      return updated;
    });

    return NextResponse.json({ ok: true, application });
  } catch (error) {
    return apiError(error);
  }
}
