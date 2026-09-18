# First Commit web client

The run-centred interface described in [../docs/frontend.md](../docs/frontend.md). It reads the
backend's own documents (`pipeline-run-1`, `pipeline-result-1`, `review-item-1`) and renders them
without adding a score, a confidence number or an invented count.

## What is implemented

| Page | Route | Reads |
| --- | --- | --- |
| Run overview | `/runs/:runId` | run view + result: outcome line, coverage banner, next step, priorities, combined risks, findings grouped by decision, live step list while running |
| Finding detail | `/runs/:runId/findings/:groupId` | explanation unit + its findings + its policy decision, with the fix checklist, verify steps, evidence drawer, rule sentences and the exact run-to-run comparison |
| Coverage & reliability | `/runs/:runId/coverage` | `coverage.checks[]`, `missing_categories[]`, the recorded run trace, resume |
| Decisions & rules | `/runs/:runId/policy` | `policy.status`, `policy_version`, `decisions[]` with the vetted rule glossary |
| Transparency & cost | `/runs/:runId/transparency` | `usage`, `explanation.report.usage`, `explanation.report.versions`, per-unit provenance |
| Review queue | `/runs/:runId/review` | `GET /runs/:id/review-items`, grouped by disposition |
| Start a scan | `/scan/new` | `POST /scans` with an `Idempotency-Key` per submission |
| Learn | `/learn`, `/learn/:term` | the vetted concept glossary |

Not built yet, and deliberately shown as such rather than filled with invented data: the home
dashboard, the Ask box, remediation and the PR gate, history and settings. Each names the endpoint
it is waiting on.

## Running it

```bash
cd web
npm install
npm run dev        # http://localhost:5273
npm test           # vitest
npm run typecheck  # tsc --noEmit
npm run build      # production bundle
```

With no configuration the client serves **recorded runs** and says so in the header. Point it at a
running API with `VITE_FIRST_COMMIT_API` (the HTTP client sends no tenant or user field; identity
comes from the bearer token server-side).

## Recorded runs

`src/data/fixtures/` holds real pipeline output, not hand-written mocks — mocks drift, and this
interface's honesty depends on the real shapes:

| Fixture | Produced by |
| --- | --- |
| `run-complete.json` | `first-commit run fixtures/golden-repo --environment development` |
| `run-partial.json` | the same run with `--fault semgrep=timeout`, so one check is dead-lettered |
| `run-resumed.json` | `first-commit resume` on the partial run (generation 1, complete again, review item closed) |
| `run-none-applicable.json` | `first-commit run fixtures/hostile-repo`, where one check did not apply and nothing was found |
| `run-failed.json` | a source over the per-file size limit, rejected before any check ran |

After re-recording any of them, run `node scripts/sanitize-fixtures.mjs`: a real run records the
local directory it read as `source.label`, and that path does not belong in the repository.

## Layout

```
src/
  api/         zod schemas, the HTTP and recorded clients, and the join layer (view.ts)
  components/  chips, coverage banner, AI provenance label, evidence drawer, finding card, states
  copy/        every user-visible string, including the reason-code and glossary tables
  data/        recorded runs
  pages/       one file per route
  theme/       tokens, light and dark
  test/        fixture, copy, view and page tests
```

Two rules the code enforces rather than documents: `FindingCount` takes coverage as a required
prop, so a count cannot be rendered without it, and `CoverageBanner` has no dismiss control while
coverage is incomplete.
