/**
 * §10.2. A decision is never shown without the rules that produced it, in plain sentences, plus
 * the policy version and the effective environment.
 */
import { POLICY_PAGE } from "../copy";
import { policyReasonText } from "../copy/glossary";
import { CopyButton } from "./copy-widgets";

export function PolicyReasonList({
  reasons,
  emptyNote = "No rule ID was reported for this decision.",
}: {
  reasons: { ruleId: string; text: string }[];
  emptyNote?: string;
}) {
  if (reasons.length === 0) return <p className="text-sm text-muted">{emptyNote}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {reasons.map((reason) => (
        <li key={reason.ruleId} className="flex flex-wrap items-baseline gap-2">
          <code className="rounded bg-surface-sunken px-1 py-0.5 font-mono text-[12px]">
            {reason.ruleId}
          </code>
          <span className="text-sm text-ink">{reason.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function PolicySummary({
  policyVersion,
  environment,
  outcome,
  evidenceClass,
  reasons,
}: {
  policyVersion: string | null;
  environment: string | null;
  outcome: string | null;
  evidenceClass: string;
  reasons: string[];
}) {
  return (
    <div className="text-sm">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-faint">Outcome</dt>
          <dd className="mt-1">{outcome ?? "not decided"}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-faint">
            Effective environment
          </dt>
          <dd className="mt-1">{environment ?? "not reported"}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-faint">
            Evidence class
          </dt>
          <dd className="mt-1">{evidenceClass}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-wide text-faint">
            {POLICY_PAGE.versionLabel}
          </dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2">
            <code className="font-mono text-[12px]">
              {policyVersion ? `${policyVersion.slice(0, 12)}…` : "not reported"}
            </code>
            {policyVersion ? <CopyButton value={policyVersion} label="Copy full hash" /> : null}
          </dd>
        </div>
      </dl>
      <div className="mt-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-faint">Rules that applied</p>
        <div className="mt-1">
          <PolicyReasonList reasons={reasons.map((ruleId) => ({ ruleId, text: policyReasonText(ruleId) }))} />
        </div>
      </div>
    </div>
  );
}
