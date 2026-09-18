/**
 * Recorded runs, checked into the repository as real pipeline output.
 *
 * They come from `first-commit run` / `resume` against the repository's own fixtures:
 *  - complete  : `fixtures/golden-repo`, development, all five checks succeeded;
 *  - partial   : the same repository with `--fault semgrep=timeout`, so one check is
 *                dead-lettered and the notice names the missing category;
 *  - resumed   : `first-commit resume` on the partial run (generation 1, complete again);
 *  - failed    : a source over the per-file size limit, rejected before any check ran.
 *
 * Mocks drift; these do not, which is what lets the interface be honest about real shapes.
 */
import completeResult from "../data/fixtures/run-complete.json";
import failedResult from "../data/fixtures/run-failed.json";
import partialReviews from "../data/fixtures/view-partial-reviews.json";
import partialResult from "../data/fixtures/run-partial.json";
import partialView from "../data/fixtures/view-partial.json";
import resumedReviews from "../data/fixtures/view-resumed-reviews.json";
import resumedResult from "../data/fixtures/run-resumed.json";
import resumedView from "../data/fixtures/view-resumed.json";
import completeView from "../data/fixtures/view-complete.json";
import failedView from "../data/fixtures/view-failed.json";
import noneApplicableResult from "../data/fixtures/run-none-applicable.json";
import noneApplicableView from "../data/fixtures/view-none-applicable.json";

export type RecordedRun = {
  slug: string;
  title: string;
  note: string;
  view: unknown;
  result: unknown;
  reviews: unknown[];
};

export const RECORDED_RUNS: RecordedRun[] = [
  {
    slug: "complete",
    title: "All checks completed",
    note: "Golden fixture repository, development environment, template explanations only.",
    view: completeView,
    result: completeResult,
    reviews: [],
  },
  {
    slug: "partial",
    title: "One check did not finish",
    note: "Same repository with a deliberately failing scanner, so the coverage banner has work to do.",
    view: partialView,
    result: partialResult,
    reviews: partialReviews as unknown[],
  },
  {
    slug: "resumed",
    title: "Resumed until complete",
    note: "The partial run after `resume`: only the incomplete check ran again, and its review item closed.",
    view: resumedView,
    result: resumedResult,
    reviews: resumedReviews as unknown[],
  },
  {
    slug: "none-applicable",
    title: "One check did not apply, and nothing was found",
    note: "The hostile-input fixture: no Python or templates, so the template check did not apply and every other check ran.",
    view: noneApplicableView,
    result: noneApplicableResult,
    reviews: [],
  },
  {
    slug: "failed",
    title: "Rejected before any check ran",
    note: "A source over the per-file size limit, so the run reports why instead of guessing.",
    view: failedView,
    result: failedResult,
    reviews: [],
  },
];

/** The run id each recorded run reports, so a deep link resolves to the right document. */
export function recordedRunIds(): Record<string, string> {
  const ids: Record<string, string> = {};
  for (const run of RECORDED_RUNS) {
    const view = run.view as { run_id?: string };
    if (typeof view.run_id === "string") ids[run.slug] = view.run_id;
  }
  return ids;
}

/**
 * A recorded run is served under a stable alias (`recorded:partial`) as well as its real id, so
 * a link stays readable in a demo while the id in the document stays the one the pipeline wrote.
 */
export const RECORDED_ALIASES: Record<string, string> = Object.fromEntries(
  RECORDED_RUNS.map((run) => [`recorded:${run.slug}`, run.slug]),
);
