import { describe, expect, it } from "vitest";

import { RECORDED_RUNS } from "../api/fixtures";
import { pipelineResult, runView } from "../api/schemas";
import {
  coverageFacts,
  countWithCoverage,
  decisionCounts,
  groupViews,
  locationLabel,
  synthesisView,
  traceSteps,
} from "../api/view";

function load(slug: string) {
  const run = RECORDED_RUNS.find((candidate) => candidate.slug === slug);
  if (!run) throw new Error(`missing fixture ${slug}`);
  return { view: runView.parse(run.view), result: pipelineResult.parse(run.result) };
}

describe("groupViews", () => {
  it("joins each container's findings and policy decision", () => {
    const { result } = load("complete");
    const groups = groupViews(result);
    expect(groups.map((group) => group.groupId)).toEqual(["G1", "G2", "G3", "G4"]);
    for (const group of groups) {
      expect(group.findings.length).toBeGreaterThan(0);
      expect(group.outcome).toBe("needs_human_approval");
      expect(group.decision?.finding_id).toBe(group.primaryFinding?.finding_id);
      expect(group.fixSteps.length).toBeGreaterThan(0);
      expect(group.verify.length).toBeGreaterThan(0);
      expect(group.locations.length).toBeGreaterThan(0);
    }
  });

  it("keeps the evidence class the policy decided and no confidence number", () => {
    const { result } = load("complete");
    const groups = groupViews(result);
    const byId = new Map(groups.map((group) => [group.groupId, group]));
    expect(byId.get("G1")?.evidenceClass).toBe("detector_or_heuristic");
    expect(byId.get("G4")?.evidenceClass).toBe("deterministic_fact");
  });

  it("does not claim a downgrade when detector and policy severity agree", () => {
    const { result } = load("complete");
    expect(groupViews(result).every((group) => group.downgraded === false)).toBe(true);
  });

  it("translates every policy rule ID into a sentence", () => {
    const { result } = load("complete");
    for (const group of groupViews(result)) {
      for (const reason of group.policyReasons) {
        expect(reason.text.length).toBeGreaterThan(10);
      }
    }
  });

  it("counts outcomes for the gate summary", () => {
    const { result } = load("complete");
    expect(decisionCounts(groupViews(result))).toEqual({
      deny: 0,
      needs_human_approval: 4,
      permit: 0,
      total: 4,
    });
  });

  it("renders a location as path:line without losing the path", () => {
    expect(locationLabel({ path: "src/app.py", start_line: 9, end_line: 9 })).toBe("src/app.py:9");
    expect(locationLabel({ path: "src/app.py", start_line: null, end_line: null })).toBe("src/app.py");
  });

  it("keeps the backend's priority order in the synthesis", () => {
    const { result } = load("complete");
    expect(synthesisView(result)?.priorities.map((priority) => priority.groupId)).toEqual([
      "G1",
      "G2",
      "G3",
      "G4",
    ]);
  });

  it("reports the combined risk the backend found, with its group IDs", () => {
    const { result } = load("complete");
    const risks = synthesisView(result)?.combinedRisks ?? [];
    expect(risks).toHaveLength(1);
    expect(risks[0]?.groupIds).toEqual(["G2", "G3", "G4"]);
    expect(risks[0]?.risk).toContain("src/app.py");
  });
});

describe("coverageFacts", () => {
  it("falls back to the run view when there is no result document", () => {
    const { view } = load("partial");
    const facts = coverageFacts(view, null);
    expect(facts.present).toBe(true);
    expect(facts.complete).toBe(false);
    expect(facts.incomplete.map((entry) => entry.check)).toEqual(["semgrep"]);
    expect(facts.notice).toContain("4 of 5 checks completed");
  });

  it("prefers the full result document when it is available", () => {
    const { view, result } = load("partial");
    const facts = coverageFacts(view, result);
    expect(facts.missingCategories).toEqual(["unsafe_command_execution"]);
    expect(facts.notApplicable).toEqual([]);
  });

  it("never reports a rejected run as complete, and never invents a coverage notice", () => {
    const { view, result } = load("failed");
    const facts = coverageFacts(view, result);
    expect(facts.complete).toBe(false);
    expect(facts.planned).toBe(0);
    expect(facts.notice).toBeNull();
    expect(result.coverage).toBeNull();
  });

  it("marks a count that must not be rendered without its coverage", () => {
    const partial = load("partial");
    expect(countWithCoverage(4, coverageFacts(partial.view, partial.result)).requiresBanner).toBe(true);
    const complete = load("complete");
    expect(countWithCoverage(4, coverageFacts(complete.view, complete.result)).requiresBanner).toBe(false);
  });
});

describe("traceSteps", () => {
  it("groups the recorded transitions per state and keeps retries", () => {
    const { result } = load("partial");
    const steps = traceSteps(result);
    const detect = steps.find((step) => step.state === "Detect");
    expect(detect?.events.map((event) => event.event)).toEqual(["entered", "succeeded"]);
    const retries = steps.flatMap((step) => step.events).filter((event) => event.event === "retry");
    expect(retries.length).toBeGreaterThan(0);
  });
});
