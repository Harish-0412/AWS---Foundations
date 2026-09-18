/**
 * The API client, its React context, and the query hooks the pages use.
 *
 * Cache discipline (§13.3): a result is immutable per (run_id, generation), so the generation is
 * part of the query key. A resume bumps the generation and the cached document is dropped, which
 * is exactly the cache-bust the specification asks for.
 */
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";

import { createApi, type FirstCommitApi, type ScanRequest } from "./client";
import type { PipelineResult, ReviewItem, RunView } from "./schemas";

const ApiContext = createContext<FirstCommitApi | null>(null);

export function ApiProvider({
  api,
  children,
}: {
  api?: FirstCommitApi;
  children: ReactNode;
}) {
  const value = api ?? createApi(import.meta.env.VITE_FIRST_COMMIT_API);
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi(): FirstCommitApi {
  const api = useContext(ApiContext);
  if (!api) throw new Error("useApi must be used inside ApiProvider");
  return api;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          const kind = (error as { kind?: string }).kind;
          if (kind && kind !== "offline" && kind !== "server") return false;
          return failureCount < 2;
        },
      },
    },
  });
}

export function useRun(runId: string): UseQueryResult<RunView> {
  const api = useApi();
  return useQuery({
    queryKey: ["run", runId],
    queryFn: () => api.getRun(runId),
    // Poll only while the run is still moving, backing off after half a minute (§13.3).
    refetchInterval: (query) => {
      const data = query.state.data as RunView | undefined;
      if (!data) return false;
      if (!["queued", "running"].includes(data.status)) return false;
      const elapsed = Date.now() - (data.created_at ?? Date.now()) * 1000;
      return elapsed > 30_000 ? 10_000 : 2_000;
    },
  });
}

export function useResult(runId: string, generation: number | undefined): UseQueryResult<PipelineResult> {
  const api = useApi();
  return useQuery({
    queryKey: ["result", runId, generation ?? 0],
    queryFn: () => api.getResult(runId),
    enabled: generation !== undefined,
  });
}

export function useReviews(runId: string): UseQueryResult<{ run_id: string; items: ReviewItem[] }> {
  const api = useApi();
  return useQuery({
    queryKey: ["reviews", runId],
    queryFn: () => api.getReviews(runId),
  });
}

export function useResumeRun() {
  const api = useApi();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => api.resumeRun(runId),
    onSuccess: (run) => {
      client.setQueryData(["run", run.run_id], run);
      void client.invalidateQueries({ queryKey: ["result", run.run_id] });
      void client.invalidateQueries({ queryKey: ["reviews", run.run_id] });
    },
  });
}

export function useStartScan() {
  const api = useApi();
  return useMutation({
    mutationFn: ({ request, idempotencyKey }: { request: ScanRequest; idempotencyKey: string }) =>
      api.startScan(request, idempotencyKey),
  });
}

/** New idempotency key per form submission, so a double click cannot fork a run (§7.3). */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `key-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
