import { isDemoMode } from "@/lib/config";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="wrap" style={{ maxWidth: 440, paddingTop: 56 }}>
      <h1>Measurement Ally · Grants</h1>
      <p className="sub">
        Live status of every grant we&rsquo;re running for your organization.
      </p>
      {error === "expired" && (
        <div className="notice warn">
          That sign-in link has expired or was already used. Enter your email
          below to get a fresh one.
        </div>
      )}
      <LoginForm demo={isDemoMode()} />
      <footer className="site">
        No passwords — we email you a sign-in link. Access is limited to
        addresses Measurement Ally has authorized.
      </footer>
    </main>
  );
}
