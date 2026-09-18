/**
 * §10.4: no count without coverage.
 *
 * `coverage` is a required prop, so a caller cannot render a bare findings number even by
 * mistake. When coverage is incomplete the count is rendered with the amber state and a link to
 * the page that explains what did not run.
 */
import { Link } from "react-router-dom";

import { RUN_OVERVIEW } from "../copy";
import type { CoverageFacts } from "../api/view";
import { cn } from "../lib/cn";

export function FindingCount({
  count,
  coverage,
  runId,
  noun = "finding",
  className,
}: {
  count: number;
  coverage: CoverageFacts;
  runId: string;
  noun?: string;
  className?: string;
}) {
  const incomplete = !coverage.present || !coverage.complete;
  const state = !coverage.present
    ? "Coverage not reported"
    : coverage.complete
      ? "All checks completed"
      : `${coverage.completed} of ${coverage.planned} checks completed`;
  return (
    <p
      className={cn("flex flex-wrap items-center gap-2 text-sm", className)}
      data-testid="finding-count"
      data-coverage-state={incomplete ? "incomplete" : "complete"}
    >
      <span className="font-medium text-ink">
        {count} {noun}
        {count === 1 ? "" : "s"}
      </span>
      <span aria-hidden>·</span>
      <span className={incomplete ? "text-warn" : "text-muted"}>{state}</span>
      {incomplete ? (
        <Link className="text-sm" to={`/runs/${runId}/coverage`}>
          {RUN_OVERVIEW.whatDidNotRun}
        </Link>
      ) : null}
    </p>
  );
}
