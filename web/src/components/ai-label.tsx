/**
 * §8.4 / §10.3: no generated sentence renders without this label.
 *
 * The label is derived from `unit.status` and `unit.cached`, both real fields. It never says
 * "AI-generated" as a warning and never hides that a model was or was not involved.
 */
import { Bot, FileCheck2, History, TriangleAlert } from "lucide-react";

import { unitStatusCopy } from "../copy";
import { cn } from "../lib/cn";

export function AiProvenanceLabel({
  status,
  cached = false,
  className,
}: {
  status: string;
  cached?: boolean;
  className?: string;
}) {
  const copy = unitStatusCopy(status);
  const amber = copy.tone === "amber";
  const Icon = amber ? TriangleAlert : status === "deterministic" ? FileCheck2 : Bot;
  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-wide",
        amber ? "text-warn" : "text-muted",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        <Icon aria-hidden size={12} />
        {copy.label}
      </span>
      {cached ? (
        <span className="inline-flex items-center gap-1 text-muted">
          <History aria-hidden size={12} />
          reused from an earlier identical scan
        </span>
      ) : null}
      <span className="sr-only">{copy.sentence}</span>
    </p>
  );
}
