/**
 * Finding detail — the teaching page (§7.5) plus the fix panel (§7.6).
 *
 * Every sentence is either from the explanation unit, from the vetted glossary, or from static
 * interface copy. The page never composes its own security advice, and it never offers an
 * "Apply fix" button, because this product does not edit application code.
 */
import { CircleAlert, GitCompare, Info, ListChecks, RotateCcw, ShieldAlert } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useApi, useResult, useRun } from "../api/context";
import {
  coverageFacts,
  findGroup,
  groupViews,
  locationLabel,
  type GroupView,
} from "../api/view";
import {
  CHECKLIST_STORAGE_NOTE,
  FINDING_DETAIL,
  NOT_BUILT,
  RUN_OVERVIEW,
  SAFETY_CONTRACT,
  STATES,
  conceptsForCategory,
  escalationLabel,
  impactLabel,
} from "../copy";
import { AiProvenanceLabel } from "../components/ai-label";
import { DecisionChip, EvidenceClassChip, SeverityChip } from "../components/chips";
import { CopyButton, UntrustedText, VerifyStep } from "../components/copy-widgets";
import { EvidenceDrawer } from "../components/evidence-drawer";
import { FindingCount } from "../components/finding-count";
import { PolicyReasonList } from "../components/policy-panel";
import { ErrorBlock, LoadingBlock } from "../components/states";
import { AppShell, RunTabs, Section } from "../components/shell";
import { useChecklist } from "../lib/checklist";
import { useAudience } from "../lib/preferences";

export function FindingDetailPage() {
  const { runId = "", groupId = "" } = useParams();
  const [params] = useSearchParams();
  const compareWith = params.get("compare");
  const run = useRun(runId);
  const result = useResult(runId, run.data?.generation);
  const groups = useMemo(() => (result.data ? groupViews(result.data) : []), [result.data]);
  const group = findGroup(groups, groupId);

  if (run.isLoading || result.isLoading) {
    return (
      <AppShell>
        <LoadingBlock label={STATES.loadingResult} />
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
  if (result.isError) {
    return (
      <AppShell>
        <ErrorBlock error={result.error} onRetry={() => void result.refetch()} />
      </AppShell>
    );
  }
  if (!run.data) return null;

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink">
        {group ? group.headline : `Finding ${groupId}`}
      </h1>
      <RunTabs runId={run.data.run_id} />
      {group ? (
        <>
          <FindingBody runId={run.data.run_id} group={group} compareWith={compareWith} />
          <RescanFooter runId={run.data.run_id} />
        </>
      ) : (
        <div className="mt-4">
          <ErrorBlock
            error={new Error(
              "This run has no explanation unit with that ID. The run's own list of groups is on the overview page.",
            )}
          />
          <p className="mt-2 text-sm">
            <Link to={`/runs/${run.data.run_id}`}>Back to the run</Link>
          </p>
        </div>
      )}
    </AppShell>
  );
}

function FindingBody({
  runId,
  group,
  compareWith,
}: {
  runId: string;
  group: GroupView;
  compareWith: string | null;
}) {
  const { audience } = useAudience();
  const body = group.body;
  const impact = impactLabel(group.impact);
  const escalation = escalationLabel(group.escalation);

  if (!body) {
    return (
      <div className="mt-4 border border-warn bg-warn-fill p-4 text-sm text-warn">
        We couldn't generate an explanation for this finding, so the raw evidence is below. Nothing
        on this page is a guess: what you see is what the scanners reported.
        <EvidenceDrawer group={group} defaultOpen />
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SeverityChip severity={group.effectiveSeverity} />
        {group.outcome ? <DecisionChip outcome={group.outcome} long /> : null}
        <EvidenceClassChip evidenceClass={group.evidenceClass} />
      </div>
      {group.downgraded && group.detectorSeverity ? (
        <p className="mt-2 text-sm text-muted">
          The check reported <strong>{group.detectorSeverity}</strong>; the policy severity is{" "}
          <strong>{group.effectiveSeverity}</strong> — {FINDING_DETAIL.downgradedSuffix}.
        </p>
      ) : null}
      <AiProvenanceLabel status={group.unitStatus} cached={group.cached} className="mt-2" />

      <Section title={FINDING_DETAIL.whatWeFound}>
        <p className="prose-column text-sm text-ink">{body.what_happened}</p>
        <ul className="mt-3 flex flex-col gap-1">
          {group.locations.map((location) => (
            <li key={locationLabel(location)} className="flex flex-wrap items-center gap-2">
              <UntrustedText fromRepository>{locationLabel(location)}</UntrustedText>
              <CopyButton value={locationLabel(location)} label={FINDING_DETAIL.copyPath} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title={FINDING_DETAIL.whyItMatters}>
        <p className="prose-column text-sm text-ink">{body.why_it_matters}</p>
        {impact ? (
          <p className="mt-2">
            <span className="rounded border border-line px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-muted">
              impact: {impact}
            </span>
          </p>
        ) : null}
        {escalation ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-warn">
            <Info aria-hidden size={14} />
            {escalation}
          </p>
        ) : null}
        <ConceptLinks category={group.category} />
      </Section>

      {group.uncertainty.length > 0 ? (
        <Section title={FINDING_DETAIL.unsureHeading} description={FINDING_DETAIL.unsureNote}>
          <ul className="flex flex-col gap-2">
            {group.uncertainty.map((item) => (
              <li key={item} className="prose-column flex gap-2 text-sm text-ink">
                <ShieldAlert aria-hidden size={14} className="mt-1 shrink-0 text-faint" />
                {item}
              </li>
            ))}
          </ul>
        </Section>
      ) : (
        <Section title={FINDING_DETAIL.unsureHeading} description={FINDING_DETAIL.unsureNote}>
          <p className="text-sm text-muted">
            This finding reported no uncertainty of its own. The evidence class above is still the
            honest measure: the check matched a pattern.
          </p>
        </Section>
      )}

      <FixPanel group={group} />

      <Section title={FINDING_DETAIL.verifyHeading} description={FINDING_DETAIL.verifyHelp}>
        <ul className="flex flex-col gap-2">
          {group.verify.map((step) => (
            <li key={step}>
              <VerifyStep step={step} />
            </li>
          ))}
          {group.verify.length === 0 ? (
            <li className="text-sm text-muted">
              The explanation did not include a verify step. Re-run the scan to see whether the
              finding is still present.
            </li>
          ) : null}
        </ul>
      </Section>

      <EvidenceDrawer group={group} defaultOpen={audience === "developer"} />

      <Section title={FINDING_DETAIL.decisionHeading}>
        {group.outcome ? (
          <DecisionChip outcome={group.outcome} long />
        ) : (
          <p className="text-sm text-muted">No decision was reported for this finding.</p>
        )}
        <p className="mt-2 text-sm text-muted">
          Effective environment: {group.decision?.effective_environment ?? "not reported"} · policy
          version {group.decision?.policy_version?.slice(0, 12) ?? "not reported"}
        </p>
        <div className="mt-3">
          <PolicyReasonList
            reasons={group.policyReasons}
            emptyNote="This decision reported no rule IDs, so we cannot show why it was reached."
          />
        </div>
      </Section>

      <ComparisonBanner runId={runId} group={group} compareWith={compareWith} />
      <AskPlaceholder group={group} />

      <p className="mt-8 border-t border-line pt-4 text-sm text-muted">{SAFETY_CONTRACT}</p>
    </>
  );
}

function ConceptLinks({ category }: { category: string }) {
  const terms = conceptsForCategory(category);
  if (terms.length === 0) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
      <span>Terms used here:</span>
      {terms.map((term) => (
        <Link key={term} to={`/learn/${encodeURIComponent(term)}`}>
          {term}
        </Link>
      ))}
    </p>
  );
}

function FixPanel({ group }: { group: GroupView }) {
  const { done, toggle, reset } = useChecklist(group.primaryFinding?.finding_id ?? group.groupId);
  const isSecret = group.isSecret;
  return (
    <Section
      title={FINDING_DETAIL.fixHeading}
      description={
        <>
          <p>{group.cue}</p>
          <p className="mt-1">{CHECKLIST_STORAGE_NOTE}</p>
        </>
      }
    >
      <ol className="flex flex-col gap-3">
        {group.fixSteps.map((step, index) => {
          const pinned = isSecret && index === 0;
          return (
            <li
              key={step.action}
              className={
                pinned
                  ? "border border-warn bg-warn-fill p-3"
                  : "border border-line bg-surface-raised p-3"
              }
            >
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={done.includes(index)}
                  onChange={() => toggle(index)}
                />
                <span className="text-sm text-ink">
                  <span className="mr-2 font-mono text-[11px] text-faint">step {index + 1}</span>
                  {step.action}
                </span>
              </label>
              {pinned ? (
                <p className="mt-2 flex items-center gap-2 pl-7 text-xs font-medium text-warn">
                  <CircleAlert aria-hidden size={12} />
                  {FINDING_DETAIL.secretFirstStep}
                </p>
              ) : null}
              {step.refs.length > 0 ? (
                <details className="mt-2 pl-7">
                  <summary className="cursor-pointer text-xs text-muted">Why this step</summary>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {step.refs.map((ref) => (
                      <li key={ref}>
                        <UntrustedText>{ref}</UntrustedText>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 text-xs text-muted"
        >
          <ListChecks aria-hidden size={12} />
          Clear my notes
        </button>
        <p className="text-xs text-muted">{CHECKLIST_STORAGE_NOTE}</p>
      </div>
    </Section>
  );
}

/**
 * J2's closing loop: the finding is only shown as fixed when a later run no longer contains its
 * content-derived finding ID. Because the ID is derived from content, this comparison is exact
 * and needs no model.
 */
function ComparisonBanner({
  runId,
  group,
  compareWith,
}: {
  runId: string;
  group: GroupView;
  compareWith: string | null;
}) {
  const api = useApi();
  const navigate = useNavigate();
  const runs = useQuery({ queryKey: ["runs"], queryFn: () => api.listRuns() });
  const other = useQuery({
    queryKey: ["result", compareWith, "compare"],
    queryFn: () => api.getResult(compareWith as string),
    enabled: Boolean(compareWith),
  });

  const findingId = group.primaryFinding?.finding_id;
  const eligible = (runs.data ?? []).filter((candidate) => candidate.run_id !== runId);

  return (
    <Section
      title="Is it gone?"
      description="Compare with another run of the same repository. The comparison uses the finding's content-derived ID."
    >
      {eligible.length === 0 ? (
        <p className="text-sm text-muted">
          Only one run is available here, so there is nothing to compare against yet.
        </p>
      ) : (
        <>
          <label className="flex flex-wrap items-center gap-2 text-sm">
            <GitCompare aria-hidden size={14} />
            Compare with
            <select
              value={compareWith ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                navigate(
                  value
                    ? `/runs/${runId}/findings/${group.groupId}?compare=${encodeURIComponent(value)}`
                    : `/runs/${runId}/findings/${group.groupId}`,
                );
              }}
              className="rounded border border-line bg-surface-raised px-2 py-1"
            >
              <option value="">choose a run…</option>
              {eligible.map((candidate) => (
                <option key={candidate.run_id} value={candidate.run_id}>
                  {candidate.run_id.replace(/^run-/, "").slice(0, 12)} · {candidate.status} ·{" "}
                  {(candidate.created_at ?? 0) > 0
                    ? new Date((candidate.created_at as number) * 1000).toISOString().slice(0, 10)
                    : "no date"}
                </option>
              ))}
            </select>
          </label>
          {other.isLoading ? <LoadingBlock label="Loading the other run…" /> : null}
          {other.isError ? <ErrorBlock error={other.error} /> : null}
          {other.data && findingId ? (
            <p className="mt-3 text-sm">
              {other.data.findings.some((finding) => finding.finding_id === findingId)
                ? FINDING_DETAIL.rescannedPresent(compareWith ?? "")
                : FINDING_DETAIL.rescannedFixed(compareWith ?? "")}
              <span className="mt-1 block text-muted">{FINDING_DETAIL.rescannedNote}</span>
            </p>
          ) : null}
        </>
      )}
    </Section>
  );
}

function RescanFooter({ runId }: { runId: string }) {
  const run = useRun(runId);
  const facts = run.data ? coverageFacts(run.data) : null;
  return (
    <Section title={RUN_OVERVIEW.findingsHeading} description="Rescanning starts a new run on the same source.">
      {facts ? (
        <FindingCount
          count={run.data?.counts?.findings ?? 0}
          coverage={facts}
          runId={runId}
          className="mb-2"
        />
      ) : null}
      <p className="flex flex-wrap items-center gap-3 text-sm">
        <Link to={`/runs/${runId}`}>Back to the run overview</Link>
        <span className="inline-flex items-center gap-1 text-muted">
          <RotateCcw aria-hidden size={12} />
          Re-scan is available once you are pointed at a running API.
        </span>
      </p>
    </Section>
  );
}

function AskPlaceholder({ group }: { group: GroupView }) {
  const suggested = [
    "Why is this blocked?",
    "Is this a false positive?",
    `How do I fix the ${group.categoryLabel.toLowerCase()}?`,
  ];
  return (
    <Section
      title={FINDING_DETAIL.askHeading}
      description={`${NOT_BUILT.apiGap} POST /runs/{id}/questions — the reasoning layer already answers questions; only the HTTP route is missing.`}
    >
      <div className="flex flex-wrap gap-2">
        {suggested.map((question) => (
          <span
            key={question}
            className="rounded-full border border-line px-3 py-1 text-xs text-muted"
            title={`Would be sent to the API as: ${question}`}
          >
            {question}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        Questions will be answered from the scan facts where possible, and the answer will always
        show which evidence settled it.
      </p>
    </Section>
  );
}
