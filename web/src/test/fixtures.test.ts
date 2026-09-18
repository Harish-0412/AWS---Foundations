import { describe, expect, it } from "vitest";

import { RECORDED_RUNS } from "../api/fixtures";
import { RESULT_SCHEMA, pipelineResult, reviewItem, runView } from "../api/schemas";

describe("recorded runs", () => {
  it("checks in the four run states the interface claims to render", () => {
    expect(RECORDED_RUNS.map((run) => run.slug).sort()).toEqual([
      "complete",
      "failed",
      "none-applicable",
      "partial",
      "resumed",
    ]);
  });

  it.each(RECORDED_RUNS.map((run) => [run.slug, run] as const))(
    "%s parses as pipeline-run-1 and pipeline-result-1",
    (_slug, run) => {
      const view = runView.safeParse(run.view);
      expect(view.success, JSON.stringify(view.error?.issues)).toBe(true);

      const result = pipelineResult.safeParse(run.result);
      expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
      expect(result.data?.schema_version).toBe(RESULT_SCHEMA);

      for (const item of run.reviews) {
        expect(reviewItem.safeParse(item).success).toBe(true);
      }
    },
  );

  it("the partial run reports an incomplete check and a review item for it", () => {
    const partial = RECORDED_RUNS.find((run) => run.slug === "partial");
    const result = pipelineResult.parse(partial?.result);
    expect(result.status).toBe("partial");
    expect(result.coverage?.complete).toBe(false);
    expect(result.coverage?.incomplete.map((entry) => entry.check)).toContain("semgrep");
    expect(result.coverage?.missing_categories).toContain("unsafe_command_execution");
    // The notice is written by the backend for a person; the interface renders it verbatim.
    expect(result.coverage?.notice).toContain("4 of 5 checks completed");
    expect(result.review_items.length).toBeGreaterThan(0);
  });

  it("the resumed run is complete at generation 1 and closed its review item", () => {
    const resumed = RECORDED_RUNS.find((run) => run.slug === "resumed");
    const result = pipelineResult.parse(resumed?.result);
    expect(result.status).toBe("completed");
    expect(result.generation).toBe(1);
    expect(result.coverage?.complete).toBe(true);
    expect(resumed?.reviews).toEqual([]);
  });

  it("the failed run reports a reason and no coverage at all", () => {
    const failed = RECORDED_RUNS.find((run) => run.slug === "failed");
    const result = pipelineResult.parse(failed?.result);
    expect(result.status).toBe("failed");
    expect(result.reason).toBe("file_size_exceeded");
    expect(result.coverage).toBeNull();
    expect(result.findings).toEqual([]);
  });

  it("the complete run resolves every finding into an explanation unit", () => {
    const complete = RECORDED_RUNS.find((run) => run.slug === "complete");
    const result = pipelineResult.parse(complete?.result);
    expect(result.coverage?.complete).toBe(true);
    const units = result.explanation?.report?.units ?? [];
    const grouped = new Set(units.flatMap((unit) => unit.finding_ids));
    for (const finding of result.findings) {
      expect(grouped.has(finding.finding_id), finding.finding_id).toBe(true);
    }
    expect(RESULT_SCHEMA).toBe("pipeline-result-1");
  });
});
