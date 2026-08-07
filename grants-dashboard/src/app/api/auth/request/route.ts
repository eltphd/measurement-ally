import { NextRequest, NextResponse } from "next/server";
import { appUrl, isDemoMode, scopeForEmail } from "@/lib/config";
import { createMagicToken, MAGIC_LINK_MINUTES } from "@/lib/session";

// Basic per-email throttle so the endpoint can't be used to spam inboxes.
const lastSent = new Map<string, number>();
const THROTTLE_MS = 60_000;

export async function POST(req: NextRequest) {
  let email = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Always report success so the form can't be used to probe the allowlist.
  const scope = scopeForEmail(email);
  if (!scope) return NextResponse.json({ ok: true });

  const now = Date.now();
  if ((lastSent.get(email) ?? 0) > now - THROTTLE_MS) {
    return NextResponse.json({ ok: true });
  }
  lastSent.set(email, now);

  const token = await createMagicToken(email);
  const link = `${appUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[magic-link] Sign-in link for ${email} (valid ${MAGIC_LINK_MINUTES} min):\n${link}`);
    return NextResponse.json({ ok: true, demo: isDemoMode() });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Measurement Ally Grants <onboarding@resend.dev>",
      to: [email],
      subject: "Your sign-in link — Measurement Ally Grants",
      html: [
        `<p>Tap the button below to open your grants dashboard. The link works for ${MAGIC_LINK_MINUTES} minutes.</p>`,
        `<p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Open my dashboard</a></p>`,
        `<p style="color:#555;font-size:13px">If the button doesn't work, copy this link into your browser:<br>${link}</p>`,
        `<p style="color:#555;font-size:13px">If you didn't request this, you can ignore this email.</p>`,
      ].join(""),
    }),
  });
  if (!res.ok) {
    console.error(`Resend send failed (${res.status}): ${await res.text()}`);
  }
  return NextResponse.json({ ok: true });
}
