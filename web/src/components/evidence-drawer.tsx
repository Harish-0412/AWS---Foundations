/**
 * §8.2. The evidence drawer answers "how do you know?" with the fields the detector actually
 * produced. Only allowlisted metadata keys survive the schema, and every repository-controlled
 * string is rendered as inert text.
 */
import { ChevronRight } from "lucide-react";

import { FINDING_DETAIL } from "../copy";
import { locationLabel, type GroupView } from "../api/view";
import { CopyButton, UntrustedText } from "./copy-widgets";

function MetadataEntry({ name, value }: { name: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return (
      <div className="mt-2">
        <p className="font-mono text-[11px] uppercase tracking-wide text-faint">{name}</p>
        <ul className="mt-1 flex flex-col gap-1">
          {value.map((item) => (
            <li key={String(item)}>
              <UntrustedText fromRepository>{String(item)}</UntrustedText>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (typeof value === "boolean") {
    return (
      <div className="mt-2">
        <p className="font-mono text-[11px] uppercase tracking-wide text-faint">{name}</p>
        <p className="mt-1 text-sm text-ink">{value ? "yes" : "no"}</p>
      </div>
    );
  }
  return (
    <div className="mt-2">
      <p className="font-mono text-[11px] uppercase tracking-wide text-faint">{name}</p>
      <div className="mt-1">
        <UntrustedText fromRepository>{String(value)}</UntrustedText>
      </div>
    </div>
  );
}

export function EvidenceDrawer({ group, defaultOpen }: { group: GroupView; defaultOpen: boolean }) {
  const detectors = group.detectors.length ? group.detectors : ["not reported"];
  const rules = group.ruleIds.length ? group.ruleIds : ["not reported"];
  return (
    <details
      className="mt-4 border border-line bg-surface-raised p-3"
      open={defaultOpen}
      data-testid="evidence-drawer"
    >
      <summary className="flex cursor-pointer items-center gap-1 text-sm font-semibold text-ink">
        <ChevronRight aria-hidden size={14} className="details-chevron" />
        {FINDING_DETAIL.evidenceHeading}
      </summary>
      <div className="mt-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-faint">detector</p>
            <ul className="mt-1 flex flex-col gap-1">
              {detectors.map((detector) => (
                <li key={detector}>
                  <UntrustedText>{detector}</UntrustedText>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-faint">rule ID</p>
            <ul className="mt-1 flex flex-col gap-1">
              {rules.map((rule) => (
                <li key={rule}>
                  <UntrustedText>{rule}</UntrustedText>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-3">
          <p className="font-mono text-[11px] uppercase tracking-wide text-faint">
            {FINDING_DETAIL.locationsHeading}
          </p>
          <ul className="mt-1 flex flex-col gap-1">
            {group.locations.map((location) => (
              <li key={locationLabel(location)} className="flex flex-wrap items-center gap-2">
                <UntrustedText fromRepository>{locationLabel(location)}</UntrustedText>
                <CopyButton value={locationLabel(location)} label={FINDING_DETAIL.copyPath} />
              </li>
            ))}
            {group.locations.length === 0 ? <li className="text-muted">not reported</li> : null}
          </ul>
          {group.locationsOmitted > 0 ? (
            <p className="mt-1 text-xs text-muted">
              and {group.locationsOmitted} more location{group.locationsOmitted === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
        {group.findings.map((finding) => (
          <div key={finding.finding_id} className="mt-3 border-t border-line pt-2">
            <p className="font-mono text-[11px] uppercase tracking-wide text-faint">
              finding {finding.finding_id}
            </p>
            {finding.evidence.message ? (
              <UntrustedText className="mt-1" fromRepository>
                {finding.evidence.message}
              </UntrustedText>
            ) : null}
            {Object.entries(finding.evidence.metadata).map(([name, value]) => (
              <MetadataEntry key={name} name={name} value={value} />
            ))}
          </div>
        ))}
      </div>
    </details>
  );
}
