/**
 * Status vocabulary (§9.2) and chip wording.
 *
 * These keys are backend values. A screen may only render the value through this table, so a
 * new backend value shows up as a visible gap ("we don't describe this yet") instead of
 * silently leaking a raw enum into the interface.
 */

export type RunStatus = "queued" | "running" | "completed" | "partial" | "failed";
export type Decision = "permit" | "needs_human_approval" | "deny";
export type CheckStatus = "succeeded" | "incomplete" | "not_applicable";
export type EvidenceClass = "deterministic_fact" | "detector_or_heuristic";
export type Severity = "critical" | "high" | "medium" | "low" | "info";

export const RUN_STATUS: Record<RunStatus, { label: string; sentence: string }> = {
  queued: { label: "Waiting to start", sentence: "The run is queued and has not started yet." },
  running: { label: "Running", sentence: "The checks are running now." },
  completed: {
    label: "Finished",
    sentence: "Finished — all applicable checks ran.",
  },
  partial: {
    label: "Finished with gaps",
    sentence: "Finished with gaps: at least one check did not complete.",
  },
  failed: { label: "Couldn't finish", sentence: "Couldn't finish. Nothing was decided for you." },
};

/** Terminal statuses stop the poller (§13.3). */
export const TERMINAL_RUN_STATUSES: readonly RunStatus[] = ["completed", "partial", "failed"];

export const DECISION: Record<Decision, { label: string; long: string; sentence: string }> = {
  permit: {
    label: "Eligible",
    long: "Eligible for automated processing (not deploy permission)",
    sentence:
      "A deterministic fact in a low-risk category, so the rule set allows automated processing. This is never permission to deploy.",
  },
  needs_human_approval: {
    label: "Needs a person",
    long: "Needs a person to review it",
    sentence: "A versioned rule requires a person to look at this before anything else happens.",
  },
  deny: {
    label: "Blocked",
    long: "Blocked from processing",
    sentence: "A versioned rule blocks automated processing. A person must resolve it.",
  },
};

export const EVIDENCE_CLASS: Record<EvidenceClass, { label: string; sentence: string }> = {
  deterministic_fact: {
    label: "Measured fact",
    sentence: "Read directly from your files, with no pattern matching involved.",
  },
  detector_or_heuristic: {
    label: "Pattern match — needs a human eye",
    sentence: "A scanner matched a pattern. A pattern can match code that is already safe.",
  },
};

export const CHECK_STATUS: Record<CheckStatus, { label: string; sentence: string }> = {
  succeeded: { label: "Ran", sentence: "This check ran and produced its results." },
  incomplete: {
    label: "Did not finish",
    sentence: "This check did not finish, so some kinds of issue may be missing.",
  },
  not_applicable: {
    label: "Didn't apply to your files",
    sentence: "Your repository has no files of the type this check reads. This is a normal state.",
  },
};

export const SEVERITY_ORDER: readonly Severity[] = ["critical", "high", "medium", "low", "info"];

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
  info: "info",
};

/** Unit statuses from the reasoning report, in the words the user reads (§8.4). */
export const UNIT_STATUS: Record<
  string,
  { label: string; tone: "neutral" | "amber"; sentence: string }
> = {
  deterministic: {
    label: "Written from a vetted template — no model was used",
    tone: "neutral",
    sentence: "This text comes from a reviewed template in the product, filled with your scan facts.",
  },
  model_validated: {
    label: "Written by a model, checked against the evidence",
    tone: "neutral",
    sentence: "A model wrote this sentence, and it passed the grounding checks before display.",
  },
  needs_human_review: {
    label: "The model's answer failed our checks twice — showing the vetted template instead",
    tone: "amber",
    sentence:
      "The model's output did not pass validation, so you are reading the reviewed template instead.",
  },
  degraded: {
    label: "The model was unavailable — showing the vetted template",
    tone: "amber",
    sentence: "No model answered, so this text comes from the reviewed template.",
  },
};

export const UNIT_STATUS_FALLBACK = {
  label: "Provenance not reported for this text",
  tone: "amber" as const,
  sentence: "The run did not report how this text was produced, so treat it as unverified.",
};

export function unitStatusCopy(status: string | null | undefined) {
  return (status && UNIT_STATUS[status]) || UNIT_STATUS_FALLBACK;
}

/** Impact vocabulary from the reasoning contract (`IMPACTS`). */
export const IMPACT_LABEL: Record<string, string> = {
  credential_exposure: "Exposed credential",
  privilege_escalation: "Wider permissions than needed",
  data_exposure: "Data exposure",
  unauthorized_access: "Unauthorized access",
  unsafe_code_execution: "Command execution",
  runtime_failure: "It fails at runtime",
  misconfiguration: "Misconfiguration",
};

/** Escalation vocabulary from the reasoning contract (`ESCALATIONS`). */
export const ESCALATION_LABEL: Record<string, string> = {
  none: "No escalation",
  needs_stronger_model: "Judged to need a stronger model",
  conflicting_evidence: "The evidence disagrees with itself",
  insufficient_evidence: "Not enough evidence to be sure",
  possible_prompt_injection: "Your files contained text that tried to give instructions",
  risk_higher_than_policy: "The risk looks worse than the policy outcome says",
};

export function impactLabel(impact: string | null | undefined): string | null {
  if (!impact) return null;
  return IMPACT_LABEL[impact] ?? impact.replaceAll("_", " ");
}

export function escalationLabel(escalation: string | null | undefined): string | null {
  if (!escalation || escalation === "none") return null;
  return ESCALATION_LABEL[escalation] ?? escalation.replaceAll("_", " ");
}
