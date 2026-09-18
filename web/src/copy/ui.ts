/**
 * Every user-visible string that is not derived from backend data.
 *
 * Two rules live here rather than in components (§9.1, §10):
 *  - no verdict words ("secure", "safe", "clean", "no issues");
 *  - no invented number (no score, no percentage, no risk index).
 */

export const PRODUCT = {
  name: "First Commit",
  tagline: "Point it at a repository and get back what is wrong, why, and what to do next.",
  neverRuns: "It never runs your code, and it never changes it.",
};

/** §3.5 / §10.10: the standing contract, on the run page and beside every fix action. */
export const SAFETY_CONTRACT =
  "This tool never runs, edits, commits, merges or deploys your code.";

export const FIX_PANEL_CONTRACT =
  "These steps are for you to carry out. There is no Apply button, because this product does not edit your code.";

export const PROPOSAL_CONTRACT = "This is a file for you to review. We do not write it into your repository.";

export const DEPLOY_GATE_CONTRACT =
  "This does not authorize a deploy; it says the findings are eligible for processing.";

export const COVERAGE_COMPLETE_WORDING = "All applicable checks completed";

export const NO_FINDINGS_COMPLETE =
  "All applicable checks completed and found nothing in the categories we check. That is not a guarantee your application is secure — it means these checks found nothing.";

export const NO_FINDINGS_PARTIAL =
  "The checks that ran found nothing. At least one check did not finish, so issues may be missing.";

export const CHECKLIST_STORAGE_NOTE = "Your notes, stored in this browser.";

export const RECORDED_RUN_NOTE =
  "Showing a recorded run from a local scan, so every number below comes from real pipeline output.";

export const API_GAP_NOTE =
  "This endpoint is not served yet, so this page reads the recorded run instead.";

export const NAV = {
  run: "Run",
  findings: "Findings",
  coverage: "What didn't run",
  policy: "Decisions & rules",
  transparency: "What the AI did",
  review: "Review queue",
  learn: "Learn",
  newScan: "Start a scan",
} as const;

export const LIMITS = {
  files: 2_000,
  fileSize: "2 MB",
  total: "25 MB",
  depth: 30,
  perScannerSeconds: 60,
  summary: [
    "2,000 files",
    "2 MB per file",
    "25 MB in total",
    "30 folders deep",
    "60 seconds per scanner",
  ],
};

export const SCAN_FORM = {
  sourceLabel: "Where is the code?",
  sourceHelp:
    "Public https URLs only. We clone with hooks, submodules and credentials disabled. A local folder works when you run the product on your own machine.",
  urlTab: "Git URL",
  uploadTab: "Upload .zip",
  folderTab: "Local folder",
  folderHelp: "Local mode only: the path is read on this machine and never uploaded.",
  environmentsLabel: "Where does this code run?",
  environmentsHelp:
    "Production tags make every finding require human review, because the rules treat production as the highest consequence environment.",
  audienceLabel: "Explanation style",
  audienceHelp:
    "This is sent to the backend as `audience` and is part of the explanation cache key, so switching does not spend another model call.",
  refreshLabel: "Force a fresh run",
  refreshHelp:
    "Off: identical content returns the stored result and costs nothing.",
  limitsHeading: "What we can read",
  limitsHelp: "Shown before you submit, so a limit is an expectation rather than a surprise.",
  submit: "Start the scan",
  submitting: "Starting the scan…",
};

export const RUN_OVERVIEW = {
  startHere: "Start here",
  nextStepHeading: "Do this next",
  prioritiesHeading: "In the order the rules prioritised them",
  prioritiesNote:
    "This order comes from the policy engine and the explanation layer. The interface does not re-sort it.",
  combinedRisksHeading: "Fix these together",
  findingsHeading: "Findings",
  blockedGroup: "Blocked",
  reviewGroup: "Needs a person",
  permitGroup: "Eligible for automated processing",
  permitGroupNote: DEPLOY_GATE_CONTRACT,
  resumeRun: "Resume run",
  resumePromise:
    "Only the incomplete checks run again. Everything that already succeeded is reused, so this does not duplicate findings or re-spend on explanations.",
  whatDidNotRun: "What didn't run?",
  progressHeading: "What is happening now",
  progressNote: "Each check reports its own state. This is a list of steps, not a spinner.",
};

export const FINDING_DETAIL = {
  whatWeFound: "What we found",
  whyItMatters: "Why it matters",
  unsureHeading: "What we are unsure of",
  unsureNote:
    "This is the part the checks cannot settle. It is shown instead of a confidence number, because the system has no such number to give.",
  fixHeading: "Fix it yourself",
  verifyHeading: "Check it worked",
  verifyHelp: "Run this in your project folder.",
  evidenceHeading: "Evidence",
  decisionHeading: "Why this decision",
  askHeading: "Ask about this",
  locationsHeading: "Where",
  copyPath: "Copy path",
  downgradedSuffix:
    "downgraded because it matched a published example value in documentation or tests",
  secretFirstStep: "Do this first — deleting the line does not remove it from Git history",
  rescannedFixed: (runId: string) => `Fixed — this finding is not present in run ${runId}.`,
  rescannedPresent: (runId: string) => `Still present in run ${runId}.`,
  rescannedNote: "Compared by the finding's content-derived ID, so this comparison is exact.",
};

export const COVERAGE = {
  heading: "Coverage & reliability",
  checksHeading: "The checks that were planned",
  whatThisMeansHeading: "What this means for you",
  missingHeading: "What may be missing",
  missingIntro: (check: string) => `Because ${check} didn't run, these categories may be missing:`,
  timelineHeading: "Run timeline",
  timelineNote:
    "Every state the workflow entered, retried or caught, exactly as the state machine recorded it.",
  nothingWaiting: "Nothing is waiting for review.",
  nothingWaitingNote: "Every check that was planned either ran or did not apply to your files.",
};

export const POLICY_PAGE = {
  heading: "Decisions & rules",
  summaryHeading: "Outcomes in this run",
  tableHeading: "Finding by finding",
  versionLabel: "Policy version",
  versionNote:
    "These rules are versioned files in the repository. A model can explain them and can escalate a decision, but it can never lower one.",
  capped:
    "More than 500 findings — we summarized instead of deciding one by one, so nothing below is individually authorized.",
  denied: "The scan context was incomplete or stale, so no finding was authorized.",
  error: "The policy engine failed on this run, so nothing is authorized.",
} as const;

export const TRANSPARENCY = {
  heading: "What the AI did, and what it cost",
  costNote: "List price estimate, not a bill.",
  callsMade: "Model calls made",
  callsAvoided: "Model calls avoided",
  avoidedNote: "Cache hits plus units a vetted template already fully explains.",
  detectorsHeading: "Checks run and reused",
  versionsHeading: "Versions",
  versionsNote:
    "These keys decide whether cached work is reused, which is why re-scanning identical content can be free.",
  byTierHeading: "Calls by model tier",
  noModel: "No model was used in this run.",
  providerNone: "none — vetted templates only",
  unitStatusHeading: "How each unit was written",
  evidenceHeading: "The product's own claim, from this run",
  evidenceLine: (findings: number, calls: number) =>
    `This run resolved ${findings} finding${findings === 1 ? "" : "s"} with ${calls} model call${
      calls === 1 ? "" : "s"
    }. A paste-the-error loop would have needed roughly 3–5 prompts per issue.`,
} as const;

export const REVIEW = {
  heading: "Review queue",
  note: "Failures are captured here with the reason and who can act, so nothing is swallowed.",
  stackTraceNote:
    "We do not show exception text: it can quote your scanned source. The reason code above is the whole record.",
} as const;

export const STATES = {
  loadingRun: "Loading the run…",
  loadingResult: "Loading the findings…",
  loadingList: "Loading…",
  emptyFindings: "No findings in this run.",
  failedToLoad: "We couldn't load this run.",
  failedToLoadNote: "Nothing was changed, and nothing was decided on your behalf.",
  retry: "Try again",
  offline: "You are offline. Reconnect to fetch the run again.",
  notFoundHeading: "We don't have a run with that ID",
  notFoundBody: "The link may be mistyped, or the run may belong to another account.",
  forbiddenHeading: "This run belongs to another account",
  forbiddenBody: "Sign in with the account that created the run.",
  serverErrorHeading: "Something on our side failed — the run is unaffected",
  serverErrorBody:
    "The result is stored and has not changed. Reload, or resume the run if a check did not finish.",
  versionMismatchHeading: "This run was produced by a different version",
  versionMismatchBody: (found: string, known: string) =>
    `The result says ${found}; this interface understands ${known}. Reload the interface, or read the run through the API directly.`,
  unknownReason: "we don't have a description for this yet",
} as const;

export const NOT_BUILT = {
  heading: "Not built yet",
  body: "This page needs an API endpoint that does not exist yet, so it is deliberately absent rather than filled with invented data.",
  apiGap: "Waiting on",
} as const;

/** Copy for the audience switch (§4). */
export const AUDIENCE = {
  beginner: "Beginner",
  developer: "Developer",
  label: "Reading level",
  note: "Beginner explains jargon on the page. Developer uses the terms directly and shows the run trace.",
} as const;
