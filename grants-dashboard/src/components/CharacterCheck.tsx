"use client";

import { useMemo, useState } from "react";

interface SentenceInfo {
  text: string;
  length: number;
  restates: boolean;
}

const STOPWORDS = new Set(
  "a an and are as at be by for from has have in is it its of on or that the to was were will with our we".split(" "),
);

function contentWords(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

function analyzeSentences(text: string): SentenceInfo[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen: Set<string>[] = [];
  return sentences.map((s) => {
    const words = contentWords(s);
    let restates = false;
    for (const prior of seen) {
      if (words.size === 0) break;
      let overlap = 0;
      for (const w of words) if (prior.has(w)) overlap++;
      if (overlap / words.size >= 0.6) {
        restates = true;
        break;
      }
    }
    seen.push(words);
    return { text: s, length: s.length, restates };
  });
}

export function CharacterCheck() {
  const [text, setText] = useState("");
  const [limit, setLimit] = useState(1000);

  const sentences = useMemo(() => analyzeSentences(text), [text]);
  const count = text.length;
  const over = count - limit;
  const restatements = sentences.filter((s) => s.restates);

  return (
    <div>
      <div className="field">
        <label htmlFor="limit">Portal character limit</label>
        <input
          id="limit"
          type="number"
          min={1}
          value={limit}
          style={{ maxWidth: 140 }}
          onChange={(e) => setLimit(Math.max(1, Number(e.target.value) || 1000))}
        />
      </div>
      <div className="field">
        <label htmlFor="text">Paste your field text</label>
        <textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the answer you're about to enter in the portal…"
        />
      </div>

      <p style={{ fontSize: 18 }}>
        <span className={`count ${over > 0 ? "over" : ""}`}>
          {count.toLocaleString()}
        </span>{" "}
        / {limit.toLocaleString()} characters
        {over > 0 ? (
          <strong className="over"> — {over.toLocaleString()} over. Trim before pasting.</strong>
        ) : (
          count > 0 && <span className="meta"> — fits, with {(-over).toLocaleString()} to spare.</span>
        )}
      </p>

      {over > 0 && sentences.length > 1 && (
        <>
          <h2>Where to cut</h2>
          <p className="sub">
            Cut restatement, not facts. Sentences flagged below repeat most of
            an earlier sentence&rsquo;s content words — start there. This is a
            heuristic; keep anything that carries a number, name, or commitment.
          </p>
          {restatements.length === 0 && (
            <p className="meta">
              No obvious restatement found — trim connective phrases and
              adjectives rather than dropping facts.
            </p>
          )}
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Sentence</th>
                  <th>Chars</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sentences.map((s, i) => (
                  <tr key={i}>
                    <td>{s.text}</td>
                    <td className="count">{s.length}</td>
                    <td>{s.restates && <span className="sev medium">restates earlier</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
