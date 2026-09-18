/**
 * The shell: one `h1` per page (owned by the page), a skip link, and the standing contract that
 * this tool never acts on the user's code (§3.5, §15).
 */
import { Link, NavLink } from "react-router-dom";
import type { ReactNode } from "react";

import { NAV, PRODUCT, SAFETY_CONTRACT } from "../copy";
import { useApi } from "../api/context";
import { cn } from "../lib/cn";

export function AppShell({ children }: { children: ReactNode }) {
  const api = useApi();
  return (
    <div className="min-h-screen bg-surface text-ink">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:border focus:border-line-strong focus:bg-surface-raised focus:px-3 focus:py-1"
      >
        Skip to content
      </a>
      <header className="border-b border-line bg-surface-raised">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="font-semibold tracking-tight text-ink no-underline">
            {PRODUCT.name}
          </Link>
          <span className="hidden text-sm text-muted sm:inline">{PRODUCT.tagline}</span>
          <span className="ml-auto flex items-center gap-2">
            {api.mode === "recorded" ? (
              <span
                className="rounded border border-line px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-muted"
                title="The interface is reading checked-in pipeline output, not a live API."
              >
                recorded runs
              </span>
            ) : null}
            <Link className="text-sm" to="/scan/new">
              {NAV.newScan}
            </Link>
          </span>
        </div>
      </header>
      <main id="content" className="mx-auto max-w-5xl px-4 py-6">
        {children}
      </main>
      <footer className="mt-10 border-t border-line bg-surface-sunken">
        <div className="mx-auto max-w-5xl px-4 py-4 text-sm text-muted">
          <p>{SAFETY_CONTRACT}</p>
          <p className="mt-1">{PRODUCT.neverRuns}</p>
          <p className="mt-2 flex flex-wrap gap-3 text-sm">
            <Link to="/learn">Glossary</Link>
            <Link to="/history">History</Link>
            <Link to="/settings">Settings</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

const TABS = [
  { suffix: "", label: NAV.findings, end: true },
  { suffix: "/coverage", label: NAV.coverage },
  { suffix: "/policy", label: NAV.policy },
  { suffix: "/transparency", label: NAV.transparency },
  { suffix: "/review", label: NAV.review },
] as const;

export function RunTabs({ runId }: { runId: string }) {
  return (
    <nav aria-label="Run sections" className="flex flex-wrap gap-1 border-b border-line pb-2">
      {TABS.map((tab) => (
        <NavLink
          key={tab.suffix}
          to={`/runs/${runId}${tab.suffix}`}
          end={"end" in tab ? tab.end : false}
          className={({ isActive }) =>
            cn(
              "rounded px-2 py-1 text-sm no-underline",
              isActive ? "bg-surface-sunken font-medium text-ink" : "text-muted hover:text-ink",
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Section({
  title,
  description,
  children,
  as: As = "section",
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  as?: "section" | "div";
}) {
  return (
    <As className="mt-6 border border-line bg-surface-raised p-4">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description ? <div className="mt-1 text-sm text-muted">{description}</div> : null}
      <div className="mt-3">{children}</div>
    </As>
  );
}
