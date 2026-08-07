import Link from "next/link";
import { requireSession } from "@/lib/serverSession";
import { RefreshButton } from "@/components/RefreshButton";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <>
      <header className="site-header">
        <div className="bar">
          <Link href="/" className="brand">
            Measurement Ally <small>· Grants</small>
          </Link>
          <nav className="nav">
            <Link href="/">Dashboard</Link>
            <Link href="/tools/character-check">Character check</Link>
            {session.scope === "all" && <Link href="/tools/disclosure">Disclosure</Link>}
            <RefreshButton />
            <form action="/api/auth/logout" method="post" style={{ display: "inline" }}>
              <button
                type="submit"
                className="secondary"
                style={{ border: "none", padding: 0, background: "none", color: "inherit", fontSize: 14, textDecoration: "underline", cursor: "pointer" }}
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
