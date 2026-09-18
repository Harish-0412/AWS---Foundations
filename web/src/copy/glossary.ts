/**
 * Mirror of the backend's vetted glossaries (`agent/reasoning/knowledge.py`).
 *
 * The frontend and the answer engine must never disagree about what a rule or a term means, so
 * these tables carry the same identifier keys as the backend and are cross-checked by a test.
 */

export type Concept = {
  term: string;
  definition: string;
  categories: readonly string[];
};

/** `REASONS`: the plain sentence for each Cedar rule ID. */
export const POLICY_REASONS: Record<string, string> = {
  "missing-or-invalid-context":
    "The scan context was missing, stale, from another tenant, or the scan was incomplete.",
  "secret-requires-review": "Secrets always need a person to confirm rotation and removal.",
  "iam-requires-review": "Any change to IAM permissions needs human review.",
  "auth-requires-review": "Authorization findings always need human review.",
  "high-risk-requires-review": "High and critical severity findings need human review.",
  "eligible-static-processing":
    "A deterministic fact in a low-risk category may be processed automatically.",
  "production-or-conflicting-environment":
    "Production, or conflicting environment tags, always requires review.",
  "compound-risk": "Several findings affect the same file or resource.",
  "batch-summary-required": "There are too many findings to process one by one.",
  "known-example-in-documentation":
    "The secret matched a published example value in documentation or tests.",
  "review-supported-finding": "The finding is eligible for human review.",
  "command-execution-requires-review": "Command execution findings always need human review.",
};

export const POLICY_REASON_FALLBACK =
  "A versioned policy rule applied; we don't have a plain sentence for it yet.";

export function policyReasonText(ruleId: string): string {
  return POLICY_REASONS[ruleId] ?? POLICY_REASON_FALLBACK;
}

/** `CONCEPTS`: the Learn glossary, answered with no model call. */
export const CONCEPTS: Record<string, Omit<Concept, "term">> = {
  "least privilege": {
    definition:
      "Least privilege means giving code or people only the permissions they need, on the specific resources they use, and nothing more. If that code is ever misused, the damage is limited to what it was allowed to do.",
    categories: ["iam_wildcard"],
  },
  iam: {
    definition:
      "IAM (Identity and Access Management) is how AWS decides who or what may perform which actions on which resources. Policies attached to roles grant those permissions.",
    categories: ["iam_wildcard"],
  },
  wildcard: {
    definition:
      "A wildcard in an IAM policy grants every action or resource that matches it, which is usually far more access than an application needs.",
    categories: ["iam_wildcard"],
  },
  cedar: {
    definition:
      "Cedar is the policy language First Commit uses to decide how each finding is handled: processed automatically, sent to a person for review, or denied. Its decisions come from versioned rules, not from a model.",
    categories: [],
  },
  authentication: {
    definition:
      "Authentication checks who is calling, for example by requiring a signed-in session or a valid token.",
    categories: ["missing_auth"],
  },
  authorization: {
    definition:
      "Authorization checks whether the caller may perform this action on this specific data. A route can require sign-in and still let one user reach another user's records.",
    categories: ["missing_auth"],
  },
  "input validation": {
    definition:
      "Input validation checks request data against explicit rules, such as required fields, types, lengths and allowed values, and rejects anything else before the code uses it.",
    categories: ["missing_input_validation"],
  },
  "command injection": {
    definition:
      "Command injection happens when untrusted input becomes part of a shell command, letting an attacker run their own commands. Passing an argument list without a shell prevents it.",
    categories: ["unsafe_command_execution"],
  },
  "sql injection": {
    definition:
      "SQL injection happens when untrusted input becomes part of a database query. Parameterized queries keep input as data and prevent it.",
    categories: [],
  },
  "environment variable": {
    definition:
      "Environment variables pass configuration, such as service endpoints or references to secrets, to an application when it starts, instead of writing values into code.",
    categories: ["missing_environment_variable"],
  },
  "hardcoded secret": {
    definition:
      "A hardcoded secret is a credential written directly into code or configuration. Anyone who can read the repository or its history can use it, so it must be rotated and moved to a secret store.",
    categories: ["secret"],
  },
  "prompt injection": {
    definition:
      "Prompt injection is text that tries to give an AI model new instructions. First Commit treats repository text and questions as data, so such text cannot change its rules or its policy decisions.",
    categories: [],
  },
  gitleaks: {
    definition: "Gitleaks is an open-source scanner that finds credentials in code.",
    categories: ["secret"],
  },
  semgrep: {
    definition:
      "Semgrep is an open-source static analysis tool that matches risky code patterns, such as running commands through a shell.",
    categories: ["unsafe_command_execution"],
  },
  checkov: {
    definition:
      "Checkov is an open-source scanner for infrastructure templates; here it flags IAM policies that grant unconstrained access.",
    categories: ["iam_wildcard"],
  },
};

/** `CONCEPT_ALIASES`: spellings that resolve to a glossary entry. */
export const CONCEPT_ALIASES: Record<string, string> = {
  "least-privilege": "least privilege",
  authorisation: "authorization",
  "shell injection": "command injection",
  "secret scanning": "hardcoded secret",
  wildcards: "wildcard",
  "environment variables": "environment variable",
  "hardcoded secrets": "hardcoded secret",
  "a hardcoded secret": "hardcoded secret",
};

export const CONCEPT_TERMS: readonly string[] = Object.keys(CONCEPTS).sort();

/** Resolve a free-text term to a glossary key, mirroring `concept_entry`. */
export function resolveConcept(term: string | null | undefined): string | null {
  if (!term) return null;
  const key = term.toLowerCase().trim().split(/\s+/).join(" ");
  const resolved = CONCEPT_ALIASES[key] ?? key;
  return resolved in CONCEPTS ? resolved : null;
}

/** Terms that appear in a finding of this category, for inline "what is this?" links. */
export function conceptsForCategory(category: string): string[] {
  return CONCEPT_TERMS.filter((term) => CONCEPTS[term]?.categories.includes(category));
}
