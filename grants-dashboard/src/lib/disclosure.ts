/**
 * Consultant disclosure language — verbatim from the standing reference
 * "Consultant Disclosure — Standard Language (all grants)" established
 * Aug 7, 2026. Must always assert: flat retainer, paid from operating funds,
 * not contingent, not charged to the award; only post-award evaluation is
 * grant-budgeted. Do not reword.
 */

export function shortDisclosure(): string {
  return (
    "Dr. Erica L. Tartt (Measurement Ally), Evaluation & Grant Strategy Consultant, " +
    "under an executed monthly retainer. Compensation is not contingent on award outcome."
  );
}

export function standardDisclosure(orgName: string): string {
  return (
    `Dr. Erica L. Tartt (Measurement Ally) serves as Evaluation & Grant Strategy Consultant to ${orgName} ` +
    "under an executed service agreement. The engagement covers grant strategy, application development " +
    "and narrative writing, portal entry and submission support, and evaluation framework advisory, " +
    `compensated at a flat monthly retainer paid from ${orgName}'s general operating funds. ` +
    "Compensation is not contingent on award outcome and no portion is calculated as a percentage of any award. " +
    "Post-award program evaluation is contracted separately and, where applicable, budgeted within the specific award."
  );
}

export function extendedDisclosure(): string {
  return [
    "Consultant: Dr. Erica L. Tartt, PhD — Measurement Ally",
    "Role: Evaluation & Grant Strategy Consultant",
    "Retainer scope: Funding opportunity identification and eligibility assessment; application development including narratives, work plans, performance plans, sustainability plans, and budget narratives; portal registration, data entry, attachment assembly, and submission support; program data review and analysis; funder briefs; evaluation framework advisory; and interim and final grant reporting.",
    "Compensation: Flat monthly retainer paid from organizational general operating funds. Not contingent on award outcome. No percentage-of-award or success-fee arrangement exists.",
    "Award-funded work: Post-award program evaluation is separately contracted and budgeted within the applicable award.",
    "Authority: Consultant is an independent contractor and is not an authorized representative of the organization. Final review and submission authority rests with the Executive Director.",
  ].join("\n");
}

export interface PortalQA {
  question: string;
  answer: string;
}

export function portalAnswers(evalAmount: number | null): PortalQA[] {
  const evalLine = evalAmount
    ? `Evaluation is a fixed budgeted amount (${evalAmount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}), not a percentage.`
    : "Evaluation is a fixed budgeted amount, not a percentage.";
  return [
    {
      question: "Consultant agreements involving preparation or submission?",
      answer: "Yes",
    },
    {
      question: "Agreements expected to be paid through the grant if awarded?",
      answer: "Yes — the evaluation line only",
    },
    {
      question: "How is the consultant compensated?",
      answer:
        'Other → "Flat monthly retainer paid from organizational operating funds; not contingent on award outcome."',
    },
    {
      question: "Any contingency arrangement?",
      answer: "No",
    },
    {
      question: "Percentage of award paid to consultant",
      answer: `0% for application development. ${evalLine}`,
    },
    {
      question: "Attach signed consultant agreement",
      answer: "The current restated service agreement PDF (if the portal has no upload field, email it to the funder referencing the application number, and note that inside the disclosure field)",
    },
  ];
}
