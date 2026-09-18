/**
 * Start a scan (§7.3). It collects the minimum, shows the real limits before submit, and sends an
 * `Idempotency-Key` per form submission so a double click or a retry cannot start two runs.
 *
 * A rejection is not a form error: it is a run with a reason code, and the interface navigates to
 * that run so the user reads the same sentence they would read anywhere else.
 */
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApiError } from "../api/client";
import { useApi, newIdempotencyKey, useStartScan } from "../api/context";
import { AUDIENCE, LIMITS, SCAN_FORM } from "../copy";
import { ErrorBlock } from "../components/states";
import { AppShell, Section } from "../components/shell";
import { cn } from "../lib/cn";
import type { Audience } from "../lib/preferences";

type SourceKind = "url" | "upload" | "folder";

const ENVIRONMENTS = [
  { value: "development", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
] as const;

export function NewScanPage() {
  const api = useApi();
  const navigate = useNavigate();
  const startScan = useStartScan();
  const [kind, setKind] = useState<SourceKind>("url");
  const [source, setSource] = useState("");
  const [environments, setEnvironments] = useState<string[]>(["development"]);
  const [audience, setAudience] = useState<Audience>("beginner");
  const [refresh, setRefresh] = useState(false);
  const keyRef = useRef<string>(newIdempotencyKey());

  const onToggleEnvironment = useCallback((value: string) => {
    setEnvironments((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }, []);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    startScan.mutate(
      {
        request: {
          source_ref: source.trim(),
          environments,
          audience,
          refresh,
        },
        idempotencyKey: keyRef.current,
      },
      {
        onSuccess: (run) => navigate(`/runs/${run.run_id}`),
      },
    );
    // A new key for the next submission: the previous run is already named by the old one.
    keyRef.current = newIdempotencyKey();
  };

  const helper = useMemo(() => {
    if (kind === "url") return SCAN_FORM.sourceHelp;
    if (kind === "folder") return SCAN_FORM.folderHelp;
    return "Upload a .zip we can open safely: no symbolic links and no encrypted entries.";
  }, [kind]);

  const disabled = source.trim().length === 0 || startScan.isPending;

  return (
    <AppShell>
      <h1 className="text-xl font-semibold text-ink">{SCAN_FORM.submit}</h1>
      <p className="prose-column mt-2 text-sm text-muted">{SCAN_FORM.limitsHelp}</p>

      <form onSubmit={onSubmit} className="mt-4">
        <Section title={SCAN_FORM.sourceLabel} description={helper}>
          <div role="tablist" aria-label="Source kind" className="flex flex-wrap gap-1">
            {(
              [
                ["url", SCAN_FORM.urlTab],
                ["upload", SCAN_FORM.uploadTab],
                ["folder", SCAN_FORM.folderTab],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={kind === value}
                onClick={() => setKind(value)}
                className={cn(
                  "rounded border px-3 py-1 text-sm",
                  kind === value ? "border-line-strong bg-surface-sunken text-ink" : "border-line text-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="mt-3 block text-sm">
            <span className="text-muted">
              {kind === "url" ? "Repository URL" : kind === "folder" ? "Folder path" : "Archive path"}
            </span>
            <input
              type="text"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder={kind === "url" ? "https://github.com/you/project" : "./my-project"}
              className="mt-1 w-full rounded border border-line bg-surface-raised px-3 py-2 font-mono text-sm"
              required
            />
          </label>
        </Section>

        <Section title={SCAN_FORM.environmentsLabel} description={SCAN_FORM.environmentsHelp}>
          <div className="flex flex-wrap gap-4">
            {ENVIRONMENTS.map((environment) => (
              <label key={environment.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={environments.includes(environment.value)}
                  onChange={() => onToggleEnvironment(environment.value)}
                />
                {environment.label}
              </label>
            ))}
          </div>
        </Section>

        <Section title={SCAN_FORM.audienceLabel} description={SCAN_FORM.audienceHelp}>
          <div className="flex flex-wrap gap-4">
            {(["beginner", "developer"] as const).map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="audience"
                  checked={audience === value}
                  onChange={() => setAudience(value)}
                />
                {AUDIENCE[value]}
              </label>
            ))}
          </div>
        </Section>

        <Section title="Re-scan unchanged code">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={refresh} onChange={() => setRefresh(!refresh)} />
            {SCAN_FORM.refreshLabel}
          </label>
          <p className="mt-1 text-xs text-muted">{SCAN_FORM.refreshHelp}</p>
        </Section>

        <Section title={SCAN_FORM.limitsHeading}>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            {LIMITS.summary.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </Section>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded border border-line-strong bg-surface-raised px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {startScan.isPending ? <LoaderCircle aria-hidden size={14} className="animate-spin" /> : null}
            {startScan.isPending ? SCAN_FORM.submitting : SCAN_FORM.submit}
          </button>
          {api.mode === "recorded" ? (
            <span className="text-sm text-muted">
              The interface is reading recorded runs, so submitting is disabled until it is pointed
              at a running API.{" "}
              <Link to="/">Open a recorded run instead.</Link>
            </span>
          ) : null}
        </div>
      </form>

      {startScan.isError ? (
        <div className="mt-4">
          {startScan.error instanceof ApiError && startScan.error.kind === "invalid_request" ? (
            <div className="border border-warn bg-warn-fill p-4 text-sm text-warn">
              <p className="flex items-center gap-2 font-medium">
                <CircleAlert aria-hidden size={16} />
                That request was refused before a run was created.
              </p>
              <p className="mt-1">{startScan.error.message}</p>
            </div>
          ) : (
            <ErrorBlock error={startScan.error} />
          )}
        </div>
      ) : null}

    </AppShell>
  );
}
