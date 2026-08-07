export const ORG_KEYS = ["namifc", "arkbuilders"] as const;
export type OrgKey = (typeof ORG_KEYS)[number];
/** "all" = Erica. Clients are always pinned to exactly one org. */
export type Scope = OrgKey | "all";

export interface OrgDef {
  key: OrgKey;
  name: string;
  /** Grants whose Grantee Email ends in one of these domains belong to this org. */
  emailDomains: string[];
  /** Fallback: match on the Grantee Organization title. */
  namePattern: RegExp;
}

export const ORGS: Record<OrgKey, OrgDef> = {
  namifc: {
    key: "namifc",
    name: "NAMI Franklin County",
    emailDomains: ["namifc.org"],
    namePattern: /\bnami\b/i,
  },
  arkbuilders: {
    key: "arkbuilders",
    name: "ArkBuilders",
    emailDomains: ["arkbuilders.org"],
    namePattern: /ark\s*builders/i,
  },
};

const DEFAULT_ALLOWLIST: Record<string, Scope> = {
  "erica@measurementally.com": "all",
  "ericatartt@gmail.com": "all",
  "mstartt@gmail.com": "all",
  "rachelle@namifc.org": "namifc",
  "laurita.barber@namifc.org": "namifc",
  "george@arkbuilders.org": "arkbuilders",
};

export function allowlist(): Record<string, Scope> {
  const extra = process.env.ALLOWLIST_JSON;
  if (!extra) return DEFAULT_ALLOWLIST;
  try {
    const parsed = JSON.parse(extra) as Record<string, Scope>;
    const cleaned: Record<string, Scope> = {};
    for (const [email, scope] of Object.entries(parsed)) {
      if (scope === "all" || ORG_KEYS.includes(scope as OrgKey)) {
        cleaned[email.trim().toLowerCase()] = scope;
      }
    }
    return { ...DEFAULT_ALLOWLIST, ...cleaned };
  } catch {
    console.error("ALLOWLIST_JSON is not valid JSON — using built-in allowlist only");
    return DEFAULT_ALLOWLIST;
  }
}

export function scopeForEmail(email: string): Scope | null {
  return allowlist()[email.trim().toLowerCase()] ?? null;
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
