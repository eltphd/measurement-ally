export type PhaseName = "LOI" | "Full" | "Report";
export const PHASE_ORDER: PhaseName[] = ["LOI", "Full", "Report"];

export interface FieldEntry {
  field: string;
  phase: PhaseName;
  value: string;
}

export type DiffKind = "same" | "changed" | "missing" | "added";
export type Severity = "high" | "medium" | "info" | "none";

export interface DiffRow {
  field: string;
  fromPhase: PhaseName;
  toPhase: PhaseName;
  fromValue: string | null;
  toValue: string | null;
  kind: DiffKind;
  /** Human delta, e.g. "−$50,000", "+5", "removed 43203 · added 43205". */
  delta: string | null;
  severity: Severity;
}

/**
 * Factual fields read as sloppiness when they drift — high severity.
 * Scope/dollar changes are usually legitimate but must be explained — medium.
 */
const FACTUAL =
  /(ein|zip|board|staff|demograph|count|persons|clients|sessions|served|founded|fiscal|revenue|expenditure|budget total)/i;

function norm(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function leadingNumber(s: string): number | null {
  const m = norm(s).replace(/[$,]/g, "").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function isMoney(s: string): boolean {
  return /\$\s*[\d,]/.test(s);
}

function zips(s: string): Set<string> {
  return new Set(s.match(/\b\d{5}\b/g) ?? []);
}

function fmtNum(n: number, money: boolean): string {
  return money
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : n.toLocaleString("en-US");
}

function severityFor(field: string): Severity {
  return FACTUAL.test(field) ? "high" : "medium";
}

function compareValues(field: string, a: string, b: string): { kind: DiffKind; delta: string | null } {
  if (norm(a) === norm(b)) return { kind: "same", delta: null };

  if (/zip/i.test(field)) {
    const za = zips(a);
    const zb = zips(b);
    if (za.size && zb.size) {
      const removed = [...za].filter((z) => !zb.has(z));
      const added = [...zb].filter((z) => !za.has(z));
      if (!removed.length && !added.length) return { kind: "same", delta: null };
      const parts = [];
      if (removed.length) parts.push(`removed ${removed.join(", ")}`);
      if (added.length) parts.push(`added ${added.join(", ")}`);
      return { kind: "changed", delta: parts.join(" · ") };
    }
  }

  const na = leadingNumber(a);
  const nb = leadingNumber(b);
  if (na !== null && nb !== null) {
    if (na === nb) {
      // Same figure, different phrasing (e.g. "500" vs "500 (197 therapy + …)").
      return { kind: "same", delta: null };
    }
    const money = isMoney(a) || isMoney(b);
    const diff = nb - na;
    return { kind: "changed", delta: `${diff > 0 ? "+" : "−"}${fmtNum(Math.abs(diff), money)}` };
  }

  return { kind: "changed", delta: null };
}

/**
 * Diff consecutive phases of a grant's Application Field Log.
 * A field present in an earlier phase and absent later is a dropped
 * component — the failure mode this checker exists to catch.
 */
export function diffPhases(entries: FieldEntry[]): DiffRow[] {
  const phases = PHASE_ORDER.filter((p) => entries.some((e) => e.phase === p));
  if (phases.length < 2) return [];

  const rows: DiffRow[] = [];
  for (let i = 0; i < phases.length - 1; i++) {
    const fromPhase = phases[i];
    const toPhase = phases[i + 1];
    const before = new Map(entries.filter((e) => e.phase === fromPhase).map((e) => [e.field, e.value]));
    const after = new Map(entries.filter((e) => e.phase === toPhase).map((e) => [e.field, e.value]));

    const fields = [...before.keys(), ...[...after.keys()].filter((f) => !before.has(f))];
    for (const field of fields) {
      const a = before.get(field);
      const b = after.get(field);
      if (a !== undefined && b === undefined) {
        rows.push({
          field, fromPhase, toPhase,
          fromValue: a, toValue: null,
          kind: "missing", delta: `absent in ${toPhase}`, severity: "high",
        });
      } else if (a === undefined && b !== undefined) {
        rows.push({
          field, fromPhase, toPhase,
          fromValue: null, toValue: b,
          kind: "added", delta: `new in ${toPhase}`, severity: "info",
        });
      } else if (a !== undefined && b !== undefined) {
        const { kind, delta } = compareValues(field, a, b);
        rows.push({
          field, fromPhase, toPhase,
          fromValue: a, toValue: b,
          kind, delta,
          severity: kind === "same" ? "none" : severityFor(field),
        });
      }
    }
  }

  const rank: Record<Severity, number> = { high: 0, medium: 1, info: 2, none: 3 };
  return rows.sort((x, y) => rank[x.severity] - rank[y.severity]);
}
