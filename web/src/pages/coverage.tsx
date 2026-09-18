/**
 * Coverage & reliability (§7.8). This is the page that has to earn trust: it names every check,
 * its state, the reason it did not finish, what that means for the reader, and the exact missing
 * categories — with no "scan failed" wording anywhere, because a partial scan did not fail.
 */
import { Link, useParams } from "react-router-dom";

import { useResult, useResumeRun, useRun } from "../api/context";
import { coverageFacts, traceSteps } from "../api/view";
import { COVERAGE, RUN_OVERVIEW, STATES, categoryCopy, checkCopy, dispositionCopy, reasonCopy } from "../copy";
import { CheckStatusChip, DispositionChip } from "../components/chips";
import { CoverageBanner } from "../components/coverage-banner";
import { ErrorBlock, LoadingBlock } from "../components/states";
import { AppShell, RunTabs, Section } from "../components/shell";
import { useAudience } from "../lib/preferences";

export function CoveragePage() {
  const { runId = "" } = useParams();
  const run = useRun(runId);
  const result = useResult(runId, run.data?.generation);
  const resume = useResumeRun();
  const { audience } = useAudience();

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

  const facts = coverageFacts(run.data, result.data ?? null);
  const checks = result.data?.coverage?.checks ?? [];
  const steps = traceSteps(result.data ?? null);

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink">{COVERAGE.heading}</h1>
      <RunTabs runId={run.data.run_id} />

      <div className="mt-4">
        <CoverageBanner
          facts={facts}
          status={run.data.status}
          runId={run.data.run_id}
          onResume={() => resume.mutate(run.data!.run_id)}
          resuming={resume.isPending}
        />
      </div>

      <Section title={COVERAGE.checksHeading}>
        {checks.length === 0 ? (
          <p className="text-sm text-muted">
            This run did not get as far as planning checks, so there is nothing to list.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Each planned check, its state and its reason</caption>
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="py-2 pr-3 font-medium">Check</th>
                <th scope="col" className="py-2 pr-3 font-medium">State</th>
                <th scope="col" className="py-2 pr-3 font-medium">Looks for</th>
                <th scope="col" className="py-2 font-medium">{COVERAGE.whatThisMeansHeading}</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => {
                const copy = checkCopy(check.check);
                const reason = check.reason ? reasonCopy(check.reason) : null;
                const disposition = check.disposition ? dispositionCopy(check.disposition) : null;
                return (
                  <tr key={check.check} className="border-b border-line align-top">
                    <th scope="row" className="py-3 pr-3 text-left font-mono text-[12px] font-normal">
                      {copy.name}
                      <span className="mt-1 block text-[11px] text-faint">{copy.invokes}</span>
                    </th>
                    <td className="py-3 pr-3">
                      <CheckStatusChip status={check.status} />
                      {check.cached ? (
                        <span className="mt-1 block font-mono text-[11px] text-faint">reused</span>
                      ) : null}
                      {typeof check.findings === "number" ? (
                        <span className="mt-1 block text-[11px] text-muted">
                          {check.findings} finding{check.findings === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </td>
                    <td className="prose-column py-3 pr-3 text-muted">{copy.looksFor}</td>
                    <td className="py-3">
                      {check.status === "not_applicable" ? (
                        <p className="text-muted">
                          Your repository has no files of the type this check reads.
                        </p>
                      ) : reason ? (
                        <>
                          <p className="text-ink">{reason.sentence}</p>
                          {reason.remedy ? (
                            <p className="mt-1 text-muted">{reason.remedy}</p>
                          ) : null}
                          {disposition ? (
                            <p className="mt-1 flex flex-wrap items-center gap-2 text-muted">
                              <DispositionChip whoActs={disposition.whoActs} />
                              {disposition.heading}
                            </p>
                          ) : null}
                          {check.review_id ? (
                            <p className="mt-1">
                              <Link to={`/runs/${run.data!.run_id}/review`}>
                                Review item {check.review_id}
                              </Link>
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p className="text-muted">Nothing to report.</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>

      {facts.missingCategories.length > 0 ? (
        <Section title={COVERAGE.missingHeading}>
          {facts.incomplete.map((entry) => (
            <p key={entry.check} className="prose-column text-sm text-ink">
              {COVERAGE.missingIntro(entry.check)}{" "}
              {checkCopy(entry.check)
                .categories.filter((category) => facts.missingCategories.includes(category))
                .map((category) => categoryCopy(category).label)
                .join(", ") || facts.missingCategories.join(", ")}
            </p>
          ))}
        </Section>
      ) : null}

      {audience === "developer" ? (
        <Section title={COVERAGE.timelineHeading} description={COVERAGE.timelineNote}>
          {steps.length === 0 ? (
            <p className="text-sm text-muted">This run recorded no state transitions.</p>
          ) : (
            <ol className="flex flex-col gap-2 font-mono text-[12px]">
              {steps.map((step) => (
                <li key={step.state} className="flex flex-wrap items-baseline gap-2">
                  <span className="w-40 shrink-0 text-ink">{step.state}</span>
                  <span className="text-muted">
                    {step.events.map((event) => eventLabel(event)).join(" → ")}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Section>
      ) : (
        <Section title={COVERAGE.timelineHeading}>
          <p className="prose-column text-sm text-muted">
            A step-by-step timeline of this run is available in the Developer reading level. It shows
            the same events the workflow recorded, including retries and their delays.
          </p>
        </Section>
      )}

      {run.data.resumable ? (
        <Section title={RUN_OVERVIEW.resumeRun}>
          <button
            type="button"
            onClick={() => resume.mutate(run.data!.run_id)}
            disabled={resume.isPending}
            className="mt-3 rounded border border-line-strong px-3 py-1.5 text-sm disabled:opacity-60"
          >
            {resume.isPending ? "Resuming…" : RUN_OVERVIEW.resumeRun}
          </button>
        </Section>
      ) : null}
    </AppShell>
  );
}

function eventLabel(event: {
  event: string;
  attempt?: number | null;
  delay?: number | null;
  error?: string | null;
  mapIndex?: number | null;
}): string {
  const index = event.mapIndex !== null && event.mapIndex !== undefined ? `#${event.mapIndex}` : "";
  if (event.event === "retry") {
    return `retry${index} attempt ${event.attempt ?? "?"} after ${event.delay ?? "?"}s (${event.error ?? "unknown"})`;
  }
  return `${event.event}${index}`;
}
