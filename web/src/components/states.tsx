/**
 * §8.7 / §12. Every list takes explicit loading, empty and error renderers; no component is
 * allowed to render an empty array as blank space, and no failure is ever described as
 * "Something went wrong".
 */
import { CircleAlert, LoaderCircle, MoveRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { STATES } from "../copy";
import { ApiError } from "../api/client";
import { cn } from "../lib/cn";

export function LoadingBlock({ label = STATES.loadingList }: { label?: string }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 border border-line bg-surface-raised p-4 text-sm text-muted"
    >
      <LoaderCircle aria-hidden size={14} className="animate-spin" />
      {label}
    </p>
  );
}

export function EmptyBlock({
  title,
  children,
  calm = false,
}: {
  title: string;
  children?: ReactNode;
  calm?: boolean;
}) {
  return (
    <div
      className={cn(
        "border border-line bg-surface-raised p-4 text-sm",
        calm ? "text-muted" : "text-ink",
      )}
    >
      <p className="font-medium">{title}</p>
      {children ? <div className="mt-1 text-muted">{children}</div> : null}
    </div>
  );
}

export function ErrorBlock({
  error,
  onRetry,
  retryLabel = STATES.retry,
}: {
  error: unknown;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const described = describeError(error);
  return (
    <div role="alert" className="border border-error bg-error-fill p-4 text-sm text-error">
      <p className="flex items-center gap-2 font-medium">
        <CircleAlert aria-hidden size={16} />
        {described.heading}
      </p>
      <p className="mt-1">{described.body}</p>
      {described.list ? (
        <ul className="mt-2 list-inside list-disc font-mono text-[11px]">
          {described.list.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded border border-current px-2 py-1 font-medium"
          >
            {retryLabel}
          </button>
        ) : null}
        {described.action ? (
          <Link className="inline-flex items-center gap-1 underline" to={described.action.to}>
            {described.action.label}
            <MoveRight aria-hidden size={12} />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export type ErrorDescription = {
  heading: string;
  body: string;
  list?: string[];
  action?: { to: string; label: string };
};

/** Named failure states (§12), each with the cause in words and a way forward. */
export function describeError(error: unknown): ErrorDescription {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case "not_found":
        return {
          heading: STATES.notFoundHeading,
          body: STATES.notFoundBody,
          action: { to: "/scan/new", label: "Start a scan" },
        };
      case "forbidden":
        return { heading: STATES.forbiddenHeading, body: STATES.forbiddenBody };
      case "offline":
        return { heading: "We couldn't reach the API", body: STATES.offline };
      case "version_mismatch":
        return {
          heading: STATES.versionMismatchHeading,
          body: STATES.versionMismatchBody(error.code ?? "an unknown version", "pipeline-result-1"),
        };
      case "invalid_response":
        return {
          heading: "The API answered with a document we don't understand",
          body: "Nothing was changed. The detail below is the schema error, not your data.",
          list: error.findings,
        };
      case "server":
        return { heading: STATES.serverErrorHeading, body: STATES.serverErrorBody };
      case "not_resumable":
        return {
          heading: "This run cannot be resumed",
          body:
            "Its work is already finished, or it was rejected before any check started. Start a new scan instead.",
          action: { to: "/scan/new", label: "Start a scan" },
        };
      case "invalid_request":
        return { heading: "That request was refused", body: error.message };
      default:
        return { heading: STATES.failedToLoad, body: error.message };
    }
  }
  return {
    heading: STATES.failedToLoad,
    body:
      error instanceof Error && error.message
        ? error.message
        : "We don't have a reason code for this. The run itself is unaffected.",
  };
}
