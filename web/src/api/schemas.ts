/**
 * Zod schemas for the backend contracts this interface reads.
 *
 * They mirror `pipeline-run-1`, `pipeline-result-1` and `review-item-1`. Responding shapes are
 * the ones the pipeline really writes (see `agent/orchestration/steps.py`), including the
 * narrower documents a failed or reused run produces. Unknown keys are stripped rather than
 * rejected, so a backend that adds a field does not break a page; a *version* change is caught
 * explicitly by comparing `schema_version`.
 */
import { z } from "zod";

export const RUN_SCHEMA = "pipeline-run-1";
export const RESULT_SCHEMA = "pipeline-result-1";
export const REVIEW_SCHEMA = "review-item-1";

export const runStatus = z.enum(["queued", "running", "completed", "partial", "failed"]);
export const decisionOutcome = z.enum(["permit", "needs_human_approval", "deny"]);
export const checkStatus = z.enum(["succeeded", "incomplete", "not_applicable"]);
export const policyStatus = z.enum(["evaluated", "capped", "denied", "error"]);

export const location = z.object({
  path: z.string(),
  start_line: z.number().nullish(),
  end_line: z.number().nullish(),
});

/** Allowlisted evidence metadata keys (§8.2). Anything else is dropped before it reaches the DOM. */
export const ALLOWED_EVIDENCE_KEYS = [
  "resources",
  "resource",
  "checks",
  "inline_suppressed_checks",
  "environment_variables",
  "environment_variable",
  "known_example",
] as const;

const evidenceMetadata = z
  .record(z.string(), z.unknown())
  .default({})
  .transform((metadata) => {
    const kept: Record<string, unknown> = {};
    for (const key of ALLOWED_EVIDENCE_KEYS) {
      if (key in metadata) kept[key] = metadata[key];
    }
    return kept;
  });

export const evidence = z.object({
  detector: z.string(),
  rule_id: z.string(),
  message: z.string().default(""),
  metadata: evidenceMetadata,
});

export const finding = z.object({
  finding_id: z.string(),
  finding_type: z.string(),
  severity: z.string(),
  schema_version: z.string().default("1.0"),
  content_hash: z.string().default(""),
  location,
  evidence,
});

export const coverageCheck = z.object({
  check: z.string(),
  status: checkStatus,
  categories: z.array(z.string()).default([]),
  findings: z.number().optional(),
  cached: z.boolean().optional(),
  reason: z.string().nullish(),
  disposition: z.string().nullish(),
  review_id: z.string().nullish(),
});

export const coverage = z.object({
  complete: z.boolean(),
  planned: z.number(),
  completed: z.number(),
  incomplete: z
    .array(
      z.object({
        check: z.string(),
        reason: z.string().nullish(),
        disposition: z.string().nullish(),
        review_id: z.string().nullish(),
      }),
    )
    .default([]),
  not_applicable: z.array(z.string()).default([]),
  missing_categories: z.array(z.string()).default([]),
  checks: z.array(coverageCheck).default([]),
  notice: z.string().nullish(),
});

/** The compact coverage a run view carries: incomplete checks are names, not objects. */
export const runCoverage = z.object({
  complete: z.boolean(),
  planned: z.number().default(0),
  completed: z.number().default(0),
  incomplete: z.array(z.string()).default([]),
  notice: z.string().nullish(),
});

export const policyDecision = z.object({
  finding_id: z.string(),
  outcome: decisionOutcome,
  policy_version: z.string().default(""),
  content_hash: z.string().default(""),
  effective_environment: z.string().nullish(),
  evidence_class: z.string().default("detector_or_heuristic"),
  effective_severity: z.string().default("info"),
  resource_count: z.number().default(1),
  reasons: z.array(z.string()).default([]),
  evaluation_error: z.boolean().default(false),
});

export const policy = z.object({
  status: policyStatus,
  reason: z.string().nullish(),
  processing: z.string().nullish(),
  policy_version: z.string().default(""),
  decisions: z.array(policyDecision).default([]),
  category_counts: z.record(z.string(), z.number()).optional(),
  total_findings: z.number().optional(),
  cached: z.boolean().optional(),
});

export const fixStep = z.object({
  action: z.string(),
  refs: z.array(z.string()).default([]),
});

export const explanationBody = z.object({
  headline: z.string(),
  what_happened: z.string(),
  why_it_matters: z.string(),
  impact: z.string().default("misconfiguration"),
  fix_steps: z.array(fixStep).default([]),
  verify: z.array(z.string()).default([]),
  uncertainty: z.array(z.string()).default([]),
  refs: z.array(z.string()).default([]),
  escalation: z.string().default("none"),
});

export const synthesisBody = z.object({
  headline: z.string(),
  overview: z.string(),
  priorities: z
    .array(z.object({ group_id: z.string(), why_now: z.string(), refs: z.array(z.string()).default([]) }))
    .default([]),
  combined_risks: z
    .array(z.object({ group_ids: z.array(z.string()).default([]), risk: z.string(), refs: z.array(z.string()).default([]) }))
    .default([]),
  next_step: z.string(),
  escalation: z.string().default("none"),
});

export const routing = z
  .object({
    tier: z.string().nullish(),
    score: z.number().nullish(),
    escalated_from: z.string().nullish(),
    escalation_reason: z.string().nullish(),
    features: z.record(z.string(), z.number()).default({}),
  })
  .nullish();

export const unit = z.object({
  unit_id: z.string(),
  kind: z.string().default("group"),
  category: z.string().nullish(),
  label: z.string().nullish(),
  rule: z.string().nullish(),
  severity: z.string().nullish(),
  decision: z.string().nullish(),
  evidence_class: z.string().nullish(),
  policy_reasons: z.array(z.string()).default([]),
  requires_human_review: z.boolean().default(false),
  review_reasons: z.array(z.string()).default([]),
  finding_ids: z.array(z.string()).default([]),
  locations: z.array(location).default([]),
  locations_omitted: z.number().default(0),
  cached: z.boolean().default(false),
  source: z.string().nullish(),
  status: z.string().default("deterministic"),
  note: z.string().nullish(),
  model: z.string().nullish(),
  routing,
  explanation: explanationBody.nullish(),
  synthesis: synthesisBody.nullish(),
});

export const reportUsage = z
  .object({
    model_calls: z.number().default(0),
    model_calls_avoided: z.number().default(0),
    estimated_cost_usd: z.number().default(0),
    cost_basis: z.string().nullish(),
    budget: z.object({ max_calls: z.number(), max_cost_usd: z.number() }).nullish(),
    budget_exhausted: z.boolean().default(false),
    calls_by_tier: z.record(z.string(), z.number()).default({}),
    circuit_open: z.string().nullish(),
    events: z.record(z.string(), z.number()).default({}),
    provider_failures: z.record(z.string(), z.number()).default({}),
    input_tokens: z.number().default(0),
    output_tokens: z.number().default(0),
    cache_read_input_tokens: z.number().default(0),
    cache_write_input_tokens: z.number().default(0),
    throttled: z.number().default(0),
    prompts: z.array(z.unknown()).default([]),
  })
  .nullish();

export const reportScan = z
  .object({
    findings: z.number().default(0),
    groups: z.number().default(0),
    categories: z.record(z.string(), z.number()).default({}),
    complete: z.boolean().default(false),
    detector_errors: z.number().default(0),
    environment: z.string().nullish(),
    processing: z.string().nullish(),
  })
  .nullish();

export const reportSummary = z
  .object({
    units: z.number().default(0),
    by_status: z.record(z.string(), z.number()).default({}),
    requires_human_review: z.array(z.string()).default([]),
  })
  .nullish();

export const reasoningReport = z.object({
  schema_version: z.string(),
  status: z.string(),
  audience: z.string().default("beginner"),
  provider: z.string().nullish(),
  models: z.record(z.string(), z.unknown()).default({}),
  policy_version: z.string().nullish(),
  source_hash: z.string().nullish(),
  decisions_unchanged: z.boolean().default(true),
  findings: z.record(z.string(), z.string()).default({}),
  scan: reportScan,
  summary: reportSummary,
  synthesis: unit.nullish(),
  units: z.array(unit).default([]),
  usage: reportUsage,
  versions: z.record(z.string(), z.string()).default({}),
});

export const runUsage = z.object({
  detectors_run: z.number().default(0),
  detectors_reused: z.number().default(0),
  model_calls: z.number().default(0),
  estimated_model_cost_usd: z.number().default(0),
  reused_result: z.boolean().optional(),
});

export const traceEntry = z.object({
  state: z.string(),
  event: z.string(),
  map_index: z.number().nullish(),
  attempt: z.number().nullish(),
  delay: z.number().nullish(),
  error: z.string().nullish(),
});

export const pipelineResult = z.object({
  schema_version: z.string(),
  pipeline_version: z.string().default("pipeline-1"),
  run_id: z.string(),
  generation: z.number().default(0),
  status: runStatus,
  reason: z.string().nullish(),
  error: z.string().nullish(),
  failed_step: z.string().nullish(),
  review_items: z.array(z.string()).default([]),
  resumable: z.boolean().default(false),
  source: z
    .object({
      kind: z.string().nullish(),
      label: z.string().nullish(),
      revision: z.string().nullish(),
    })
    .nullish(),
  content_hash: z.string().nullish(),
  scan_id: z.string().nullish(),
  coverage: coverage.nullish(),
  findings: z.array(finding).default([]),
  artifacts: z
    .object({
      report_ref: z.string().nullish(),
      policy_ref: z.string().nullish(),
      explanation_ref: z.string().nullish(),
    })
    .nullish(),
  policy: policy.nullish(),
  explanation: z.object({ status: z.string(), report: reasoningReport.nullish() }).nullish(),
  usage: runUsage.default({
    detectors_run: 0,
    detectors_reused: 0,
    model_calls: 0,
    estimated_model_cost_usd: 0,
  }),
  completed_at: z.number().nullish(),
  reused_from: z.string().nullish(),
  trace: z.array(traceEntry).optional(),
});

export const runView = z.object({
  run_id: z.string(),
  status: runStatus,
  reason: z.string().nullish(),
  generation: z.number().default(0),
  scan_id: z.string().nullish(),
  coverage: runCoverage.nullish(),
  counts: z
    .object({
      findings: z.number().default(0),
      review_items: z.number().default(0),
      model_calls: z.number().default(0),
    })
    .nullish(),
  resumable: z.boolean().default(false),
  created_at: z.number().nullish(),
  updated_at: z.number().nullish(),
  schema_version: z.string().optional(),
  content_hash: z.string().nullish(),
  error: z.string().nullish(),
  failed_step: z.string().nullish(),
  request: z
    .object({
      source_ref: z.string().nullish(),
      environments: z.array(z.string()).default([]),
      audience: z.string().nullish(),
    })
    .nullish(),
});

export const reviewItem = z.object({
  review_id: z.string(),
  run_id: z.string().default(""),
  scan_id: z.string().nullish(),
  step: z.string(),
  error: z.string().default(""),
  reason: z.string().default("unexpected_error"),
  disposition: z.string().default("human_review"),
  status: z.string().default("open"),
  created_at: z.number().nullish(),
  generation: z.number().default(0),
  content_hash: z.string().nullish(),
  schema_version: z.string().optional(),
});

export const reviewItemsResponse = z.object({
  run_id: z.string(),
  items: z.array(reviewItem).default([]),
});

export type PipelineResult = z.infer<typeof pipelineResult>;
export type RunView = z.infer<typeof runView>;
export type RunCoverage = z.infer<typeof runCoverage>;
export type Coverage = z.infer<typeof coverage>;
export type CoverageCheck = z.infer<typeof coverageCheck>;
export type PolicyDocument = z.infer<typeof policy>;
export type PolicyDecision = z.infer<typeof policyDecision>;
export type Finding = z.infer<typeof finding>;
export type Evidence = z.infer<typeof evidence>;
export type FindingLocation = z.infer<typeof location>;
export type ReasoningReport = z.infer<typeof reasoningReport>;
export type ExplanationUnit = z.infer<typeof unit>;
export type SynthesisBody = z.infer<typeof synthesisBody>;
export type ExplanationBody = z.infer<typeof explanationBody>;
export type ReportUsage = z.infer<typeof reportUsage>;
export type TraceEntry = z.infer<typeof traceEntry>;
export type ReviewItem = z.infer<typeof reviewItem>;
export type CheckStatusValue = z.infer<typeof checkStatus>;
export type DecisionValue = z.infer<typeof decisionOutcome>;
export type RunStatusValue = z.infer<typeof runStatus>;
export type PolicyStatusValue = z.infer<typeof policyStatus>;
export type Routing = z.infer<typeof routing>;
