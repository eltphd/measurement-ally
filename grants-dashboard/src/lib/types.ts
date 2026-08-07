import type { OrgKey } from "./config";

export interface Grant {
  /** Notion page id, lowercase, no dashes. */
  id: string;
  notionUrl: string;
  org: OrgKey | null;
  granteeOrg: string;
  funder: string;
  scope: string;
  stage: string;
  amount: number | null;
  submissionDeadline: string | null;
  submissionDate: string | null;
  inquiryDate: string | null;
  followUpBy: string | null;
  funded: string | null;
  finalRound: boolean;
  granteeContact: string;
  granteeEmail: string;
  tags: string[];
  timeline: string;
  applyingEntity: string;
}

export interface OrgFacts {
  id: string;
  org: OrgKey | null;
  orgName: string;
  legalName: string;
  ein: string;
  yearFounded: number | null;
  address: string;
  website: string;
  primaryPhone: string;
  edName: string;
  edEmail: string;
  edPhone: string;
  fiscalContact: string;
  fyEnd: string | null;
  fyRevenue: number | null;
  fyExpenditures: number | null;
  operatingBudget: number | null;
  boardCount: number | null;
  boardRace: string;
  boardGender: string;
  staffRace: string;
  staffGender: string;
  topZips: string;
  guidestarUrl: string;
  lastVerified: string | null;
  verifiedBy: string;
}

export interface DocRow {
  id: string;
  org: OrgKey | null;
  /** Org Facts page ids this doc relates to (no-dash). */
  orgPageIds: string[];
  name: string;
  type: string;
  fileLink: string;
  issueDate: string | null;
  coversStart: string | null;
  coversEnd: string | null;
  expires: string | null;
  superseded: boolean;
  notes: string;
}

export interface LangBlock {
  id: string;
  org: OrgKey | null;
  name: string;
  category: string;
  text: string;
  notes: string;
  lastUpdated: string | null;
}

export interface FieldLogRow {
  id: string;
  /** Grant page ids (no-dash) this row relates to. */
  grantIds: string[];
  phase: "LOI" | "Full" | "Report";
  fieldName: string;
  value: string;
  charLimit: number | null;
  submittedDate: string | null;
}

export interface Snapshot {
  grants: Grant[];
  orgFacts: OrgFacts[];
  docs: DocRow[];
  blocks: LangBlock[];
  fieldLog: FieldLogRow[];
  fetchedAt: string;
  demo: boolean;
}
