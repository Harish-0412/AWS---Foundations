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

describe("run overview", () => {
  it("renders the backend's coverage notice verbatim for a partial run", async () => {
    renderWithProviders(<App />, { route: `/runs/${runIdFor("partial")}` });
    const banner = await screen.findByTestId("coverage-banner");
    expect(banner).toHaveAttribute("data-coverage-complete", "false");
    expect(banner).toHaveTextContent(
      "4 of 5 checks completed. semgrep failed after automatic retries (timeout).",
    );
    expect(banner).toHaveTextContent(
      "these kinds of issue may be missing: Unsafe command execution",
    );
  });

  it("offers no way to dismiss the banner while coverage is incomplete", async () => {
    renderWithProviders(<App />, { route: `/runs/${runIdFor("partial")}` });
    const banner = await screen.findByTestId("coverage-banner");
    expect(within(banner).queryByRole("button", { name: /dismiss|hide|close/i })).toBeNull();
    // The only button is Resume, and it runs the documented resume path.
    expect(within(banner).getByRole("button", { name: /resume/i })).toBeInTheDocument();
  });

  it("never shows a findings count above the coverage state for a partial run", async () => {
    renderWithProviders(<App />, { route: `/runs/${runIdFor("partial")}` });
    const banner = await screen.findByTestId("coverage-banner");
    const count = await screen.findByTestId("finding-count");
    expect(count).toHaveAttribute("data-coverage-state", "incomplete");
    // Node.compareDocumentPosition: the banner must come first in document order.
    const relation = banner.compareDocumentPosition(count);
    expect(relation & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("states the outcome in words for a run that could not finish", async () => {
    renderWithProviders(<App />, { route: `/runs/${runIdFor("failed")}` });
    expect(
      await screen.findByText("One file is larger than the 2 MB we read."),
    ).toBeInTheDocument();
    expect(screen.getByText("Remove or ignore that file, or scan a subfolder.")).toBeInTheDocument();
    expect(screen.getByText("Repeating this run will not change the outcome.")).toBeInTheDocument();
  });

  it("shows a thin neutral state, not a celebration, when every check completed", async () => {
    renderWithProviders(<App />, { route: `/runs/${runIdFor("complete")}` });
    const banner = await screen.findByTestId("coverage-banner");
    expect(banner).toHaveAttribute("data-coverage-complete", "true");
    expect(banner).toHaveTextContent("All 5 applicable checks completed.");
  });

  it("keeps the standing safety contract on the page", async () => {
    renderWithProviders(<App />, { route: `/runs/${runIdFor("complete")}` });
    expect(
      await screen.findByText(/This tool never runs, edits, commits, merges or deploys your code/),
    ).toBeInTheDocument();
  });

  it("renders the priority order the backend produced, without re-sorting", async () => {
    renderWithProviders(<App />, { route: `/runs/${runIdFor("complete")}` });
    const priorities = await screen.findAllByText(/^G[1-4]$/);
    expect(priorities.map((node) => node.textContent)).toEqual(["G1", "G2", "G3", "G4"]);
  });
});
