/**
 * Text surfaces. Everything a scanned repository controls is rendered as inert text in a
 * monospace block — never as HTML or markdown (§17.1).
 */
import { Check, Copy, TerminalSquare } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "../lib/cn";

export function CopyButton({
  value,
  label = "Copy",
  announced = "Copied",
}: {
  value: string;
  label?: string;
  announced?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [value]);

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-1 rounded border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted hover:text-ink"
      >
        {copied ? <Check aria-hidden size={12} /> : <Copy aria-hidden size={12} />}
        {copied ? announced : label}
      </button>
      {/* Copy buttons announce success politely (§15). */}
      <span aria-live="polite" className="sr-only">
        {copied ? announced : ""}
      </span>
    </span>
  );
}

/** Inert monospace text. `fromRepository` marks strings the backend flagged as untrusted. */
export function UntrustedText({
  children,
  fromRepository = false,
  className,
}: {
  children: string;
  fromRepository?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-1", className)}>
      <code className="break-all rounded bg-surface-sunken px-1 py-0.5 font-mono text-[12px]">
        {children}
      </code>
      {fromRepository ? (
        <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
          from your repository
        </span>
      ) : null}
    </span>
  );
}

/** §8.6. A command with a copy button and the label that says where to run it. */
export function CommandBlock({ command, note }: { command: string; note?: string }) {
  return (
    <div className="rounded border border-line bg-surface-sunken p-2">
      <div className="flex items-start justify-between gap-2">
        <code className="break-all font-mono text-[12px] text-ink">{command}</code>
        <CopyButton value={command} />
      </div>
      {note ? <p className="mt-1 text-xs text-muted">{note}</p> : null}
    </div>
  );
}

/**
 * Heuristic: a verify step is a command if it looks like one. Used only to decide whether to
 * offer copy-to-clipboard, never to reinterpret what the step means.
 */
export function looksLikeCommand(step: string): boolean {
  const trimmed = step.trim();
  if (!trimmed || trimmed.endsWith(".")) return false;
  return /^(npm|pnpm|yarn|npx|pip|python|pytest|uv|docker|sam|aws|curl|make|cargo|go|first-commit|git)\b/.test(
    trimmed,
  );
}

export function VerifyStep({ step }: { step: string }) {
  if (looksLikeCommand(step)) {
    return <CommandBlock command={step} />;
  }
  return (
    <p className="flex items-start gap-2 text-sm text-ink">
      <TerminalSquare aria-hidden size={14} className="mt-1 shrink-0 text-faint" />
      <span>{step}</span>
    </p>
  );
}
