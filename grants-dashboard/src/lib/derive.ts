import { daysUntil, deadlineTone, todayET, type DeadlineTone } from "./dates";
import type { Grant } from "./types";

const SUBMITTED_STAGES = /submitted|decision|awarded|declined/i;

export interface DeadlineItem {
  grantId: string;
  grantLabel: string;
  funder: string;
  kind: "submission" | "followup";
  date: string;
  days: number;
  tone: DeadlineTone;
}

/**
 * Everything due in the next 60 days, across stages — submission deadlines
 * AND follow-up dates. A "no decision by X → follow up" item is a deadline
 * too. Recently missed items (up to 14 days back) stay visible.
 */
export function deadlineRail(grants: Grant[], today: string = todayET()): DeadlineItem[] {
  const items: DeadlineItem[] = [];
  for (const g of grants) {
    if (g.submissionDeadline && !g.submissionDate && !SUBMITTED_STAGES.test(g.stage)) {
      const days = daysUntil(g.submissionDeadline, today);
      if (days >= -14 && days <= 60) {
        items.push({
          grantId: g.id, grantLabel: g.granteeOrg, funder: g.funder,
          kind: "submission", date: g.submissionDeadline, days, tone: deadlineTone(days),
        });
      }
    }
    if (g.followUpBy && !/awarded|declined/i.test(g.stage)) {
      const days = daysUntil(g.followUpBy, today);
      if (days >= -14 && days <= 60) {
        items.push({
          grantId: g.id, grantLabel: g.granteeOrg, funder: g.funder,
          kind: "followup", date: g.followUpBy, days, tone: deadlineTone(days),
        });
      }
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export interface Bucket {
  key: "development" | "awaiting" | "awarded" | "declined";
  label: string;
  count: number;
  total: number;
}

/** Count and dollar total by stage. Simple and honest — no vanity metrics. */
export function bucketize(grants: Grant[]): Bucket[] {
  const buckets: Record<Bucket["key"], Bucket> = {
    development: { key: "development", label: "In development", count: 0, total: 0 },
    awaiting: { key: "awaiting", label: "Submitted — awaiting decision", count: 0, total: 0 },
    awarded: { key: "awarded", label: "Awarded", count: 0, total: 0 },
    declined: { key: "declined", label: "Declined", count: 0, total: 0 },
  };
  for (const g of grants) {
    let key: Bucket["key"];
    if (g.stage === "Awarded" || g.funded === "Funded") key = "awarded";
    else if (g.stage === "Declined" || g.funded === "Not Funded") key = "declined";
    else if (/submitted|decision/i.test(g.stage)) key = "awaiting";
    else key = "development";
    buckets[key].count += 1;
    buckets[key].total += g.amount ?? 0;
  }
  return Object.values(buckets);
}

/** Soonest actionable date, for sorting grant cards by urgency. */
export function nextActionDate(g: Grant, today: string = todayET()): string | null {
  const candidates: string[] = [];
  if (g.submissionDeadline && !g.submissionDate && !SUBMITTED_STAGES.test(g.stage)) {
    candidates.push(g.submissionDeadline);
  }
  if (g.followUpBy && !/awarded|declined/i.test(g.stage) && daysUntil(g.followUpBy, today) >= -14) {
    candidates.push(g.followUpBy);
  }
  return candidates.sort()[0] ?? null;
}

export function sortGrants(grants: Grant[], today: string = todayET()): Grant[] {
  return [...grants].sort((a, b) => {
    const da = nextActionDate(a, today);
    const db = nextActionDate(b, today);
    if (da && db) return da.localeCompare(db);
    if (da) return -1;
    if (db) return 1;
    return (b.amount ?? 0) - (a.amount ?? 0);
  });
}

export function cleanStage(stage: string): string {
  return stage.replace(/^[^\p{L}]+/u, "").trim();
}
