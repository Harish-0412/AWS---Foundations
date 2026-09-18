/**
 * Review queue (§7.10). Failures are shown as owned work: the step, the reason in words, the
 * generation, and who can act. Exception text is deliberately not requested or shown.
 */
import { useParams } from "react-router-dom";

import { useResult, useResumeRun, useReviews, useRun } from "../api/context";
import { coverageFacts } from "../api/view";
import { COVERAGE, REVIEW, STATES, checkCopy, dispositionCopy, reasonCopy, type WhoActs } from "../copy";
import { DispositionChip } from "../components/chips";
import { CoverageBanner } from "../components/coverage-banner";
import { ErrorBlock, EmptyBlock, LoadingBlock } from "../components/states";
import { AppShell, RunTabs, Section } from "../components/shell";

const ORDER: WhoActs[] = ["you", "us", "operator"];

export function ReviewQueuePage() {
  const { runId = "" } = useParams();
  const run = useRun(runId);
  const result = useResult(runId, run.data?.generation);
  const reviews = useReviews(runId);
  const resume = useResumeRun();

  if (run.isLoading || reviews.isLoading) {
    return (
      <AppShell>
        <LoadingBlock label={STATES.loadingList} />
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
  if (reviews.isError) {
    return (
      <AppShell>
        <ErrorBlock error={reviews.error} onRetry={() => void reviews.refetch()} />
      </AppShell>
    );
  }

  const facts = coverageFacts(run.data, result.data ?? null);
  const items = reviews.data?.items ?? [];

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink">{REVIEW.heading}</h1>
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

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyBlock title={COVERAGE.nothingWaiting} calm>
            {COVERAGE.nothingWaitingNote}
          </EmptyBlock>
        </div>
      ) : (
        <>
          <p className="prose-column mt-4 text-sm text-muted">{REVIEW.note}</p>
          {ORDER.map((whoActs) => {
            const group = items.filter((item) => dispositionCopy(item.disposition).whoActs === whoActs);
            if (group.length === 0) return null;
            const heading = dispositionCopy(group[0]?.disposition).heading;
            return (
              <Section key={whoActs} title={heading}>
                <p className="text-sm text-muted">{dispositionCopy(group[0]?.disposition).explanation}</p>
                <ul className="mt-3 flex flex-col gap-3">
                  {group.map((item) => {
                    const reason = reasonCopy(item.reason);
                    return (
                      <li key={item.review_id} className="border border-line bg-surface-raised p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <DispositionChip whoActs={whoActs} />
                          <span className="font-mono text-[12px] text-ink">{item.step}</span>
                          <span className="font-mono text-[11px] text-faint">
                            generation {item.generation}
                          </span>
                          <span className="font-mono text-[11px] text-faint">
                            review {item.review_id}
                          </span>
                        </div>
                        <p className="prose-column mt-2 text-sm text-ink">{reason.sentence}</p>
                        <p className="mt-1 text-sm text-muted">
                          {checkCopy(item.step).invokes} · reason code{" "}
                          <span className="font-mono text-[12px]">{reason.code}</span> ·{" "}
                          {reason.retryable ? "retryable" : "not retryable by retrying alone"}
                        </p>
                        <p className="mt-1 text-xs text-muted">{REVIEW.stackTraceNote}</p>
                      </li>
                    );
                  })}
                </ul>
              </Section>
            );
          })}
        </>
      )}
    </AppShell>
  );
}
