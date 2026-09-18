/**
 * §8.3. The notice text is rendered verbatim from `coverage.notice`; the interface does not
 * paraphrase it, because the backend already wrote it for a person and already named the
 * missing categories.
 *
 * While `complete` is false, or the run failed, this banner has no dismiss control at all — the
 * absence of a control is the guarantee, and a test asserts it.
 */
import { CircleAlert, CircleCheck, CircleSlash } from "lucide-react";
import { Link } from "react-router-dom";

import { RUN_OVERVIEW } from "../copy";
import type { CoverageFacts } from "../api/view";
import { cn } from "../lib/cn";

export type CoverageBannerProps = {
  facts: CoverageFacts;
  status: string;
  runId: string;
  onResume?: () => void;
  resuming?: boolean;
  resumeError?: string | null;
};

export function CoverageBanner({
  facts,
  status,
  runId,
  onResume,
  resuming = false,
  resumeError = null,
}: CoverageBannerProps) {
  const failed = status === "failed";
  const complete = facts.present && facts.complete;
  if (complete && !failed) {
    return (
      <p
        data-testid="coverage-banner"
        data-coverage-complete="true"
        className="flex items-center gap-2 border-y border-line px-3 py-1.5 text-sm text-muted"
      >
        <CircleCheck aria-hidden size={14} />
        {facts.notice ?? "All applicable checks completed."}
      </p>
    );
  }

  const tone = failed
    ? "border-error bg-error-fill text-error"
    : "border-warn bg-warn-fill text-warn";
  const Icon = failed ? CircleSlash : CircleAlert;
  const canResume = facts.resumable && Boolean(onResume);

  return (
    <section
      data-testid="coverage-banner"
      data-coverage-complete="false"
      role="status"
      aria-live="polite"
      className={cn("rounded border p-3 text-sm", tone)}
    >
      <p className="prose-column flex gap-2">
        <Icon aria-hidden size={16} className="mt-1 shrink-0" />
        <span>{facts.notice ?? "Coverage was not reported for this run."}</span>
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3 pl-6 text-sm">
        <Link className="underline" to={`/runs/${runId}/coverage`}>
          {RUN_OVERVIEW.whatDidNotRun}
        </Link>
        {canResume ? (
          <button
            type="button"
            onClick={onResume}
            disabled={resuming}
            className="rounded border border-current px-2 py-1 font-medium disabled:opacity-60"
          >
            {resuming ? "Resuming…" : RUN_OVERVIEW.resumeRun}
          </button>
        ) : null}
      </div>
      {canResume ? <p className="mt-2 pl-6 text-xs">{RUN_OVERVIEW.resumePromise}</p> : null}
      {resumeError ? (
        <p className="mt-2 pl-6 text-xs" role="alert">
          {resumeError}
        </p>
      ) : null}
    </section>
  );
}
