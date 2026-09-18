/**
 * The typed API client.
 *
 * Two implementations, one interface:
 *  - `httpApi` talks to the deployed API. It sends no tenant or user field; identity is derived
 *    from the bearer token server-side (§17.6).
 *  - `recordedApi` serves the checked-in runs. It exists because `GET /runs/{id}/result`,
 *    `GET /runs?…` and the question route are still API gaps, and building pages on invented
 *    data would be worse than reading real recorded output.
 */
import {
  RESULT_SCHEMA,
  type PipelineResult,
  type ReviewItem,
  type RunView,
  pipelineResult,
  reviewItemsResponse,
  runView,
} from "./schemas";
import { RECORDED_ALIASES, RECORDED_RUNS, type RecordedRun } from "./fixtures";

export type ApiErrorKind =
  | "not_found"
  | "forbidden"
  | "offline"
  | "server"
  | "invalid_response"
  | "version_mismatch"
  | "invalid_request"
  | "not_resumable"
  | "unknown";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly code?: string;
  readonly findings?: string[];

  constructor(kind: ApiErrorKind, message: string, options: { code?: string; findings?: string[] } = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.code = options.code;
    this.findings = options.findings;
  }
}

export type ScanRequest = {
  source_ref: string;
  environments: string[];
  audience: "beginner" | "developer";
  refresh?: boolean;
};

export type ReviewItems = { run_id: string; items: ReviewItem[] };

export interface FirstCommitApi {
  /** "live" sends requests; "recorded" reads the checked-in runs. Shown in the interface. */
  readonly mode: "live" | "recorded";
  listRuns(): Promise<RunView[]>;
  getRun(runId: string): Promise<RunView>;
  getResult(runId: string): Promise<PipelineResult>;
  getReviews(runId: string): Promise<ReviewItems>;
  startScan(request: ScanRequest, idempotencyKey: string): Promise<RunView>;
  resumeRun(runId: string): Promise<RunView>;
}

/** What the recorded source can list: every checked-in run. */
export const RECORDED_RUN_LIST: RecordedRun[] = RECORDED_RUNS;

function parseRunView(value: unknown): RunView {
  const parsed = runView.safeParse(value);
  if (!parsed.success) {
    throw new ApiError("invalid_response", "The run document is not in a shape we understand.", {
      findings: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    });
  }
  return parsed.data;
}

function parseResult(value: unknown): PipelineResult {
  const parsed = pipelineResult.safeParse(value);
  if (!parsed.success) {
    throw new ApiError("invalid_response", "The result document is not in a shape we understand.", {
      findings: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    });
  }
  if (parsed.data.schema_version !== RESULT_SCHEMA) {
    throw new ApiError(
      "version_mismatch",
      `This result was produced by ${parsed.data.schema_version}.`,
      { code: parsed.data.schema_version },
    );
  }
  return parsed.data;
}

function parseReviews(value: unknown): ReviewItems {
  const parsed = reviewItemsResponse.safeParse(value);
  if (!parsed.success) {
    throw new ApiError("invalid_response", "The review items are not in a shape we understand.");
  }
  return parsed.data;
}

function recordedRunFor(runId: string): RecordedRun {
  const alias = RECORDED_ALIASES[runId];
  const run = RECORDED_RUNS.find((candidate) => {
    if (alias && candidate.slug === alias) return true;
    return (candidate.view as { run_id?: string }).run_id === runId;
  });
  if (!run) {
    throw new ApiError("not_found", "We don't have a recorded run with that ID.");
  }
  return run;
}

export function recordedApi(): FirstCommitApi {
  return {
    mode: "recorded",
    async listRuns() {
      return RECORDED_RUNS.map((run) => parseRunView(run.view));
    },
    async getRun(runId) {
      return parseRunView(recordedRunFor(runId).view);
    },
    async getResult(runId) {
      return parseResult(recordedRunFor(runId).result);
    },
    async getReviews(runId) {
      const run = recordedRunFor(runId);
      return parseReviews({ run_id: runId, items: run.reviews });
    },
    async startScan() {
      throw new ApiError(
        "invalid_request",
        "Recorded mode cannot start a scan. Point the interface at a running API to submit one.",
      );
    },
    async resumeRun() {
      throw new ApiError(
        "invalid_request",
        "Recorded mode cannot resume a run. The resumed run is already checked in as its own fixture.",
      );
    },
  };
}

export type HttpOptions = {
  baseUrl: string;
  /** Bearer token from the Cognito SDK, held in memory (§17.3). */
  token: () => Promise<string | null>;
};

function kindForStatus(status: number, code: string | undefined): ApiErrorKind {
  if (status === 404) return "not_found";
  if (status === 401 || status === 403) return "forbidden";
  if (status === 409 && code === "run_not_resumable") return "not_resumable";
  if (status === 400) return "invalid_request";
  if (status >= 500) return "server";
  return "unknown";
}

export function httpApi(options: HttpOptions): FirstCommitApi {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await options.token();
    let response: Response;
    try {
      response = await fetch(`${options.baseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init.headers ?? {}),
        },
      });
    } catch {
      throw new ApiError("offline", "We couldn't reach the API.");
    }
    const text = await response.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    if (!response.ok) {
      const code = (body as { error?: string } | null)?.error;
      if (response.status === 404 && code === "run_not_found") {
        throw new ApiError("not_found", "We don't have a run with that ID.", { code });
      }
      throw new ApiError(kindForStatus(response.status, code), code ?? "request failed", { code });
    }
    return body as T;
  }

  return {
    mode: "live",
    async listRuns() {
      const body = await request<{ runs?: unknown[] }>("/runs");
      return (body.runs ?? []).map(parseRunView);
    },
    async getRun(runId) {
      return parseRunView(await request(`/runs/${runId}`));
    },
    async getResult(runId) {
      return parseResult(await request(`/runs/${runId}/result`));
    },
    async getReviews(runId) {
      return parseReviews(await request(`/runs/${runId}/review-items`));
    },
    async startScan(scanRequest, idempotencyKey) {
      return parseRunView(
        await request("/scans", {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey },
          body: JSON.stringify(scanRequest),
        }),
      );
    },
    async resumeRun(runId) {
      return parseRunView(await request(`/runs/${runId}/resume`, { method: "POST" }));
    },
  };
}

/** One client per page load. Recorded mode is the default until an API URL is configured. */
export function createApi(baseUrl: string | undefined): FirstCommitApi {
  if (!baseUrl) return recordedApi();
  return httpApi({
    baseUrl,
    token: async () => null, // Replaced by the Cognito session when sign-in lands.
  });
}
