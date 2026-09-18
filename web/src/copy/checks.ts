/**
 * The five checks. Names come from the detector registry in `agent/detectors.py`, and the
 * "looks for" sentence is the human reading of each detector's categories.
 */

export type CheckCopy = {
  name: string;
  invokes: string;
  looksFor: string;
  categories: readonly string[];
};

export const CHECKS: readonly CheckCopy[] = [
  {
    name: "gitleaks",
    invokes: "Gitleaks",
    looksFor: "Credentials and API keys written into files, such as an AWS key in a config file.",
    categories: ["secret"],
  },
  {
    name: "semgrep",
    invokes: "Semgrep",
    looksFor:
      "Python code that runs a shell command built from values a request could control. Only Python files are read.",
    categories: ["unsafe_command_execution"],
  },
  {
    name: "checkov",
    invokes: "Checkov",
    looksFor:
      "Infrastructure templates that grant an IAM role every action or every resource instead of naming what the code uses.",
    categories: ["iam_wildcard"],
  },
  {
    name: "missing-environment",
    invokes: "Our own check for environment variables",
    looksFor:
      "Configuration your code reads at startup but that no template or `.env.example` declares, so a fresh deploy fails.",
    categories: ["missing_environment_variable"],
  },
  {
    name: "route-safety",
    invokes: "Our own check for route handlers",
    looksFor:
      "Python route handlers that answer requests without a recognized sign-in check, and handlers that use request data without validating it.",
    categories: ["missing_auth", "missing_input_validation"],
  },
];

const BY_NAME = new Map(CHECKS.map((check) => [check.name, check]));

export function checkCopy(name: string): CheckCopy {
  return (
    BY_NAME.get(name) ?? {
      name,
      invokes: name,
      looksFor: "We don't have a description for this check yet.",
      categories: [],
    }
  );
}
