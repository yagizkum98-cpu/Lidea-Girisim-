import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { AppRole } from "@/lib/permissions";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
};

const sessionCookie = "lidea-session";

function authSecret() {
  const secret = process.env.AUTH_SECRET || "development-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(authSecret());
}

export async function getSessionUser() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, authSecret());
    return verified.payload as SessionUser;
  } catch {
    return null;
  }
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
