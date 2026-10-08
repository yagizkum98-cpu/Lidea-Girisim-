import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { canEnterPanel, createSessionToken, readSessionToken, sessionCookie, SessionUser } from "@/lib/session";

export { createSessionToken } from "@/lib/session";
export type { SessionUser } from "@/lib/session";

export function credentialVersion(passwordHash: string) {
  return createHash("sha256").update(passwordHash).digest("hex");
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const user = await readSessionToken((await cookies()).get(sessionCookie)?.value);
  if (!user) return null;
  if (user.id === "platform-super-admin" || user.id === "platform-test-entrepreneur") {
    const email = user.id === "platform-super-admin" ? "admin@lideagirisim.com" : "tester@lideagirisim.com";
    return user.email === email && user.role === "SUPER_ADMIN" ? user : null;
  }
  const stored = await db.user.findUnique({ where: { id: user.id } });
  if (!stored?.active || stored.role !== user.role || stored.email !== user.email ||
    user.credentialVersion !== credentialVersion(stored.passwordHash)) return null;
  if (user.role === "ENTREPRENEUR") {
    const accepted = await db.application.findFirst({ where: { userId: user.id, status: "ACCEPTED", startup: { is: { ownerId: user.id } } } });
    if (!accepted) return null;
  }
  return { ...user, name: stored.name };
}

export async function getAdminSessionUser(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  return user && canEnterPanel(user, "admin") ? user : null;
}

export async function requirePanelSession(panel: string) {
  const user = await getSessionUser();
  if (!user || !canEnterPanel(user, panel)) redirect(`/giris?next=/${panel}`);
  return user;
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  (await cookies()).set(sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(sessionCookie);
}
