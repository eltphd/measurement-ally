import Link from "next/link";
import { notFound } from "next/navigation";
import { diffPhases, PHASE_ORDER } from "@/lib/consistency";
import { getScopedData } from "@/lib/data";
import { daysLabel, daysUntil, deadlineTone, fmtDate, fmtMoney, todayET } from "@/lib/dates";
import { cleanStage } from "@/lib/derive";
import { effectiveScope, requireSession } from "@/lib/serverSession";

export const dynamic = "force-dynamic";

export default async function GrantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await requireSession();
  const [{ id }, { org: orgParam }] = await Promise.all([params, searchParams]);
  const scope = effectiveScope(session, orgParam);
  const data = await getScopedData(scope);

  // Scoped lookup: a grant outside this viewer's org simply does not exist.
  const grant = data.grants.find((g) => g.id === id.toLowerCase());
  if (!grant) notFound();

  const today = todayET();
  const log = data.fieldLog.filter((r) => r.grantIds.includes(grant.id));
  const diffs = diffPhases(
    log.map((r) => ({ field: r.fieldName, phase: r.phase, value: r.value })),
  );
  const material = diffs.filter((d) => d.kind !== "same");
  const consistent = diffs.filter((d) => d.kind === "same").length;
  const phasesLogged = PHASE_ORDER.filter((p) => log.some((r) => r.phase === p));

  const deadlineDays = grant.submissionDeadline ? daysUntil(grant.submissionDeadline, today) : null;

  return (
    <main className="wrap">
      <p className="sub">
        <Link href="/">← All grants</Link>
      </p>
      <h1>{grant.granteeOrg}</h1>
      <p className="sub">
        {grant.funder || "Funder TBD"} · <span className="badge">{cleanStage(grant.stage) || "No stage"}</span>
      </p>

      <dl className="kv" style={{ marginTop: 14 }}>
        <dt>Amount requested</dt>
        <dd>{fmtMoney(grant.amount)}</dd>
        {grant.submissionDeadline && (
          <>
            <dt>Submission deadline</dt>
            <dd className={`due ${deadlineTone(deadlineDays)}`}>
              {fmtDate(grant.submissionDeadline)}
              {deadlineDays !== null && !grant.submissionDate && ` (${daysLabel(deadlineDays)})`}
            </dd>
          </>
        )}
        {grant.submissionDate && (
          <>
            <dt>Submitted</dt>
            <dd>{fmtDate(grant.submissionDate)}</dd>
          </>
        )}
        {grant.inquiryDate && (
          <>
            <dt>Inquiry submitted</dt>
            <dd>{fmtDate(grant.inquiryDate)}</dd>
          </>
        )}
        {grant.followUpBy && (
          <>
            <dt>Follow up by</dt>
            <dd className={`due ${deadlineTone(daysUntil(grant.followUpBy, today))}`}>
              {fmtDate(grant.followUpBy)}
            </dd>
          </>
        )}
        {grant.funded && (
          <>
            <dt>Decision</dt>
            <dd>{grant.funded}</dd>
          </>
        )}
      </dl>

      {grant.scope && (
        <>
          <h2>Scope</h2>
          <p style={{ fontSize: 15 }}>{grant.scope}</p>
        </>
      )}

      {grant.timeline && (
        <>
          <h2>Status notes</h2>
          <p style={{ fontSize: 15, whiteSpace: "pre-wrap" }}>{grant.timeline}</p>
        </>
      )}

      <h2>Cross-phase consistency check</h2>
      {phasesLogged.length < 2 ? (
        <div className="empty">
          {phasesLogged.length === 0
            ? "No application fields logged yet for this grant. Once Erica logs what was entered for each phase (LOI, full application, report), this check compares them automatically."
            : `Only the ${phasesLogged[0]} phase is logged so far. When a second phase is logged, every field is compared automatically — amounts, counts, ZIP codes, and any component that quietly disappears between phases.`}
        </div>
      ) : material.length === 0 ? (
        <div className="notice">
          ✓ All {consistent} logged fields are consistent across{" "}
          {phasesLogged.join(" → ")}.
        </div>
      ) : (
        <>
          <p className="sub">
            {material.length} change{material.length === 1 ? "" : "s"} between{" "}
            {phasesLogged.join(" → ")}
            {consistent > 0 && ` · ${consistent} field${consistent === 1 ? "" : "s"} consistent`}.
            High-severity items are factual fields — funders read drift there as
            sloppiness. Medium items are usually legitimate changes that should
            be explained to the funder, not left silent.
          </p>
          <div className="table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>{material[0].fromPhase}</th>
                  <th>{material[0].toPhase}</th>
                  <th>Δ</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {material.map((d, i) => (
                  <tr key={i} className={d.severity === "high" ? "diff-high" : d.severity === "medium" ? "diff-medium" : ""}>
                    <td style={{ fontWeight: 600 }}>{d.field}</td>
                    <td>{d.fromValue ?? <em>— not present —</em>}</td>
                    <td>{d.toValue ?? <em>— missing —</em>}</td>
                    <td>{d.delta ?? "changed"}</td>
                    <td><span className={`sev ${d.severity}`}>{d.severity}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {log.length > 0 && (
        <>
          <h2>Submitted fields</h2>
          {phasesLogged.map((phase) => {
            const rows = log.filter((r) => r.phase === phase);
            const date = rows.find((r) => r.submittedDate)?.submittedDate;
            return (
              <div key={phase} style={{ marginBottom: 18 }}>
                <p className="sub" style={{ fontWeight: 600 }}>
                  {phase}
                  {date && ` — submitted ${fmtDate(date)}`}
                </p>
                <div className="table-scroll">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Value</th>
                        <th>Chars</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const over = r.charLimit !== null && r.value.length > r.charLimit;
                        return (
                          <tr key={r.id}>
                            <td style={{ whiteSpace: "nowrap" }}>{r.fieldName}</td>
                            <td>{r.value}</td>
                            <td className="count">
                              {r.charLimit !== null ? (
                                <span className={over ? "over" : ""}>
                                  {r.value.length}/{r.charLimit}
                                </span>
                              ) : (
                                r.value.length
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}
    </main>
  );
}
