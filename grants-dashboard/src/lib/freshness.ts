import { daysUntil, fmtDate, todayET } from "./dates";
import type { DocRow, OrgFacts } from "./types";

export type DocStatus = "current" | "expiring" | "stale" | "superseded" | "unknown";

export interface DocHealth {
  status: DocStatus;
  reason: string;
  /** Extra warning, e.g. a 990 that doesn't cover the claimed fiscal year. */
  warning: string | null;
}

const GOOD_STANDING_STALE_DAYS = 90;
const GOOD_STANDING_WARN_DAYS = 60;
const EXPIRING_WINDOW_DAYS = 30;

export function docHealth(doc: DocRow, facts: OrgFacts | undefined, today: string = todayET()): DocHealth {
  const warning = coverageWarning(doc, facts);

  if (doc.superseded) {
    return { status: "superseded", reason: "Replaced by a newer version", warning };
  }

  if (doc.expires) {
    const d = daysUntil(doc.expires, today);
    if (d < 0) return { status: "stale", reason: `Expired ${fmtDate(doc.expires)}`, warning };
    if (d <= EXPIRING_WINDOW_DAYS) return { status: "expiring", reason: `Expires ${fmtDate(doc.expires)} (${d} days)`, warning };
    return { status: "current", reason: `Valid through ${fmtDate(doc.expires)}`, warning };
  }

  if (doc.type === "Good Standing") {
    if (!doc.issueDate) return { status: "unknown", reason: "Add the certificate's issue date", warning };
    const age = -daysUntil(doc.issueDate, today);
    if (age > GOOD_STANDING_STALE_DAYS) {
      return { status: "stale", reason: `Issued ${fmtDate(doc.issueDate)} — past the ${GOOD_STANDING_STALE_DAYS}-day freshness window`, warning };
    }
    if (age > GOOD_STANDING_WARN_DAYS) {
      return { status: "expiring", reason: `Issued ${age} days ago — goes stale at ${GOOD_STANDING_STALE_DAYS}`, warning };
    }
    return { status: "current", reason: `Issued ${fmtDate(doc.issueDate)}`, warning };
  }

  if (doc.type === "501c3") {
    return { status: "current", reason: "Determination letters do not expire", warning };
  }

  if (doc.type === "990") {
    if (!doc.coversStart && !doc.coversEnd) {
      return { status: "unknown", reason: "Add the fiscal year this 990 covers", warning };
    }
    return { status: warning ? "expiring" : "current", reason: coversLabel(doc), warning };
  }

  if (doc.issueDate || doc.coversStart) {
    return { status: "current", reason: doc.issueDate ? `Issued ${fmtDate(doc.issueDate)}` : coversLabel(doc), warning };
  }

  return { status: "unknown", reason: "Add issue and expiry dates so freshness can be tracked", warning };
}

function coversLabel(doc: DocRow): string {
  if (doc.coversStart && doc.coversEnd) return `Covers ${fmtDate(doc.coversStart)} – ${fmtDate(doc.coversEnd)}`;
  if (doc.coversStart) return `Covers from ${fmtDate(doc.coversStart)}`;
  return "Coverage period not set";
}

/** A 990 must cover the fiscal year the org's applications claim. */
function coverageWarning(doc: DocRow, facts: OrgFacts | undefined): string | null {
  if (doc.type !== "990" || !facts?.fyEnd) return null;
  if (!doc.coversStart || !doc.coversEnd) {
    return `Cannot verify coverage of FY ending ${fmtDate(facts.fyEnd)} — add the covered period`;
  }
  const fy = facts.fyEnd.slice(0, 10);
  if (fy < doc.coversStart.slice(0, 10) || fy > doc.coversEnd.slice(0, 10)) {
    return `Does not cover the fiscal year ending ${fmtDate(facts.fyEnd)} cited on applications`;
  }
  return null;
}
