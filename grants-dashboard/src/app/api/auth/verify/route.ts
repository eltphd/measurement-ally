import { NextRequest, NextResponse } from "next/server";
import { getAllOrgDefs } from "@/lib/data";
import { resolveScope } from "@/lib/orgs";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_DAYS,
  verifyMagicToken,
} from "@/lib/session";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const email = await verifyMagicToken(token);
  // Re-check access at redemption time, not just at send time.
  const scope = email ? resolveScope(email, await getAllOrgDefs()) : null;

  if (!email || !scope) {
    return NextResponse.redirect(new URL("/login?error=expired", req.url));
  }

  const session = await createSessionToken({ email, scope });
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}
