import { NextResponse } from "next/server";
import { apiError, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; deckId: string }> }) {
  try {
    const { id: startupId, deckId } = await params;
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (user.role === "ENTREPRENEUR") {
      const startup = await db.startup.findUnique({ where: { id: startupId }, select: { ownerId: true, application: { select: { userId: true } } } });
      if (!startup || (startup.ownerId || startup.application?.userId) !== user.id) return unauthorized();
    } else {
      requirePermission(user.role, "startups:manage");
    }

    const deck = await db.pitchDeck.findUnique({ where: { id: deckId } });
    if (!deck || deck.startupId !== startupId) {
      return NextResponse.json({ ok: false, error: "Pitch Deck bulunamadı." }, { status: 404 });
    }
    const prefix = "data:application/pdf;base64,";
    if (!deck.fileKey.startsWith(prefix)) {
      return NextResponse.json({ ok: false, error: "Pitch Deck dosyası okunamadı." }, { status: 404 });
    }

    const filename = encodeURIComponent(deck.fileName.replace(/[\r\n]/g, "")).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
    return new Response(Buffer.from(deck.fileKey.slice(prefix.length), "base64"), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${filename}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
