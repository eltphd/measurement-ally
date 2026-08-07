"use client";

import { useState } from "react";

export function LoginForm({ demo }: { demo: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [demoLink, setDemoLink] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      try {
        const data = await res.json();
        if (typeof data.link === "string") setDemoLink(data.link);
      } catch {
        // Non-JSON response — fall through to the generic message.
      }
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    if (demoLink) {
      return (
        <div className="notice">
          <strong>Demo mode</strong> — sample data only, so no email needed.
          <p style={{ marginBottom: 0 }}>
            <a className="btn" href={demoLink}>Open the dashboard →</a>
          </p>
        </div>
      );
    }
    return (
      <div className="notice">
        <strong>Check your email.</strong> If <b>{email}</b> is on the access
        list, a sign-in link is on its way (it works for 15 minutes). Nothing
        arrived after a couple of minutes? Check spam, or contact Erica at
        erica@measurementally.com.
        {demo && (
          <p style={{ marginBottom: 0 }}>
            Demo mode: the sign-in link was printed to the server console
            instead of emailed.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 20 }}>
      <div className="field">
        <label htmlFor="email">Your work email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@yourorg.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button type="submit" disabled={busy}>
        {busy ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
