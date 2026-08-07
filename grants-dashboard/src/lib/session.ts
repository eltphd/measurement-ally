import { SignJWT, jwtVerify } from "jose";
import type { Scope } from "./config";

export const SESSION_COOKIE = "ma_session";
export const SESSION_DAYS = 30;
export const MAGIC_LINK_MINUTES = 15;

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production" && process.env.NOTION_TOKEN) {
      throw new Error("SESSION_SECRET must be set in production");
    }
    return new TextEncoder().encode("dev-only-secret-not-for-production");
  }
  return new TextEncoder().encode(s);
}

export interface SessionPayload {
  email: string;
  scope: Scope;
}

export async function createMagicToken(email: string): Promise<string> {
  return new SignJWT({ email, purpose: "magic" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAGIC_LINK_MINUTES}m`)
    .sign(secret());
}

export async function verifyMagicToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== "magic" || typeof payload.email !== "string") return null;
    return payload.email;
  } catch {
    return null;
  }
}

export async function createSessionToken(session: SessionPayload): Promise<string> {
  return new SignJWT({ ...session, purpose: "session" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== "session") return null;
    const { email, scope } = payload as Record<string, unknown>;
    if (typeof email !== "string" || typeof scope !== "string" || !scope) return null;
    return { email, scope };
  } catch {
    return null;
  }
}
