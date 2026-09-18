/**
 * Chips. Each one shows an icon *and* its label, so state never depends on colour alone
 * (§14.2). Decision chips use the cool family; severity chips use the warm ramp; the two never
 * share a hue.
 */
import {
  Ban,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleSlash,
  Info,
  MinusCircle,
  Ruler,
  ShieldQuestion,
  UserCheck,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  CHECK_STATUS,
  DECISION,
  EVIDENCE_CLASS,
  RUN_STATUS,
  SEVERITY_LABEL,
  type CheckStatus,
  type Decision,
  type EvidenceClass,
  type RunStatus,
  type Severity,
} from "../copy";
import { cn } from "../lib/cn";

type Tone = "neutral" | "warn" | "error" | "severity" | "decision";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "border-line text-muted bg-surface-sunken",
  warn: "border-warn text-warn bg-warn-fill",
  error: "border-error text-error bg-error-fill",
  severity: "border-line-strong text-ink bg-surface-raised",
  decision: "border-line-strong text-ink bg-surface-raised",
};

const SEVERITY_TEXT: Record<Severity, string> = {
  critical: "text-severity-critical",
  high: "text-severity-high",
  medium: "text-severity-medium",
  low: "text-severity-low",
  info: "text-severity-info",
};

const DECISION_TEXT: Record<Decision, string> = {
  deny: "text-decision-deny",
  needs_human_approval: "text-decision-review",
  permit: "text-decision-permit",
};

export function Chip({
  tone = "neutral",
  children,
  title,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[11px] leading-5 uppercase tracking-wide",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function RunStatusChip({ status }: { status: RunStatus | string }) {
  const known = (RUN_STATUS as Record<string, { label: string; sentence: string }>)[status];
  const tone: Tone =
    status === "failed" ? "error" : status === "partial" ? "warn" : "neutral";
  const icon =
    status === "failed" ? (
      <CircleSlash aria-hidden size={12} />
    ) : status === "partial" ? (
      <CircleAlert aria-hidden size={12} />
    ) : status === "completed" ? (
      <CircleCheck aria-hidden size={12} />
    ) : (
      <MinusCircle aria-hidden size={12} />
    );
  return (
    <Chip tone={tone} title={known?.sentence}>
      {icon}
      {known?.label ?? status}
    </Chip>
  );
}

export function SeverityChip({ severity }: { severity: Severity }) {
  const icon =
    severity === "critical" || severity === "high" ? (
      <CircleAlert aria-hidden size={12} className={SEVERITY_TEXT[severity]} />
    ) : severity === "info" ? (
      <Info aria-hidden size={12} className={SEVERITY_TEXT[severity]} />
    ) : (
      <Ruler aria-hidden size={12} className={SEVERITY_TEXT[severity]} />
    );
  return (
    <Chip tone="severity" title={`Severity: ${SEVERITY_LABEL[severity]}`}>
      {icon}
      <span className={SEVERITY_TEXT[severity]}>{SEVERITY_LABEL[severity]}</span>
    </Chip>
  );
}

export function DecisionChip({
  outcome,
  long = false,
  title,
}: {
  outcome: Decision | string;
  long?: boolean;
  title?: string;
}) {
  const known = (DECISION as Record<string, { label: string; long: string; sentence: string }>)[outcome];
  const icon =
    outcome === "deny" ? (
      <Ban aria-hidden size={12} className={DECISION_TEXT.deny} />
    ) : outcome === "needs_human_approval" ? (
      <UserCheck aria-hidden size={12} className={DECISION_TEXT.needs_human_approval} />
    ) : outcome === "permit" ? (
      <CircleCheck aria-hidden size={12} className={DECISION_TEXT.permit} />
    ) : (
      <CircleHelp aria-hidden size={12} />
    );
  const text = long ? known?.long ?? outcome : known?.label ?? outcome;
  return (
    <Chip tone="decision" title={title ?? known?.sentence}>
      {icon}
      <span
        className={cn(
          outcome === "deny"
            ? DECISION_TEXT.deny
            : outcome === "needs_human_approval"
              ? DECISION_TEXT.needs_human_approval
              : outcome === "permit"
                ? DECISION_TEXT.permit
                : "text-muted",
        )}
      >
        {text}
      </span>
    </Chip>
  );
}

export function EvidenceClassChip({ evidenceClass }: { evidenceClass: EvidenceClass }) {
  const copy = EVIDENCE_CLASS[evidenceClass];
  return (
    <Chip tone="neutral" title={copy.sentence}>
      {evidenceClass === "deterministic_fact" ? (
        <Ruler aria-hidden size={12} />
      ) : (
        <ShieldQuestion aria-hidden size={12} />
      )}
      {copy.label}
    </Chip>
  );
}

export function CheckStatusChip({ status }: { status: CheckStatus | string }) {
  const known = (CHECK_STATUS as Record<string, { label: string; sentence: string }>)[status];
  const tone: Tone = status === "incomplete" ? "warn" : "neutral";
  const icon =
    status === "succeeded" ? (
      <CircleCheck aria-hidden size={12} />
    ) : status === "incomplete" ? (
      <CircleAlert aria-hidden size={12} />
    ) : (
      <Info aria-hidden size={12} />
    );
  return (
    <Chip tone={tone} title={known?.sentence}>
      {icon}
      {known?.label ?? status}
    </Chip>
  );
}

export function DispositionChip({ whoActs }: { whoActs: "you" | "us" | "operator" }) {
  const label =
    whoActs === "you" ? "You can act" : whoActs === "operator" ? "Operator" : "We act";
  return (
    <Chip tone="neutral" title={label}>
      {whoActs === "operator" ? <Wrench aria-hidden size={12} /> : <UserCheck aria-hidden size={12} />}
      {label}
    </Chip>
  );
}
