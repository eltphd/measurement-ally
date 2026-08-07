"use client";

import { useState } from "react";
import {
  extendedDisclosure,
  portalAnswers,
  shortDisclosure,
  standardDisclosure,
} from "@/lib/disclosure";

function CopyBlock({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <strong>{title}</strong>
        <span style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
          <span className="meta count">{text.length.toLocaleString()} chars</span>
          <button type="button" className="secondary" onClick={copy}>
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </span>
      </div>
      <p style={{ fontSize: 14.5, whiteSpace: "pre-wrap", marginBottom: 0 }}>{text}</p>
    </div>
  );
}

export function DisclosureTool({ orgNames }: { orgNames: string[] }) {
  const [org, setOrg] = useState(orgNames[0]);
  const [amount, setAmount] = useState<string>("");

  const evalAmount = amount ? Number(amount.replace(/[$,]/g, "")) || null : null;

  return (
    <div>
      <div className="field" style={{ maxWidth: 420 }}>
        <label htmlFor="org">Organization</label>
        <select id="org" value={org} onChange={(e) => setOrg(e.target.value)}>
          {orgNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      <div className="field" style={{ maxWidth: 220 }}>
        <label htmlFor="amount">Evaluation line amount (optional)</label>
        <input
          id="amount"
          type="text"
          inputMode="numeric"
          placeholder="e.g. 25000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <CopyBlock title="Short — one-line fields" text={shortDisclosure()} />
      <CopyBlock title="Standard — the usual disclosure box" text={standardDisclosure(org)} />
      <CopyBlock title="Extended — when a funder asks for scope detail" text={extendedDisclosure()} />

      <h2>Standard portal questions</h2>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Question as typically worded</th>
              <th>Answer</th>
            </tr>
          </thead>
          <tbody>
            {portalAnswers(evalAmount).map((qa, i) => (
              <tr key={i}>
                <td>{qa.question}</td>
                <td>{qa.answer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
