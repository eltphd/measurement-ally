"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={refresh}
      className="secondary"
      style={{ border: "none", padding: 0, background: "none", color: "inherit", fontSize: 14, textDecoration: "underline", cursor: "pointer" }}
      title="Pull the latest from Notion now"
    >
      {busy ? "Refreshing…" : "Refresh"}
    </button>
  );
}
