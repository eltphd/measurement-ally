import { notFound } from "next/navigation";
import { getScopedData } from "@/lib/data";
import { requireSession } from "@/lib/serverSession";
import { DisclosureTool } from "@/components/DisclosureTool";

export const dynamic = "force-dynamic";

export default async function DisclosurePage() {
  const session = await requireSession();
  // Erica's tool — the disclosure speaks for Measurement Ally.
  if (session.scope !== "all") notFound();

  const data = await getScopedData("all");
  const orgNames = data.orgFacts.map((f) => f.legalName || f.orgName).filter(Boolean);

  return (
    <main className="wrap">
      <h1>Consultant disclosure</h1>
      <p className="sub">
        The standing language, verbatim. Flat retainer · operating funds · not
        contingent · never charged to the award — only post-award evaluation is
        grant-budgeted.
      </p>
      <DisclosureTool orgNames={orgNames.length ? orgNames : ["[ORGANIZATION]"]} />
    </main>
  );
}
