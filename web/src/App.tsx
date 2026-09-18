/**
 * Routes. The run is the unit of work, so everything about a scan lives under `/runs/:runId` and
 * a shared link always carries its full context (§6).
 */
import { Route, Routes } from "react-router-dom";

import { CoveragePage } from "./pages/coverage";
import { FindingDetailPage } from "./pages/finding-detail";
import { IndexPage, NotFoundPage, NotBuiltPage } from "./pages/index";
import { LearnIndexPage, LearnTermPage } from "./pages/learn";
import { NewScanPage } from "./pages/new-scan";
import { PolicyPage } from "./pages/policy";
import { ReviewQueuePage } from "./pages/review-queue";
import { RunOverviewPage } from "./pages/run-overview";
import { TransparencyPage } from "./pages/transparency";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/scan/new" element={<NewScanPage />} />
      <Route path="/runs/:runId" element={<RunOverviewPage />} />
      <Route path="/runs/:runId/findings/:groupId" element={<FindingDetailPage />} />
      <Route path="/runs/:runId/coverage" element={<CoveragePage />} />
      <Route path="/runs/:runId/policy" element={<PolicyPage />} />
      <Route path="/runs/:runId/transparency" element={<TransparencyPage />} />
      <Route path="/runs/:runId/review" element={<ReviewQueuePage />} />
      <Route
        path="/runs/:runId/ask"
        element={<NotBuiltPage page="Ask about this scan" endpoint="POST /runs/{id}/questions" />}
      />
      <Route
        path="/runs/:runId/remediation"
        element={<NotBuiltPage page="Remediation & the PR gate" endpoint="POST /runs/{id}/proposals" />}
      />
      <Route path="/history" element={<NotBuiltPage page="History" endpoint="GET /runs?repository=" />} />
      <Route path="/settings" element={<NotBuiltPage page="Settings" endpoint="PATCH /settings" />} />
      <Route path="/learn" element={<LearnIndexPage />} />
      <Route path="/learn/:term" element={<LearnTermPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
