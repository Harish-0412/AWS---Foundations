/**
 * Run overview — the core page (§7.4).
 *
 * Zones, top to bottom: outcome line, coverage banner, next step, the backend's own priority
 * order, combined risks, then the findings grouped by decision. Nothing here re-sorts or
 * re-scores what the pipeline produced.
 */
import { CircleAlert, CircleCheck, Hourglass, MoveRight, RotateCcw } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import { ApiError } from "../api/client";
import { useResult, useResumeRun, useRun } from "../api/context";
import {
  coverageFacts,
  findGroup,
  groupViews,
  groupsByOutcome,
  synthesisView,
  type GroupView,
} from "../api/view";
import {
  NO_FINDINGS_COMPLETE,
  NO_FINDINGS_PARTIAL,
  RUN_OVERVIEW,
  SAFETY_CONTRACT,
  STATES,
  reasonCopy,
  type Decision,
} from "../copy";
import { AiProvenanceLabel } from "../components/ai-label";
import { CoverageBanner } from "../components/coverage-banner";
import { FindingCard } from "../components/finding-card";
import { FindingCount } from "../components/finding-count";
import { RunStatusChip } from "../components/chips";
import { ErrorBlock, LoadingBlock } from "../components/states";
import { AppShell, RunTabs, Section } from "../components/shell";

const GROUP_HEADING: Record<Decision, string> = {
  deny: RUN_OVERVIEW.blockedGroup,
  needs_human_approval: RUN_OVERVIEW.reviewGroup,
  permit: RUN_OVERVIEW.permitGroup,
};

export function RunOverviewPage() {
  const { runId = "" } = useParams();
  const run = useRun(runId);
  const result = useResult(runId, run.data?.generation);
  const resume = useResumeRun();

  const groups = useMemo(() => (result.data ? groupViews(result.data) : []), [result.data]);
  const synthesis = useMemo(() => (result.data ? synthesisView(result.data) : null), [result.data]);

  if (run.isLoading) {
    return (
      <AppShell>
        <LoadingBlock label={STATES.loadingRun} />
      </AppShell>
    );
  }
  if (run.isError) {
    return (
      <AppShell>
        <ErrorBlock error={run.error} onRetry={() => void run.refetch()} />
      </AppShell>
    );
  }
  const view = run.data;
  if (!view) {
    return (
      <AppShell>
        <ErrorBlock error={new ApiError("not_found", STATES.notFoundBody)} />
      </AppShell>
    );
  }

  const moving = view.status === "queued" || view.status === "running";
  const facts = coverageFacts(view, result.data ?? null);
  const resumeError = resume.error instanceof ApiError ? reasonCopy(resume.error.code).sentence : null;

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink">Run {view.run_id.replace(/^run-/, "").slice(0, 12)}</h1>
      <RunTabs runId={view.run_id} />

      <OutcomeLine
        status={view.status}
        headline={synthesis?.body.headline ?? null}
        overview={synthesis?.body.overview ?? null}
        reason={view.reason ?? result.data?.reason ?? null}
        resumable={view.resumable}
        onResume={() => resume.mutate(view.run_id)}
        resuming={resume.isPending}
      />

      <div className="mt-4">
        <CoverageBanner
          facts={facts}
          status={view.status}
          runId={view.run_id}
          onResume={() => resume.mutate(view.run_id)}
          resuming={resume.isPending}
          resumeError={resumeError}
        />
      </div>

      {moving ? (
        <LiveProgress states={result.data?.trace?.map((entry) => entry) ?? []} planned={facts.planned} />
      ) : null}

      {result.isError ? (
        <div className="mt-4">
          <ErrorBlock error={result.error} onRetry={() => void result.refetch()} />
        </div>
      ) : null}

      {result.isLoading && !moving ? (
        <div className="mt-4">
          <LoadingBlock label={STATES.loadingResult} />
        </div>
      ) : null}

      {!moving && synthesis ? (
        <>
          <NextStepCard runId={view.run_id} step={synthesis.body.next_step} groups={groups} />
          <Priorities runId={view.run_id} synthesis={synthesis} />
          {synthesis.combinedRisks.length > 0 ? (
            <Section title={RUN_OVERVIEW.combinedRisksHeading}>
              <ul className="flex flex-col gap-2">
                {synthesis.combinedRisks.map((risk) => (
                  <li key={risk.risk} className="text-sm text-ink">
                    {risk.risk}{" "}
                    <span className="text-muted">
                      ({risk.groupIds.join(", ")})
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
          <AiProvenanceLabel status={synthesis.status} cached={synthesis.cached} className="mt-2" />
        </>
      ) : null}

      {!moving ? (
        <Section
          title={RUN_OVERVIEW.findingsHeading}
          description={
            <FindingCount
              count={view.counts?.findings ?? groups.length}
              coverage={facts}
              runId={view.run_id}
            />
          }
        >
          <FindingsList runId={view.run_id} groups={groups} facts={facts} />
        </Section>
      ) : null}

      <p className="mt-8 border-t border-line pt-4 text-sm text-muted">{SAFETY_CONTRACT}</p>
    </AppShell>
  );
}

function OutcomeLine({
  status,
  headline,
  overview,
  reason,
  resumable,
  onResume,
  resuming,
}: {
  status: string;
  headline: string | null;
  overview: string | null;
  reason: string | null;
  resumable: boolean;
  onResume: () => void;
  resuming: boolean;
}) {
  const reasonView = reason ? reasonCopy(reason) : null;
  return (
    <section className="mt-4" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <RunStatusChip status={status} />
        {reasonView ? <span className="font-mono text-[11px] text-muted">{reasonView.code}</span> : null}
      </div>
      <p className="prose-column mt-2 text-lg text-ink">
        {headline ??
          (reasonView
            ? reasonView.sentence
            : "This run has no summary sentence yet, so read the findings below.")}
      </p>
      {overview ? <p className="prose-column mt-2 text-sm text-muted">{overview}</p> : null}
      {reasonView?.remedy ? (
        <p className="prose-column mt-2 text-sm text-ink">{reasonView.remedy}</p>
      ) : null}
      {reasonView ? (
        <p className="mt-2 text-sm text-muted">
          {reasonView.retryable ? "This is retryable." : "Repeating this run will not change the outcome."}
        </p>
      ) : null}
      {resumable ? (
        <button
          type="button"
          onClick={onResume}
          disabled={resuming}
          className="mt-3 inline-flex items-center gap-2 rounded border border-line-strong px-3 py-1.5 text-sm disabled:opacity-60"
        >
          <RotateCcw aria-hidden size={14} />
          {resuming ? "Resuming…" : RUN_OVERVIEW.resumeRun}
        </button>
      ) : null}
    </section>
  );
}

function NextStepCard({ runId, step, groups }: { runId: string; step: string; groups: GroupView[] }) {
  // `next_step` is prose; the referenced group is found from the synthesis priority list instead
  // of trying to parse the sentence.
  const first = groups[0];
  const target = first ? findGroup(groups, first.groupId) : null;
  return (
    <Section title={RUN_OVERVIEW.nextStepHeading} as="div">
      <p className="prose-column text-sm text-ink">{step}</p>
      {target ? (
        <p className="mt-3">
          <Link
            className="inline-flex items-center gap-1 rounded border border-line-strong px-3 py-1.5 text-sm no-underline"
            to={`/runs/${runId}/findings/${target.groupId}`}
          >
            {RUN_OVERVIEW.startHere}: {target.groupId}
            <MoveRight aria-hidden size={12} />
          </Link>
        </p>
      ) : null}
    </Section>
  );
}

function Priorities({
  runId,
  synthesis,
}: {
  runId: string;
  synthesis: NonNullable<ReturnType<typeof synthesisView>>;
}) {
  return (
    <Section title={RUN_OVERVIEW.prioritiesHeading} description={RUN_OVERVIEW.prioritiesNote}>
      <ol className="flex flex-col gap-2">
        {synthesis.priorities.map((priority, index) => (
          <li key={priority.groupId} className="flex flex-wrap items-baseline gap-2 text-sm">
            <span className="font-mono text-[11px] text-faint">{index + 1}.</span>
            <Link to={`/runs/${runId}/findings/${priority.groupId}`} className="font-medium">
              {priority.groupId}
            </Link>
            <span className="prose-column text-ink">{priority.whyNow}</span>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function FindingsList({
  runId,
  groups,
  facts,
}: {
  runId: string;
  groups: GroupView[];
  facts: ReturnType<typeof coverageFacts>;
}) {
  if (groups.length === 0) {
    return (
      <div className="border border-line bg-surface-sunken p-4 text-sm">
        <p className="flex items-center gap-2 font-medium text-ink">
          <CircleCheck aria-hidden size={16} />
          {STATES.emptyFindings}
        </p>
        <p className="prose-column mt-2 text-muted">
          {facts.complete ? NO_FINDINGS_COMPLETE : NO_FINDINGS_PARTIAL}
        </p>
        <p className="mt-2">
          <Link to="/learn">What the checks look for</Link>
        </p>
      </div>
    );
  }
  const byOutcome = groupsByOutcome(groups);
  const order: Decision[] = ["deny", "needs_human_approval", "permit"];
  return (
    <div className="flex flex-col gap-6">
      {order.map((outcome) => {
        const items = byOutcome[outcome];
        if (items.length === 0) return null;
        return (
          <section key={outcome}>
            <h3 className="flex flex-wrap items-baseline gap-2 text-sm font-semibold text-ink">
              {GROUP_HEADING[outcome]}
              <span className="font-mono text-[11px] text-faint">
                {items.length} finding group{items.length === 1 ? "" : "s"}
              </span>
            </h3>
            {outcome === "permit" ? (
              <p className="prose-column mt-1 text-sm text-muted">{RUN_OVERVIEW.permitGroupNote}</p>
            ) : null}
            <ul className="mt-2 flex flex-col gap-3">
              {items.map((group) => (
                <FindingCard key={group.groupId} runId={runId} group={group} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

const STEPS = ["Prepare", "Detect", "Merge", "Policy", "Explain", "Finalize"] as const;

function LiveProgress({
  states,
  planned,
}: {
  states: { state: string; event: string; map_index?: number | null; error?: string | null }[];
  planned: number;
}) {
  if (states.length === 0) {
    return (
      <Section title={RUN_OVERVIEW.progressHeading} description={RUN_OVERVIEW.progressNote}>
        <ul className="flex flex-col gap-2 text-sm">
          {STEPS.map((step) => (
            <li key={step} className="flex items-center gap-2 text-muted">
              <Hourglass aria-hidden size={14} className="text-faint" />
              <span className="font-medium text-ink">{step}</span>
              <span>waiting</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          No step has reported yet. {planned > 0 ? `${planned} checks are planned.` : ""}
        </p>
      </Section>
    );
  }
  return (
    <Section title={RUN_OVERVIEW.progressHeading} description={RUN_OVERVIEW.progressNote}>
      <ol className="flex flex-col gap-2 text-sm" aria-live="polite">
        {STEPS.map((step) => {
          const events = states.filter((entry) => entry.state === step || entry.state === "RunDetector");
          const relevant = step === "Detect" ? events : states.filter((entry) => entry.state === step);
          const succeeded = relevant.some((entry) => entry.event === "succeeded");
          const failed = relevant.some((entry) => entry.event === "failed");
          const entered = relevant.some((entry) => entry.event === "entered");
          const retried = relevant.some((entry) => entry.event === "retry");
          const label = failed
            ? "failed"
            : succeeded
              ? "done"
              : entered
                ? "running"
                : "waiting";
          return (
            <li key={step} className="flex items-center gap-2">
              {failed ? (
                <CircleAlert aria-hidden size={14} className="text-error" />
              ) : succeeded ? (
                <CircleCheck aria-hidden size={14} className="text-muted" />
              ) : (
                <Hourglass aria-hidden size={14} className="text-faint" />
              )}
              <span className="font-medium text-ink">{step}</span>
              <span className={failed ? "text-error" : "text-muted"}>{label}</span>
              {retried ? <span className="text-warn">retried</span> : null}
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
