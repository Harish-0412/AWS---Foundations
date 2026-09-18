import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "../App";
import { RECORDED_RUNS } from "../api/fixtures";
import { renderWithProviders } from "./render";

function runIdFor(slug: string): string {
  const run = RECORDED_RUNS.find((candidate) => candidate.slug === slug);
  if (!run) throw new Error(`missing fixture ${slug}`);
  return (run.view as { run_id: string }).run_id;
}

describe("coverage & reliability", () => {
  it("translates the failure reason and names the missing categories", async () => {
    const runId = runIdFor("partial");
    renderWithProviders(<App />, { route: `/runs/${runId}/coverage` });

    expect(await screen.findByText("The check ran out of time.")).toBeInTheDocument();
    expect(screen.getByText("Resume the run. This is often temporary.")).toBeInTheDocument();
    expect(screen.getByText(/Because semgrep didn't run/)).toBeInTheDocument();
    expect(screen.getAllByText(/Unsafe command execution/).length).toBeGreaterThan(0);
    // The page explains what resume will and will not do.
    expect(
      screen.getByText(/Only the incomplete checks run again/),
    ).toBeInTheDocument();
  });

  it("shows a check that did not apply as a normal state, not a failure", async () => {
    const runId = runIdFor("none-applicable");
    renderWithProviders(<App />, { route: `/runs/${runId}/coverage` });
    expect(await screen.findByText("Didn't apply to your files")).toBeInTheDocument();
    expect(
      screen.getByText("Your repository has no files of the type this check reads."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/scan failed/i)).toBeNull();
  });

  it("speaks to a beginner without the state-machine timeline", async () => {
    const runId = runIdFor("partial");
    renderWithProviders(<App />, { route: `/runs/${runId}/coverage` });
    expect(await screen.findByText(/available in the Developer reading level/)).toBeInTheDocument();
    expect(screen.queryByText("RunDetector")).toBeNull();
  });
});

describe("decisions & rules", () => {
  it("counts outcomes and explains each rule that applied", async () => {
    const runId = runIdFor("complete");
    renderWithProviders(<App />, { route: `/runs/${runId}/policy` });

    expect((await screen.findAllByText("high-risk-requires-review")).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("High and critical severity findings need human review.").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Several findings affect the same file or resource.").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/A model can explain them and can escalate a decision, but it can never lower one/),
    ).toBeInTheDocument();
  });

  it("says so honestly when the run never reached the policy engine", async () => {
    const runId = runIdFor("failed");
    renderWithProviders(<App />, { route: `/runs/${runId}/policy` });
    expect(
      await screen.findByText(/This run never reached the policy engine/),
    ).toBeInTheDocument();
  });

  it("lists the production rule for a production-tagged resume", async () => {
    const runId = runIdFor("resumed");
    renderWithProviders(<App />, { route: `/runs/${runId}/policy` });
    expect(
      (
        await screen.findAllByText(
          "Production, or conflicting environment tags, always requires review.",
        )
      ).length,
    ).toBeGreaterThan(0);
  });
});

describe("transparency & cost", () => {
  it("reports zero model calls as the honest, good case", async () => {
    const runId = runIdFor("complete");
    renderWithProviders(<App />, { route: `/runs/${runId}/transparency` });

    expect(await screen.findByText("No model was used in this run.")).toBeInTheDocument();
    expect(screen.getByText(/none — vetted templates only/)).toBeInTheDocument();
    expect(screen.getByText("Checks executed: 5")).toBeInTheDocument();
    expect(screen.getByText("Checks reused from identical content: 0")).toBeInTheDocument();
  });

  it("shows the version keys that decide whether cached work is reused", async () => {
    const runId = runIdFor("complete");
    renderWithProviders(<App />, { route: `/runs/${runId}/transparency` });
    expect(await screen.findByText("reasoning-contract-1")).toBeInTheDocument();
    expect(screen.getByText("evidence-packet-1")).toBeInTheDocument();
  });

  it("states the product's own claim with numbers from the run", async () => {
    const runId = runIdFor("complete");
    renderWithProviders(<App />, { route: `/runs/${runId}/transparency` });
    expect(
      await screen.findByText(/This run resolved 4 findings with 0 model calls/),
    ).toBeInTheDocument();
  });
});

describe("review queue", () => {
  it("groups a dead-lettered check under the disposition that says who acts", async () => {
    const runId = runIdFor("partial");
    renderWithProviders(<App />, { route: `/runs/${runId}/review` });

    expect(await screen.findByRole("heading", { name: "Failed after automatic retries" })).toBeInTheDocument();
    expect(
      screen.getByText("We retried automatically and the check still did not finish."),
    ).toBeInTheDocument();
    expect(screen.getByText("The check ran out of time.")).toBeInTheDocument();
    expect(screen.getByText(/We do not show exception text/)).toBeInTheDocument();
  });

  it("treats an empty queue as a calm, good state", async () => {
    const runId = runIdFor("complete");
    renderWithProviders(<App />, { route: `/runs/${runId}/review` });
    expect(await screen.findByText("Nothing is waiting for review.")).toBeInTheDocument();
    expect(
      screen.getByText("Every check that was planned either ran or did not apply to your files."),
    ).toBeInTheDocument();
  });
});

describe("empty findings with complete coverage", () => {
  it("refuses to call an empty result a clean bill of health", async () => {
    const runId = runIdFor("none-applicable");
    renderWithProviders(<App />, { route: `/runs/${runId}` });
    const note = await screen.findByText(/That is not a guarantee your application is secure/);
    expect(note).toBeInTheDocument();
  });
});

describe("the deliberate not-built pages", () => {
  it("names the missing endpoint instead of inventing data", async () => {
    const runId = runIdFor("complete");
    renderWithProviders(<App />, { route: `/runs/${runId}/ask` });
    expect(await screen.findByText("Not built yet")).toBeInTheDocument();
    expect(screen.getByText(/POST \/runs\/\{id\}\/questions/)).toBeInTheDocument();
  });

  it("keeps the dashboard out of this milestone honestly", async () => {
    renderWithProviders(<App />, { route: "/" });
    const index = await screen.findByRole("main");
    expect(within(index).getByText(/development index, not the product's dashboard/)).toBeInTheDocument();
  });
});
