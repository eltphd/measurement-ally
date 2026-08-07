import { CharacterCheck } from "@/components/CharacterCheck";

export default function CharacterCheckPage() {
  return (
    <main className="wrap">
      <h1>Character-limit check</h1>
      <p className="sub">
        Funder portals cap text fields — often at 1,000 characters — and only
        tell you when you paste. Check here first.
      </p>
      <CharacterCheck />
    </main>
  );
}
