/**
 * Reason codes → one plain sentence, one remedy, and who can act (§9.3).
 *
 * Every code the backend can produce has an entry. An unknown code renders the code itself
 * plus "we don't have a description for this yet" (§21) — never a blank.
 */

export type WhoActs = "you" | "us" | "operator";

export type ReasonCopy = {
  sentence: string;
  remedy?: string;
  whoActs: WhoActs;
  retryable: boolean;
};

export const WHO_ACTS_LABEL: Record<WhoActs, string> = {
  you: "You can act on this",
  us: "We have to look at this",
  operator: "An operator has to fix this",
};

export const REASON_CODES: Record<string, ReasonCopy> = {
  // Input rejections (the run exists and reports why it could not start).
  size_limit_exceeded: {
    sentence: "This repository is larger than the 25 MB we scan.",
    remedy: "Scan a subfolder.",
    whoActs: "you",
    retryable: false,
  },
  file_size_exceeded: {
    sentence: "One file is larger than the 2 MB we read.",
    remedy: "Remove or ignore that file, or scan a subfolder.",
    whoActs: "you",
    retryable: false,
  },
  file_count_exceeded: {
    sentence: "More than 2,000 files.",
    remedy: "Scan a subfolder.",
    whoActs: "you",
    retryable: false,
  },
  depth_limit_exceeded: {
    sentence: "Folders nested deeper than 30 levels.",
    whoActs: "you",
    retryable: false,
  },
  links_not_supported: {
    sentence: "It contains symbolic links, which we don't follow.",
    remedy: "Remove or scan a copy.",
    whoActs: "you",
    retryable: false,
  },
  special_files_not_supported: {
    sentence: "It contains a socket, device or other special file we won't read.",
    remedy: "Remove that file and scan again.",
    whoActs: "you",
    retryable: false,
  },
  archive_rejected: {
    sentence: "We couldn't safely open that .zip.",
    remedy: "Re-zip without links or encryption.",
    whoActs: "you",
    retryable: false,
  },
  repository_url_rejected: {
    sentence: "Only public https Git URLs, no credentials or ports.",
    remedy: "Fix the URL.",
    whoActs: "you",
    retryable: false,
  },
  repository_address_rejected: {
    sentence: "That URL resolves to a private address, which we won't connect to.",
    remedy: "Use the public https URL of the repository.",
    whoActs: "you",
    retryable: false,
  },
  repository_unavailable: {
    sentence: "We couldn't reach that repository.",
    remedy: "Retry, or check that it is public.",
    whoActs: "you",
    retryable: true,
  },
  repository_unreachable: {
    sentence: "The repository host could not be resolved.",
    remedy: "Check the URL for a typo, then retry.",
    whoActs: "you",
    retryable: true,
  },
  repository_invalid: {
    sentence: "We cloned the repository but found no readable revision.",
    remedy: "Check that the branch has commits, then retry.",
    whoActs: "you",
    retryable: true,
  },
  repository_clone_timeout: {
    sentence: "Cloning the repository took too long.",
    remedy: "Retry, or scan a smaller repository.",
    whoActs: "you",
    retryable: true,
  },
  preflight_timeout: {
    sentence: "Reading the files took too long.",
    remedy: "Retry, or scan a subfolder.",
    whoActs: "you",
    retryable: true,
  },
  invalid_source: {
    sentence: "We couldn't read a repository at that location.",
    remedy: "Check the path or URL.",
    whoActs: "you",
    retryable: false,
  },
  source_changed: {
    sentence: "The files changed while we were reading them.",
    remedy: "Retry when nothing is writing to the folder.",
    whoActs: "you",
    retryable: true,
  },
  source_unreadable: {
    sentence: "A file could not be read.",
    remedy: "Check file permissions, then retry.",
    whoActs: "you",
    retryable: true,
  },
  git_unavailable: {
    sentence: "Git isn't available on the worker that received this run.",
    whoActs: "operator",
    retryable: false,
  },
  unsupported_source_ref: {
    sentence: "This worker only accepts a public https URL or an uploaded archive.",
    remedy: "Submit the source again as a URL or archive.",
    whoActs: "you",
    retryable: false,
  },

  // Whole-run outcomes.
  incomplete_checks: {
    sentence: "One or more checks didn't finish.",
    remedy: "Resume the run.",
    whoActs: "you",
    retryable: true,
  },
  no_checks_completed: {
    sentence: "No check finished, so there's nothing to report.",
    remedy: "Resume the run.",
    whoActs: "you",
    retryable: true,
  },
  policy_unavailable: {
    sentence: "The policy engine couldn't decide.",
    remedy: "Resume the run.",
    whoActs: "you",
    retryable: true,
  },
  reused_result_missing: {
    sentence: "The stored result for identical content went missing.",
    remedy: "Resume the run to produce a fresh result.",
    whoActs: "you",
    retryable: true,
  },
  finalize_failed: {
    sentence: "The run finished but its final step failed, so no result was recorded.",
    remedy: "Resume the run.",
    whoActs: "you",
    retryable: true,
  },
  workflow_start_failed: {
    sentence: "The workflow could not be started.",
    remedy: "Resume the run.",
    whoActs: "you",
    retryable: true,
  },
  execution_failed: {
    sentence: "The workflow execution failed before it reported an outcome.",
    remedy: "Resume the run.",
    whoActs: "you",
    retryable: true,
  },
  execution_timed_out: {
    sentence: "The workflow ran out of time before it reported an outcome.",
    remedy: "Resume the run.",
    whoActs: "you",
    retryable: true,
  },
  execution_aborted: {
    sentence: "The workflow was stopped before it reported an outcome.",
    remedy: "Resume the run.",
    whoActs: "you",
    retryable: true,
  },
  finding_cap_exceeded: {
    sentence: "There were more than 500 findings, so we summarized instead of deciding each one.",
    remedy: "Scan a subfolder to bring the finding count down.",
    whoActs: "you",
    retryable: false,
  },

  // Per-check failures.
  timeout: {
    sentence: "The check ran out of time.",
    remedy: "Resume the run. This is often temporary.",
    whoActs: "you",
    retryable: true,
  },
  tool_unavailable: {
    sentence: "That scanner isn't installed on the worker.",
    remedy: "An operator has to install it.",
    whoActs: "operator",
    retryable: false,
  },
  tool_failed: {
    sentence: "The scanner started but exited with an error.",
    whoActs: "us",
    retryable: false,
  },
  unexpected_error: {
    sentence: "The check hit input it couldn't handle. It's logged for review.",
    remedy: "Nothing for you to do; the item is in the review queue.",
    whoActs: "us",
    retryable: false,
  },
  malformed_output: {
    sentence: "The scanner's output could not be read.",
    whoActs: "us",
    retryable: false,
  },
  missing_report: {
    sentence: "The scanner wrote no report.",
    whoActs: "us",
    retryable: false,
  },
  unmapped_rule: {
    sentence: "The scanner reported a rule we don't have a mapping for.",
    whoActs: "us",
    retryable: false,
  },
  unrecognized_output: {
    sentence: "The scanner's report was in a shape we don't recognize.",
    whoActs: "us",
    retryable: false,
  },
  crashed: {
    sentence: "The scanner crashed on this repository.",
    whoActs: "us",
    retryable: false,
  },
  injected_defect: {
    sentence: "This run was started with a deliberate fault for testing.",
    remedy: "Start a normal run to get a real result.",
    whoActs: "you",
    retryable: true,
  },
  injected_transient: {
    sentence: "This run was started with a deliberate temporary fault for testing.",
    remedy: "Resume the run.",
    whoActs: "you",
    retryable: true,
  },
  injected_transient_after_write: {
    sentence: "This run was started with a deliberate fault after the work was stored.",
    remedy: "Resume the run; the stored work is reused.",
    whoActs: "you",
    retryable: true,
  },
  checkpoint_missing: {
    sentence: "An internal result went missing.",
    remedy: "Resume the run; only this check runs again.",
    whoActs: "you",
    retryable: true,
  },
  missing_result: {
    sentence: "A check finished but produced no stored result.",
    remedy: "Resume the run; only this check runs again.",
    whoActs: "you",
    retryable: true,
  },
  transient_failure: {
    sentence: "A temporary fault in our storage or provider stopped this step.",
    remedy: "Resume the run.",
    whoActs: "you",
    retryable: true,
  },
  storage_unavailable: {
    sentence: "Our storage was unavailable while this step ran.",
    remedy: "Resume the run.",
    whoActs: "you",
    retryable: true,
  },
  configuration_error: {
    sentence: "This worker's configuration prevented the step.",
    whoActs: "operator",
    retryable: false,
  },

  // Policy engine states.
  missing_or_invalid_scan_context: {
    sentence: "The scan context was missing, stale, or incomplete, so nothing is authorized.",
    remedy: "Resume the run so a complete scan can be decided.",
    whoActs: "you",
    retryable: true,
  },
  policy_store_unconfigured: {
    sentence: "The policy engine has no store configured.",
    whoActs: "operator",
    retryable: false,
  },
  policy_cache_unavailable: {
    sentence: "The policy cache could not be opened.",
    whoActs: "operator",
    retryable: false,
  },
  policy_cache_or_engine_error: {
    sentence: "The policy engine could not evaluate this scan.",
    remedy: "Resume the run.",
    whoActs: "you",
    retryable: true,
  },
  policy_store_or_engine_error: {
    sentence: "The policy store or engine failed while deciding this scan.",
    remedy: "Resume the run.",
    whoActs: "you",
    retryable: true,
  },
  cedar_evaluation_error: {
    sentence: "The policy rules could not be evaluated.",
    remedy: "Resume the run.",
    whoActs: "you",
    retryable: true,
  },

  // Request and identity problems.
  invalid_request: {
    sentence: "That scan request was not valid.",
    whoActs: "you",
    retryable: false,
  },
  invalid_scan_request: {
    sentence: "That scan request was not valid.",
    whoActs: "you",
    retryable: false,
  },
  invalid_principal: {
    sentence: "The account or user on that request was not valid.",
    whoActs: "you",
    retryable: false,
  },
  invalid_run_id: {
    sentence: "That run identifier is not in the form we issue.",
    whoActs: "you",
    retryable: false,
  },
  invalid_source_ref: {
    sentence: "The source on that request was not readable text.",
    whoActs: "you",
    retryable: false,
  },
  invalid_idempotency_key: {
    sentence: "The idempotency key was not between 8 and 128 printable characters.",
    whoActs: "you",
    retryable: false,
  },
  invalid_environments: {
    sentence: "One of the chosen environments is not one we support.",
    whoActs: "you",
    retryable: false,
  },
  invalid_audience: {
    sentence: "The explanation style on that request is not one we support.",
    whoActs: "you",
    retryable: false,
  },
  invalid_generation: {
    sentence: "That run has already been resumed the maximum number of times.",
    whoActs: "you",
    retryable: false,
  },
  run_not_found: {
    sentence: "We don't have a run with that ID.",
    whoActs: "you",
    retryable: false,
  },
  run_not_resumable: {
    sentence: "This run cannot be resumed; its work is already finished or was rejected.",
    whoActs: "you",
    retryable: false,
  },

  // Internal integrity checks.
  scan_record_mismatch: {
    sentence: "A stored scan record did not match this run.",
    whoActs: "us",
    retryable: false,
  },
  checkpoint_invalid: {
    sentence: "A stored detector result could not be read.",
    remedy: "Resume the run; only the affected check runs again.",
    whoActs: "you",
    retryable: true,
  },
  invalid_step_payload: {
    sentence: "A pipeline step received a payload it could not use.",
    whoActs: "us",
    retryable: false,
  },
  unknown_detector: {
    sentence: "The workflow referenced a check that this build does not have.",
    whoActs: "operator",
    retryable: false,
  },

  // Model provider problems, surfaced without provider text.
  provider_unavailable: {
    sentence: "The model provider could not be reached, so vetted templates were used instead.",
    remedy: "Nothing to do; explanations still render.",
    whoActs: "you",
    retryable: true,
  },
  provider_auth: {
    sentence: "The model provider rejected our credentials, so vetted templates were used instead.",
    whoActs: "operator",
    retryable: false,
  },
  provider_quota: {
    sentence: "The model provider's quota is exhausted, so vetted templates were used instead.",
    whoActs: "operator",
    retryable: true,
  },
  provider_timeout: {
    sentence: "The model provider did not answer in time, so vetted templates were used instead.",
    remedy: "Nothing to do; explanations still render.",
    whoActs: "you",
    retryable: true,
  },
  provider_error: {
    sentence: "The model provider returned an error, so vetted templates were used instead.",
    remedy: "Nothing to do; explanations still render.",
    whoActs: "you",
    retryable: true,
  },
  invalid_reasoning_input: {
    sentence: "The explanation step was given a document it could not use.",
    whoActs: "us",
    retryable: false,
  },
  provider_disabled: {
    sentence: "No model provider is configured, so every explanation comes from a vetted template.",
    remedy: "Set a provider in settings to have a model write the prose.",
    whoActs: "you",
    retryable: false,
  },
};

export type ReasonView = ReasonCopy & { code: string; known: boolean };

const UNKNOWN: ReasonCopy = {
  sentence: "We don't have a description for this yet.",
  whoActs: "us",
  retryable: false,
};

export function reasonCopy(code: string | null | undefined): ReasonView {
  if (!code) {
    return { code: "unknown", known: false, sentence: UNKNOWN.sentence, whoActs: "us", retryable: false };
  }
  const entry = REASON_CODES[code];
  if (!entry) return { code, known: false, ...UNKNOWN };
  return { code, known: true, ...entry };
}

/** Dispositions on a review item (§7.10). */
export const DISPOSITION: Record<
  string,
  { heading: string; whoActs: WhoActs; explanation: string }
> = {
  retry_exhausted: {
    heading: "Failed after automatic retries",
    whoActs: "you",
    explanation: "We retried automatically and the check still did not finish.",
  },
  human_review: {
    heading: "Needs a person to look at it",
    whoActs: "us",
    explanation: "The check hit input it could not handle, so it waits for a person here.",
  },
  operator_action: {
    heading: "Configuration problem",
    whoActs: "operator",
    explanation: "A scanner is missing or misconfigured on the worker, so an operator has to act.",
  },
};

export const DISPOSITION_FALLBACK = {
  heading: "Waiting for review",
  whoActs: "us" as WhoActs,
  explanation: "This item did not report how it should be handled.",
};

export function dispositionCopy(disposition: string | null | undefined) {
  if (!disposition) return DISPOSITION_FALLBACK;
  return DISPOSITION[disposition] ?? DISPOSITION_FALLBACK;
}
