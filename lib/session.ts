import { SignJWT, jwtVerify } from "jose";
import { AppRole } from "@/lib/permissions";

export type SessionUser = { id: string; email: string; name: string; role: AppRole; credentialVersion?: string };
export const sessionCookie = "lidea-session";

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32 || /change-me|development-secret/.test(secret)) throw new Error("AUTH_SECRET_REQUIRED");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt()
    .setIssuer("lidea").setAudience("lidea-panels").setExpirationTime("8h").sign(authSecret());
}

export async function readSessionToken(token?: string): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret(), { algorithms: ["HS256"], issuer: "lidea", audience: "lidea-panels", requiredClaims: ["exp", "iat"] });
    if (typeof payload.id !== "string" || typeof payload.email !== "string" || typeof payload.name !== "string" ||
      !["SUPER_ADMIN", "PROGRAM_ADMIN", "ENTREPRENEUR", "EVALUATOR", "MENTOR", "JURY"].includes(String(payload.role))) return null;
    return payload as SessionUser;
  } catch { return null; }
}

export function canEnterPanel(user: SessionUser, panel: string) {
  if (panel === "girisimci") return ["SUPER_ADMIN", "ENTREPRENEUR"].includes(user.role);
  return ["SUPER_ADMIN", "PROGRAM_ADMIN"].includes(user.role);
}

export function isPreviewUser(user: SessionUser) { return user.role === "SUPER_ADMIN"; }
