/**
 * A viewer's scope: a client org key (e.g. "namifc"), or "all" for Erica.
 * Client orgs are defined in the Notion Org Facts Registry — one row per
 * client, with Org Key / Email Domains / Viewer Emails / Name Match columns —
 * so adding a client never requires a code change. See src/lib/orgs.ts.
 */
export type Scope = string;

const DEFAULT_ADMINS = [
  "erica@measurementally.com",
  "ericatartt@gmail.com",
  "mstartt@gmail.com",
];

/** Admins see every org. Extend with ADMIN_EMAILS (comma-separated). */
export function adminEmails(): string[] {
  const extra = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...DEFAULT_ADMINS, ...extra])];
}

/**
 * Optional emergency override, e.g. {"person@x.org":"namifc"} — takes
 * precedence over the registry's Viewer Emails. Normally leave unset and
 * manage viewers in Notion.
 */
export function allowlistOverrides(): Record<string, Scope> {
  const raw = process.env.ALLOWLIST_JSON;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const cleaned: Record<string, Scope> = {};
    for (const [email, scope] of Object.entries(parsed)) {
      if (typeof scope === "string" && scope.trim()) {
        cleaned[email.trim().toLowerCase()] = scope.trim().toLowerCase();
      }
    }
    return cleaned;
  } catch {
    console.error("ALLOWLIST_JSON is not valid JSON — ignoring it");
    return {};
  }
}

export const DATA_SOURCES = {
  tracker: () => process.env.DS_TRACKER || "f7f74e81-1f18-4cf2-a502-3f49d2a24917",
  orgFacts: () => process.env.DS_ORG_FACTS || "65057ab4-1ddd-45ae-bb46-a5fd39c48abb",
  docs: () => process.env.DS_DOCS || "6895feaf-90f8-4967-a874-5f3591f1ef57",
  language: () => process.env.DS_LANGUAGE || "d235f20c-26e1-4703-8de3-d49d4c58d7df",
  fieldLog: () => process.env.DS_FIELD_LOG || "a7dad9d8-c215-4cd6-b902-7af8742615fd",
};

export const isDemoMode = () => !process.env.NOTION_TOKEN;

export function appUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
