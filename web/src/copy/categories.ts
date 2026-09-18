/**
 * Finding categories, their labels (from `PLAYBOOKS` in `agent/reasoning/knowledge.py`), and the
 * difficulty cue of §7.6. The frontend never invents security advice; this table only classifies
 * what the backend already decided.
 */

export type CategoryCopy = {
  label: string;
  /** "self" means a person can reasonably finish this alone; "care" means get a second pair of eyes. */
  difficulty: "self" | "care";
  cue: string;
};

export const CATEGORIES: Record<string, CategoryCopy> = {
  secret: {
    label: "Hardcoded secret",
    difficulty: "care",
    cue: "Do the first step now, then get a second pair of eyes.",
  },
  iam_wildcard: {
    label: "Over-permissive IAM policy",
    difficulty: "care",
    cue: "Do the first step now, then get a second pair of eyes.",
  },
  missing_auth: {
    label: "Route without an authorization check",
    difficulty: "self",
    cue: "You can do this yourself in a few minutes.",
  },
  missing_input_validation: {
    label: "Request input used without validation",
    difficulty: "self",
    cue: "You can do this yourself in a few minutes.",
  },
  missing_environment_variable: {
    label: "Undeclared required environment variable",
    difficulty: "self",
    cue: "You can do this yourself in a few minutes.",
  },
  unsafe_command_execution: {
    label: "Unsafe command execution",
    difficulty: "self",
    cue: "You can do this yourself in a few minutes.",
  },
};

export const CATEGORY_FALLBACK: CategoryCopy = {
  label: "Finding",
  difficulty: "care",
  cue: "Read the steps, then decide whether you want a second pair of eyes.",
};

export function categoryCopy(category: string | null | undefined): CategoryCopy {
  if (!category) return CATEGORY_FALLBACK;
  return CATEGORIES[category] ?? { ...CATEGORY_FALLBACK, label: category.replaceAll("_", " ") };
}

/** Categories the checks can report, used by the coverage page for absent categories. */
export const ALL_CATEGORIES = Object.keys(CATEGORIES);
