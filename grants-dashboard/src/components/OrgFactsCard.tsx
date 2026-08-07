import { fmtDate, fmtMoney } from "@/lib/dates";
import type { OrgFacts } from "@/lib/types";

function row(label: string, value: React.ReactNode) {
  if (value === null || value === undefined || value === "" || value === "—") return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

export function OrgFactsCard({ facts }: { facts: OrgFacts }) {
  return (
    <div className="card">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
        <strong>{facts.orgName}</strong>
        <span className="meta">
          {facts.lastVerified
            ? `Last verified ${fmtDate(facts.lastVerified)}`
            : "Not yet verified"}
        </span>
      </div>
      <dl className="kv" style={{ marginTop: 8 }}>
        {row("Legal name", facts.legalName)}
        {row("EIN", facts.ein)}
        {row("Founded", facts.yearFounded)}
        {row("Executive Director", facts.edName)}
        {row("ED email", facts.edEmail)}
        {row("Fiscal contact", facts.fiscalContact)}
        {row("Most recent FY end", facts.fyEnd ? fmtDate(facts.fyEnd) : null)}
        {row("FY revenue", facts.fyRevenue !== null ? fmtMoney(facts.fyRevenue) : null)}
        {row("FY expenditures", facts.fyExpenditures !== null ? fmtMoney(facts.fyExpenditures) : null)}
        {row("Operating budget", facts.operatingBudget !== null ? fmtMoney(facts.operatingBudget) : null)}
        {row("Board members", facts.boardCount)}
        {row("Board race", facts.boardRace)}
        {row("Board gender", facts.boardGender)}
        {row("Staff race", facts.staffRace)}
        {row("Staff gender", facts.staffGender)}
        {row("Top ZIPs served", facts.topZips)}
        {row("Website", facts.website ? <a href={facts.website}>{facts.website}</a> : null)}
        {row("GuideStar", facts.guidestarUrl ? <a href={facts.guidestarUrl}>Profile</a> : null)}
      </dl>
      {facts.verifiedBy && (
        <p className="meta" style={{ marginBottom: 0 }}>{facts.verifiedBy}</p>
      )}
    </div>
  );
}
