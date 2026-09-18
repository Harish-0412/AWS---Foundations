/**
 * §8.1. One card per explanation group. Everything on it is a real field: chips from the policy
 * decision, the headline from the explanation unit, the location and rule IDs from the detector
 * evidence, and the fix preview from the first fix step.
 */
import { MoveRight } from "lucide-react";
import { Link } from "react-router-dom";

import { locationLabel, type GroupView } from "../api/view";
import { CopyButton, UntrustedText } from "./copy-widgets";
import { DecisionChip, EvidenceClassChip, SeverityChip } from "./chips";

export function FindingCard({ runId, group }: { runId: string; group: GroupView }) {
  const location = group.locations[0];
  const more = group.locations.length - 1 + group.locationsOmitted;
  const firstStep = group.fixSteps[0]?.action;
  return (
    <li className="border border-line bg-surface-raised p-4">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityChip severity={group.effectiveSeverity} />
        {group.outcome ? <DecisionChip outcome={group.outcome} /> : null}
        <EvidenceClassChip evidenceClass={group.evidenceClass} />
        {group.cached ? (
          <span className="font-mono text-[11px] uppercase tracking-wide text-faint">cached</span>
        ) : null}
      </div>
      <h3 className="mt-2 text-base font-semibold text-ink">
        <Link className="text-ink no-underline hover:underline" to={`/runs/${runId}/findings/${group.groupId}`}>
          {group.headline}
        </Link>
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        {location ? (
          <>
            <UntrustedText fromRepository>{locationLabel(location)}</UntrustedText>
            <CopyButton value={locationLabel(location)} label="Copy path" />
          </>
        ) : (
          <span>location not reported</span>
        )}
        <span aria-hidden>·</span>
        <UntrustedText>{group.ruleIds[0] ?? "rule not reported"}</UntrustedText>
        <span aria-hidden>·</span>
        <UntrustedText>{group.detectors[0] ?? "detector not reported"}</UntrustedText>
        {more > 0 ? (
          <>
            <span aria-hidden>·</span>
            <span>and {more} more location{more === 1 ? "" : "s"}</span>
          </>
        ) : null}
      </div>
      {firstStep ? (
        <p className="prose-column mt-2 text-sm text-ink">
          <span className="text-faint">First step: </span>
          {firstStep}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">
          No fix steps were generated for this finding. The evidence below is what we have.
        </p>
      )}
      <p className="mt-3">
        <Link
          className="inline-flex items-center gap-1 text-sm"
          to={`/runs/${runId}/findings/${group.groupId}`}
        >
          Open
          <MoveRight aria-hidden size={12} />
        </Link>
      </p>
    </li>
  );
}
