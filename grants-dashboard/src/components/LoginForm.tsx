"use client";

import { useState } from "react";

export function LoginForm({ demo }: { demo: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
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
