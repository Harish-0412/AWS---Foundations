import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { CONCEPTS, CONCEPT_ALIASES, POLICY_REASONS, resolveConcept } from "../copy/glossary";
import { DISPOSITION, REASON_CODES, WHO_ACTS_LABEL, dispositionCopy, reasonCopy } from "../copy/reasons";
import { RUN_STATUS, TERMINAL_RUN_STATUSES } from "../copy/vocabulary";

const knowledgePath = resolve(__dirname, "../../../agent/reasoning/knowledge.py");
const knowledge = readFileSync(knowledgePath, "utf8");

/** Keys of a top-level dict literal in the backend source, without evaluating Python. */
function backendKeys(name: string): string[] {
  const start = knowledge.indexOf(`${name} = {`);
  expect(start, `${name} not found in knowledge.py`).toBeGreaterThan(-1);
  const end = knowledge.indexOf("\n}", start);
  const block = knowledge.slice(start, end);
  return [...block.matchAll(/^ {4}"([^"]+)":/gm)].map((match) => match[1] as string);
}

describe("the glossary mirrors the backend, so a definition cannot disagree", () => {
  it("carries every policy reason the backend knows", () => {
    const backend = backendKeys("REASONS").sort();
    expect(Object.keys(POLICY_REASONS).sort()).toEqual(backend);
  });

  it("carries every concept the backend knows", () => {
    const backend = backendKeys("CONCEPTS").sort();
    expect(Object.keys(CONCEPTS).sort()).toEqual(backend);
  });

  it("carries every alias the backend resolves", () => {
    expect(Object.keys(CONCEPT_ALIASES).sort()).toEqual(backendKeys("CONCEPT_ALIASES").sort());
  });

  it("agrees with the backend on a spelling variant", () => {
    expect(resolveConcept("Least-Privilege")).toBe("least privilege");
    expect(resolveConcept("environment variables")).toBe("environment variable");
    expect(resolveConcept("not a real term")).toBeNull();
  });
});

describe("reason codes", () => {
  const fromSpecification = [
    "size_limit_exceeded",
    "file_count_exceeded",
    "depth_limit_exceeded",
    "links_not_supported",
    "archive_rejected",
    "repository_url_rejected",
    "repository_unavailable",
    "preflight_timeout",
    "incomplete_checks",
    "no_checks_completed",
    "policy_unavailable",
    "timeout",
    "tool_unavailable",
    "unexpected_error",
  ];

  it.each(fromSpecification)("%s has a sentence and a named owner", (code) => {
    const copy = REASON_CODES[code];
    expect(copy, code).toBeDefined();
    expect(copy?.sentence.length ?? 0).toBeGreaterThan(10);
    expect(WHO_ACTS_LABEL[copy!.whoActs]).toBeTruthy();
  });

  it("covers every code the pipeline can reject a run with", () => {
    const failures = readFileSync(resolve(__dirname, "../../../agent/orchestration/failures.py"), "utf8");
    const codes = [...failures.matchAll(/"(?:ScanRejected|TransientStepError|ToolUnavailable|DetectorDefect)\(\s*"([a-z_]+)"/g)]
      .map((match) => match[1] as string)
      .filter((code) => !["transient_failure"].includes(code));
    const missing = codes.filter((code) => !(code in REASON_CODES));
    expect(missing).toEqual([]);
  });

  it("renders an unknown code as itself plus a plain sentence, never blank", () => {
    const view = reasonCopy("we_made_this_up");
    expect(view.known).toBe(false);
    expect(view.code).toBe("we_made_this_up");
    expect(view.sentence).toBe("We don't have a description for this yet.");
  });

  it("handles a missing code without throwing", () => {
    expect(reasonCopy(null).known).toBe(false);
    expect(reasonCopy(undefined).sentence).toBeTruthy();
  });
});

describe("dispositions and run statuses", () => {
  it("labels all three dispositions with who acts", () => {
    expect(Object.keys(DISPOSITION).sort()).toEqual(["human_review", "operator_action", "retry_exhausted"]);
    expect(dispositionCopy("retry_exhausted").whoActs).toBe("you");
    expect(dispositionCopy("operator_action").whoActs).toBe("operator");
    expect(dispositionCopy("what").heading).toBe("Waiting for review");
  });

  it("never calls a completed run secure or clean", () => {
    const sentences = Object.values(RUN_STATUS)
      .map((entry) => `${entry.label} ${entry.sentence}`)
      .join(" ")
      .toLowerCase();
    for (const word of ["secure", "safe", "clean", "no issues", "score", "%"]) {
      expect(sentences).not.toContain(word);
    }
  });

  it("stops polling on exactly the three terminal statuses", () => {
    expect([...TERMINAL_RUN_STATUSES].sort()).toEqual(["completed", "failed", "partial"]);
  });
});
