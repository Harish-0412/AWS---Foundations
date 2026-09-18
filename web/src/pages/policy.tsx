/**
 * Decisions & rules (§7.9). The governance layer gets a page, not a tooltip: outcomes are
 * counted, every decision lists the rule IDs that produced it in plain sentences, and the
 * non-evaluated states are rendered honestly rather than hidden.
 */
import { useParams } from "react-router-dom";

import { useResult, useRun } from "../api/context";
import { groupViews } from "../api/view";
import { POLICY_PAGE, STATES, policyReasonText } from "../copy";
import { DecisionChip } from "../components/chips";
import { CopyButton, UntrustedText } from "../components/copy-widgets";
import { ErrorBlock, LoadingBlock } from "../components/states";
import { AppShell, RunTabs, Section } from "../components/shell";

export function PolicyPage() {
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

  const policy = result.data?.policy ?? null;
  const groups = result.data ? groupViews(result.data) : [];
  const counts = { deny: 0, needs_human_approval: 0, permit: 0 };
  for (const decision of policy?.decisions ?? []) counts[decision.outcome] += 1;

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink">{POLICY_PAGE.heading}</h1>
      <RunTabs runId={run.data.run_id} />

      {result.isLoading ? <LoadingBlock label={STATES.loadingResult} /> : null}
      {result.isError ? <ErrorBlock error={result.error} onRetry={() => void result.refetch()} /> : null}

      {!policy && !result.isLoading ? (
        <div className="mt-4">
          <Section title="No policy result">
            <p className="prose-column text-sm text-ink">
              This run never reached the policy engine, so there is nothing to decide. That is why
              nothing below is authorized.
            </p>
          </Section>
        </div>
      ) : null}

      {policy ? (
        <>
          <Section
            title={POLICY_PAGE.summaryHeading}
            description={
              <span className="flex flex-wrap items-center gap-3">
                <span>
                  Effective environment: {policy.decisions[0]?.effective_environment ?? "not reported"}
                </span>
                <span>
                  {POLICY_PAGE.versionLabel}:{" "}
                  <code className="font-mono text-[12px]">{policy.policy_version.slice(0, 12)}…</code>
                </span>
                <CopyButton value={policy.policy_version} label="Copy full hash" />
              </span>
            }
          >
            <p className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <DecisionChip outcome="deny" /> {counts.deny}
              </span>
              <span className="flex items-center gap-2">
                <DecisionChip outcome="needs_human_approval" /> {counts.needs_human_approval}
              </span>
              <span className="flex items-center gap-2">
                <DecisionChip outcome="permit" /> {counts.permit}
              </span>
              <span className="text-muted">engine status: {policy.status}</span>
            </p>
            {policy.status === "capped" ? (
              <p className="prose-column mt-3 text-sm text-warn">{POLICY_PAGE.capped}</p>
            ) : null}
            {policy.status === "denied" ? (
              <p className="prose-column mt-3 text-sm text-warn">{POLICY_PAGE.denied}</p>
            ) : null}
            {policy.status === "error" ? (
              <p className="prose-column mt-3 text-sm text-error">
                {POLICY_PAGE.error} {policy.reason ? `(${policy.reason})` : ""}
              </p>
            ) : null}
            <p className="prose-column mt-3 text-sm text-muted">{POLICY_PAGE.versionNote}</p>
          </Section>

          <Section title={POLICY_PAGE.tableHeading}>
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">Each finding, its decision and the rules behind it</caption>
              <thead>
                <tr className="border-b border-line text-left">
                  <th scope="col" className="py-2 pr-3 font-medium">Finding</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Decision</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Environment</th>
                  <th scope="col" className="py-2 font-medium">Rules that applied</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const decision = group.decision;
                  return (
                    <tr key={group.groupId} className="border-b border-line align-top">
                      <th scope="row" className="py-3 pr-3 text-left font-normal">
                        <span className="font-mono text-[12px] text-faint">{group.groupId}</span>
                        <span className="mt-1 block text-ink">{group.headline}</span>
                        <span className="mt-1 block font-mono text-[11px] text-muted">
                          {group.detectors.join(", ")} · {group.ruleIds.join(", ")}
                        </span>
                      </th>
                      <td className="py-3 pr-3">
                        {decision ? (
                          <DecisionChip outcome={decision.outcome} long />
                        ) : (
                          <span className="text-muted">not decided</span>
                        )}
                        {decision?.evaluation_error ? (
                          <span className="mt-1 block text-[11px] text-error">
                            the rule evaluation reported an error
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-3 text-muted">
                        {decision?.effective_environment ?? "not reported"}
                        {decision ? (
                          <span className="mt-1 block text-[11px]">
                            severity {decision.effective_severity} · {decision.resource_count} location
                            {decision.resource_count === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3">
                        <ul className="flex flex-col gap-2">
                          {(decision?.reasons ?? []).map((ruleId) => (
                            <li key={ruleId} className="flex flex-wrap items-baseline gap-2">
                              <UntrustedText>{ruleId}</UntrustedText>
                              <span className="text-ink">{policyReasonText(ruleId)}</span>
                            </li>
                          ))}
                          {(decision?.reasons ?? []).length === 0 ? (
                            <li className="text-muted">No rule ID was reported for this decision.</li>
                          ) : null}
                        </ul>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
        </>
      ) : null}
    </AppShell>
  );
}
