/**
 * `/` is deliberately not the product's dashboard. The dashboard is a later milestone, so this
 * page exists only to open a run during development, and it says so. It never pretends to be the
 * "what is the state of my projects?" screen, and it never shows a count without its coverage.
 */
import { Link } from "react-router-dom";

import { useApi, useRun } from "../api/context";
import { RECORDED_RUNS } from "../api/fixtures";
import { coverageFacts } from "../api/view";
import { NOT_BUILT, PRODUCT, RECORDED_RUN_NOTE, STATES } from "../copy";
import { RunStatusChip } from "../components/chips";
import { FindingCount } from "../components/finding-count";
import { AppShell, Section } from "../components/shell";

export function IndexPage() {
  const api = useApi();
  if (api.mode === "recorded") return <RecordedIndex />;
  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink">{PRODUCT.name}</h1>
      <p className="prose-column mt-2 text-sm text-muted">
        The home screen that lists your repositories and their latest runs is a later milestone.
        Until then, open a run by its ID or start a new scan.
      </p>
      <p className="mt-3">
        <Link to="/scan/new">Start a scan</Link>
      </p>
    </AppShell>
  );
}

function RunRowLink({ runId }: { runId: string }) {
  const run = useRun(runId);
  if (!run.data) {
    return (
      <li className="border border-line bg-surface-raised p-3 font-mono text-[12px] text-muted">
        {runId}
      </li>
    );
  }
  const facts = coverageFacts(run.data);
  return (
    <li className="border border-line bg-surface-raised p-3">
      <div className="flex flex-wrap items-center gap-2">
        <RunStatusChip status={run.data.status} />
        <Link to={`/runs/${run.data.run_id}`} className="font-mono text-[12px]">
          {run.data.run_id}
        </Link>
      </div>
      <FindingCount
        count={run.data.counts?.findings ?? 0}
        coverage={facts}
        runId={run.data.run_id}
        className="mt-2"
      />
    </li>
  );
}

function RecordedIndex() {
  const api = useApi();
  const runs = RECORDED_RUNS.map((run) => ({
    runId: (run.view as { run_id: string }).run_id,
    note: run.note,
  }));
  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink">{PRODUCT.name}</h1>
      <p className="prose-column mt-2 text-sm text-muted">{RECORDED_RUN_NOTE}</p>
      <p className="prose-column mt-1 text-sm text-muted">
        This page is a development index, not the product's dashboard. It exists so real pipeline
        output can be opened without a server.
      </p>
      <Section title="Recorded runs">
        <ul className="flex flex-col gap-3" data-api-mode={api.mode}>
          {runs.map((run) => (
            <div key={run.runId}>
              <RunRowLink runId={run.runId} />
              <p className="mt-1 text-xs text-muted">{run.note}</p>
            </div>
          ))}
        </ul>
      </Section>
      <p className="mt-4 text-sm">
        <Link to="/scan/new">Start a scan</Link> · <Link to="/learn">Glossary</Link>
      </p>
    </AppShell>
  );
}

export function NotFoundPage() {
  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink">{STATES.notFoundHeading}</h1>
      <p className="prose-column mt-2 text-sm text-muted">{STATES.notFoundBody}</p>
      <p className="mt-3">
        <Link to="/">Back to the run index</Link>
      </p>
    </AppShell>
  );
}

export function NotBuiltPage({ page, endpoint }: { page: string; endpoint: string }) {
  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink">{page}</h1>
      <div className="mt-3 border border-warn bg-warn-fill p-4 text-sm text-warn">
        <p className="font-medium">{NOT_BUILT.heading}</p>
        <p className="mt-1">{NOT_BUILT.body}</p>
        <p className="mt-2 font-mono text-[12px]">
          {NOT_BUILT.apiGap}: {endpoint}
        </p>
      </div>
    </AppShell>
  );
}
