/**
 * Transparency & cost (§7.12). Every number here comes from the run: model calls, calls avoided,
 * estimated spend, which units were templated, which versions were in play, and how many checks
 * were reused instead of executed.
 */
import { useParams } from "react-router-dom";

import { useResult, useRun } from "../api/context";
import { groupViews } from "../api/view";
import { STATES, TRANSPARENCY, unitStatusCopy } from "../copy";
import { AiProvenanceLabel } from "../components/ai-label";
import { ErrorBlock, LoadingBlock } from "../components/states";
import { AppShell, RunTabs, Section } from "../components/shell";

export function TransparencyPage() {
  const { runId = "" } = useParams();
  const run = useRun(runId);
  const result = useResult(runId, run.data?.generation);

  if (run.isLoading) {
    return (
      <AppShell>
        <LoadingBlock label={STATES.loadingRun} />
      </AppShell>
    );
  }
  if (run.isError || !run.data) {
    return (
      <AppShell>
        <ErrorBlock error={run.error ?? new Error("No run")} onRetry={() => void run.refetch()} />
      </AppShell>
    );
  }

  const usage = result.data?.usage ?? null;
  const report = result.data?.explanation?.report ?? null;
  const reportUsage = report?.usage ?? null;
  const groups = result.data ? groupViews(result.data) : [];
  const synthesis = report?.synthesis ?? null;

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink">{TRANSPARENCY.heading}</h1>
      <RunTabs runId={run.data.run_id} />

      {result.isLoading ? <LoadingBlock label={STATES.loadingResult} /> : null}
      {result.isError ? <ErrorBlock error={result.error} onRetry={() => void result.refetch()} /> : null}

      {usage ? (
        <Section
          title={TRANSPARENCY.callsMade}
          description={`${TRANSPARENCY.costNote} Estimated spend: $${(usage.estimated_model_cost_usd ?? 0).toFixed(4)}.`}
        >
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wide text-faint">
                {TRANSPARENCY.callsMade}
              </dt>
              <dd className="mt-1 text-lg text-ink">{usage.model_calls}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-wide text-faint">
                {TRANSPARENCY.callsAvoided}
              </dt>
              <dd className="mt-1 text-lg text-ink">{reportUsage?.model_calls_avoided ?? 0}</dd>
              <dd className="text-xs text-muted">{TRANSPARENCY.avoidedNote}</dd>
            </div>
          </dl>
          {usage.model_calls === 0 ? (
            <p className="prose-column mt-3 text-sm text-ink">{TRANSPARENCY.noModel}</p>
          ) : null}
          {report?.provider === null || report?.provider === "none" ? (
            <p className="mt-2 text-sm text-muted">Provider: {TRANSPARENCY.providerNone}</p>
          ) : report?.provider ? (
            <p className="mt-2 text-sm text-muted">Provider: {report.provider}</p>
          ) : null}
        </Section>
      ) : null}

      <Section title={TRANSPARENCY.detectorsHeading}>
        <ul className="flex flex-col gap-1 text-sm">
          <li>Checks executed: {usage?.detectors_run ?? 0}</li>
          <li>Checks reused from identical content: {usage?.detectors_reused ?? 0}</li>
        </ul>
        {usage?.reused_result ? (
          <p className="mt-2 text-sm text-muted">
            The whole result was reused; nothing was scanned or explained again.
          </p>
        ) : null}
      </Section>

      {reportUsage ? (
        <Section title={TRANSPARENCY.byTierHeading}>
          <ul className="flex flex-col gap-1 text-sm">
            {Object.entries(reportUsage.calls_by_tier).map(([tier, calls]) => (
              <li key={tier}>
                {tier}: {calls} call{calls === 1 ? "" : "s"}
              </li>
            ))}
            {Object.keys(reportUsage.calls_by_tier).length === 0 ? (
              <li className="text-muted">No calls were made, so no tier was used.</li>
            ) : null}
            {reportUsage.budget ? (
              <li className="text-muted">
                Budget for this run: {reportUsage.budget.max_calls} calls / $
                {reportUsage.budget.max_cost_usd.toFixed(2)}
                {reportUsage.budget_exhausted ? " — exhausted" : ""}
              </li>
            ) : null}
            {reportUsage.circuit_open ? (
              <li className="text-warn">The circuit breaker opened: {reportUsage.circuit_open}</li>
            ) : null}
            {Object.entries(reportUsage.provider_failures).map(([kind, count]) => (
              <li key={kind} className="text-muted">
                provider {kind}: {count}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title={TRANSPARENCY.unitStatusHeading}>
        <ul className="flex flex-col gap-3 text-sm">
          {synthesis ? (
            <li>
              <span className="text-muted">Summary sentence</span>
              <AiProvenanceLabel status={synthesis.status} cached={synthesis.cached} />
            </li>
          ) : null}
          {groups.map((group) => (
            <li key={group.groupId} className="border-b border-line pb-2">
              <span className="font-mono text-[11px] text-faint">{group.groupId}</span>{" "}
              <span className="text-ink">{group.categoryLabel}</span>
              <span className="mt-1 block text-xs text-muted">
                {unitStatusCopy(group.unitStatus).sentence}
              </span>
            </li>
          ))}
          {groups.length === 0 && !synthesis ? (
            <li className="text-muted">This run produced no explanations.</li>
          ) : null}
        </ul>
      </Section>

      {report && Object.keys(report.versions).length > 0 ? (
        <Section title={TRANSPARENCY.versionsHeading} description={TRANSPARENCY.versionsNote}>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {Object.entries(report.versions).map(([name, value]) => (
              <div key={name} className="flex flex-wrap items-baseline gap-2">
                <dt className="font-mono text-[11px] uppercase tracking-wide text-faint">{name}</dt>
                <dd className="font-mono text-[12px] text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}

      {usage ? (
        <Section title={TRANSPARENCY.evidenceHeading}>
          <p className="prose-column text-sm text-ink">
            {TRANSPARENCY.evidenceLine(
              run.data.counts?.findings ?? result.data?.findings.length ?? 0,
              usage.model_calls,
            )}
          </p>
        </Section>
      ) : null}
    </AppShell>
  );
}
