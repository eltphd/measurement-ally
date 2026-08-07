import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Scope } from "./config";
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "./session";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Clients are pinned to their org no matter what the URL says.
 * Only an "all" (admin) session can narrow via ?org=. An unknown key just
 * scopes to an empty portfolio — it can never widen access.
 */
export function effectiveScope(session: SessionPayload, orgParam?: string | null): Scope {
  if (session.scope !== "all") return session.scope;
  const key = orgParam?.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return key ? key : "all";
}
