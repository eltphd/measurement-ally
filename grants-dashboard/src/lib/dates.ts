const ET = "America/New_York";

/** Today's calendar date in Eastern Time, YYYY-MM-DD. Deadlines live in ET. */
export function todayET(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ET }).format(new Date());
}

/** Whole days from `from` (default: today ET) to a YYYY-MM-DD date. Negative = past. */
export function daysUntil(dateISO: string, from: string = todayET()): number {
  const d = dateISO.slice(0, 10);
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = iso.slice(0, 10);
  const dt = new Date(`${d}T12:00:00Z`);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function fmtMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export type DeadlineTone = "past" | "red" | "amber" | "ok" | "none";

/** Red under 7 days, amber 8–14, neutral beyond — per the design constraint. */
export function deadlineTone(days: number | null): DeadlineTone {
  if (days === null) return "none";
  if (days < 0) return "past";
  if (days <= 7) return "red";
  if (days <= 14) return "amber";
  return "ok";
}

export function daysLabel(days: number): string {
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} past`;
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}
