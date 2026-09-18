/**
 * The join layer. One place where raw documents become the shapes a page renders, so no
 * component has to know that a finding, its explanation unit and its policy decision arrive as
 * three separate lists.
 *
 * Nothing here invents a value: every field is either read from the result or is a lookup in
 * `copy/`. If a field is absent, the view model says so instead of guessing.
 */
import { categoryCopy } from "../copy/categories";
import { policyReasonText } from "../copy/glossary";
import type { Severity } from "../copy/vocabulary";
import type {
  Coverage,
  CoverageCheck,
  DecisionValue,
  Evidence,
  ExplanationBody,
  ExplanationUnit,
  Finding,
  FindingLocation,
  PipelineResult,
  PolicyDecision,
  RunView,
  SynthesisBody,
} from "./schemas";

const SEVERITIES: readonly Severity[] = ["critical", "high", "medium", "low", "info"];

export function asSeverity(value: string | null | undefined): Severity {
  const lowered = (value ?? "").toLowerCase();
  return (SEVERITIES.find((candidate) => candidate === lowered) ?? "info") as Severity;
}

export function asEvidenceClass(value: string | null | undefined) {
  return value === "deterministic_fact" ? ("deterministic_fact" as const) : ("detector_or_heuristic" as const);
}

export type GroupView = {
  groupId: string;
  unit: ExplanationUnit;
  body: ExplanationBody | null;
  category: string;
  categoryLabel: string;
  headline: string;
  label: string | null;
  findings: Finding[];
  primaryFinding: Finding | null;
  locations: FindingLocation[];
  locationsOmitted: number;
  decision: PolicyDecision | null;
  outcome: DecisionValue | null;
  detectorSeverity: Severity | null;
  effectiveSeverity: Severity;
  downgraded: boolean;
  evidenceClass: ReturnType<typeof asEvidenceClass>;
  policyReasons: { ruleId: string; text: string }[];
  detectors: string[];
  ruleIds: string[];
  cached: boolean;
  unitStatus: string;
  isSecret: boolean;
  isUnsafeCommand: boolean;
  difficulty: "self" | "care";
  cue: string;
  fixSteps: { action: string; refs: string[] }[];
  verify: string[];
  uncertainty: string[];
  impact: string | null;
  escalation: string | null;
};

function explainBody(unit: ExplanationUnit): ExplanationBody | null {
  return unit.explanation ?? null;
}

export function groupViews(result: PipelineResult): GroupView[] {
  const decisionsByFinding = new Map<string, PolicyDecision>();
  for (const decision of result.policy?.decisions ?? []) {
    decisionsByFinding.set(decision.finding_id, decision);
  }
  const findingsById = new Map(result.findings.map((item) => [item.finding_id, item]));
  const groupOfFinding = result.explanation?.report?.findings ?? {};

  const units = (result.explanation?.report?.units ?? []).filter((unit) => unit.kind !== "synthesis");

  return units.map((unit) => {
    const ids = new Set(unit.finding_ids);
    for (const [findingId, groupId] of Object.entries(groupOfFinding)) {
      if (groupId === unit.unit_id) ids.add(findingId);
    }
    const findings = [...ids]
      .map((id) => findingsById.get(id))
      .filter((item): item is Finding => Boolean(item));

    const decision = findings.map((item) => decisionsByFinding.get(item.finding_id)).find(Boolean) ?? null;
    const body = explainBody(unit);
    const category = unit.category ?? findings[0]?.finding_type ?? "";
    const copy = categoryCopy(category);
    const detectorSeverity = findings[0] ? asSeverity(findings[0].severity) : null;
    const effectiveSeverity = asSeverity(decision?.effective_severity ?? unit.severity ?? findings[0]?.severity);
    const locations = unit.locations.length
      ? unit.locations
      : findings.map((item) => item.location);

    return {
      groupId: unit.unit_id,
      unit,
      body,
      category,
      categoryLabel: unit.label ?? copy.label,
      headline: body?.headline ?? unit.label ?? unit.unit_id,
      label: unit.label ?? null,
      findings,
      primaryFinding: findings[0] ?? null,
      locations,
      locationsOmitted: unit.locations_omitted,
      decision,
      outcome: (decision?.outcome ?? (unit.decision as DecisionValue | null) ?? null) as DecisionValue | null,
      detectorSeverity,
      effectiveSeverity,
      downgraded:
        detectorSeverity !== null && decision !== null && decision.effective_severity !== detectorSeverity,
      evidenceClass: asEvidenceClass(decision?.evidence_class ?? unit.evidence_class),
      policyReasons: (unit.policy_reasons ?? []).map((ruleId) => ({
        ruleId,
        text: policyReasonText(ruleId),
      })),
      detectors: [...new Set(findings.map((item) => item.evidence.detector))],
      ruleIds: [...new Set(findings.map((item) => item.evidence.rule_id))],
      cached: unit.cached,
      unitStatus: unit.status,
      isSecret: category === "secret",
      isUnsafeCommand: category === "unsafe_command_execution",
      difficulty: copy.difficulty,
      cue: copy.cue,
      fixSteps: body?.fix_steps ?? [],
      verify: body?.verify ?? [],
      uncertainty: body?.uncertainty ?? [],
      impact: body?.impact ?? null,
      escalation: body?.escalation ?? null,
    };
  });
}

export function findGroup(groups: GroupView[], groupId: string): GroupView | null {
  return groups.find((group) => group.groupId === groupId) ?? null;
}

export type SynthesisView = {
  body: SynthesisBody;
  unit: ExplanationUnit;
  status: string;
  cached: boolean;
  priorities: { groupId: string; whyNow: string; refs: string[] }[];
  combinedRisks: { groupIds: string[]; risk: string; refs: string[] }[];
};

export function synthesisView(result: PipelineResult): SynthesisView | null {
  const unit = result.explanation?.report?.synthesis;
  const body = unit?.synthesis;
  if (!unit || !body) return null;
  return {
    body,
    unit,
    status: unit.status,
    cached: unit.cached,
    priorities: body.priorities.map((priority) => ({
      groupId: priority.group_id,
      whyNow: priority.why_now,
      refs: priority.refs,
    })),
    combinedRisks: body.combined_risks.map((risk) => ({
      groupIds: risk.group_ids,
      risk: risk.risk,
      refs: risk.refs,
    })),
  };
}

export function evidenceFor(finding: Finding): Evidence {
  return finding.evidence;
}

export function locationLabel(location: FindingLocation): string {
  return location.start_line ? `${location.path}:${location.start_line}` : location.path;
}

export type DecisionCounts = { deny: number; needs_human_approval: number; permit: number; total: number };

export function decisionCounts(groups: GroupView[]): DecisionCounts {
  const counts: DecisionCounts = { deny: 0, needs_human_approval: 0, permit: 0, total: 0 };
  for (const group of groups) {
    if (!group.outcome) continue;
    counts[group.outcome] += 1;
    counts.total += 1;
  }
  return counts;
}

export function groupsByOutcome(groups: GroupView[]): Record<DecisionValue, GroupView[]> {
  return {
    deny: groups.filter((group) => group.outcome === "deny"),
    needs_human_approval: groups.filter((group) => group.outcome === "needs_human_approval"),
    permit: groups.filter((group) => group.outcome === "permit"),
  };
}

export type CoverageFacts = {
  present: boolean;
  complete: boolean;
  planned: number;
  completed: number;
  incomplete: { check: string; reason?: string | null; disposition?: string | null; reviewId?: string | null }[];
  notApplicable: string[];
  missingCategories: string[];
  notice: string | null;
  resumable: boolean;
};

/** One coverage shape for the run view (check names) and the full result (check summaries). */
export function coverageFacts(run: RunView, result?: PipelineResult | null): CoverageFacts {
  const full: Coverage | null | undefined = result?.coverage;
  if (full) {
    return {
      present: true,
      complete: full.complete,
      planned: full.planned,
      completed: full.completed,
      incomplete: full.incomplete.map((entry) => ({
        check: entry.check,
        reason: entry.reason,
        disposition: entry.disposition,
        reviewId: entry.review_id,
      })),
      notApplicable: full.not_applicable,
      missingCategories: full.missing_categories,
      notice: full.notice ?? null,
      resumable: run.resumable,
    };
  }
  if (run.coverage) {
    return {
      present: true,
      complete: run.coverage.complete,
      planned: run.coverage.planned,
      completed: run.coverage.completed,
      incomplete: run.coverage.incomplete.map((check) => ({ check })),
      notApplicable: [],
      missingCategories: [],
      notice: run.coverage.notice ?? null,
      resumable: run.resumable,
    };
  }
  return {
    present: false,
    complete: false,
    planned: 0,
    completed: 0,
    incomplete: [],
    notApplicable: [],
    missingCategories: [],
    notice: null,
    resumable: run.resumable,
  };
}

/**
 * A findings count is only ever rendered together with its coverage. This function is the single
 * place that decides whether a count is allowed to appear bare (§10.4).
 */
export type CountWithCoverage = {
  count: number;
  coverage: CoverageFacts;
  /** True when the count must be accompanied by the coverage banner. */
  requiresBanner: boolean;
};

export function countWithCoverage(counts: number, coverage: CoverageFacts): CountWithCoverage {
  return {
    count: counts,
    coverage,
    requiresBanner: !coverage.present || !coverage.complete,
  };
}

export function checkSummaries(result: PipelineResult | null): CoverageCheck[] {
  return result?.coverage?.checks ?? [];
}

/** Group the run trace into the steps a person reads, keeping the recorded order. */
export type TraceStep = { state: string; events: { event: string; attempt?: number | null; delay?: number | null; error?: string | null; mapIndex?: number | null }[] };

export function traceSteps(result: PipelineResult | null): TraceStep[] {
  const steps: TraceStep[] = [];
  for (const entry of result?.trace ?? []) {
    const existing = steps.find((step) => step.state === entry.state);
    const event = {
      event: entry.event,
      attempt: entry.attempt,
      delay: entry.delay,
      error: entry.error,
      mapIndex: entry.map_index,
    };
    if (existing) existing.events.push(event);
    else steps.push({ state: entry.state, events: [event] });
  }
  return steps;
}
