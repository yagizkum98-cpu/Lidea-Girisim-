import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

const maxPitchDeckBytes = 3 * 1024 * 1024;

async function getOwnedStartup(userId: string) {
  const application = await db.application.findFirst({
    where: { userId, status: "ACCEPTED", startup: { is: { ownerId: userId } } },
    orderBy: { createdAt: "desc" },
    include: { startup: true },
  });
  const startup = application?.startup;
  if (!startup || (startup.ownerId && startup.ownerId !== userId)) return null;
  return startup;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ENTREPRENEUR" || user.id === "platform-test-entrepreneur") return unauthorized();

    const startup = await getOwnedStartup(user.id);
    if (!startup) return NextResponse.json({ ok: false, error: "Kabul edilmiş girişim kaydı bulunamadı." }, { status: 404 });

    const decks = await db.pitchDeck.findMany({
      where: { startupId: startup.id },
      orderBy: { version: "desc" },
      select: { id: true, version: true, fileName: true, uploadedAt: true },
    });
    return NextResponse.json({ ok: true, startupId: startup.id, decks });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ENTREPRENEUR") return unauthorized();
    if (user.id === "platform-test-entrepreneur") {
      return NextResponse.json({ ok: false, error: "Kalıcı Pitch Deck yüklemek için gerçek girişimci hesabıyla giriş yapın." }, { status: 403 });
    }

    const startup = await getOwnedStartup(user.id);
    if (!startup) return NextResponse.json({ ok: false, error: "Kabul edilmiş girişim kaydı bulunamadı." }, { status: 404 });

    const form = await request.formData();
    const value = form.get("file");
    if (!(value instanceof File)) {
      return NextResponse.json({ ok: false, error: "PDF dosyası seçin." }, { status: 400 });
    }
    if (!value.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ ok: false, error: "Yalnızca PDF dosyası yükleyebilirsiniz." }, { status: 400 });
    }
    if (value.size === 0 || value.size > maxPitchDeckBytes) {
      return NextResponse.json({ ok: false, error: "PDF dosyası boş olamaz ve 3 MB'ı aşamaz." }, { status: 413 });
    }

    const bytes = Buffer.from(await value.arrayBuffer());
    if (bytes.toString("ascii", 0, 5) !== "%PDF-") {
      return NextResponse.json({ ok: false, error: "Seçilen dosya geçerli bir PDF değil." }, { status: 400 });
    }

    const previous = await db.pitchDeck.findFirst({
      where: { startupId: startup.id },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const deck = await db.pitchDeck.create({
      data: {
        startupId: startup.id,
        version: (previous?.version || 0) + 1,
        fileName: value.name,
        fileKey: `data:application/pdf;base64,${bytes.toString("base64")}`,
      },
      select: { id: true, version: true, fileName: true, uploadedAt: true },
    });

    return NextResponse.json({ ok: true, startupId: startup.id, deck }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
