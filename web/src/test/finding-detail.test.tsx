import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "../App";
import { RECORDED_RUNS } from "../api/fixtures";
import { renderWithProviders } from "./render";

function runIdFor(slug: string): string {
  const run = RECORDED_RUNS.find((candidate) => candidate.slug === slug);
  if (!run) throw new Error(`missing fixture ${slug}`);
  return (run.view as { run_id: string }).run_id;
}

describe("finding detail", () => {
  it("renders the explained finding with its evidence and provenance", async () => {
    const runId = runIdFor("complete");
    renderWithProviders(<App />, { route: `/runs/${runId}/findings/G2` });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /Route without an authorization check at src\/app\.py line 9/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not call any authorization check that First Commit recognizes/),
    ).toBeInTheDocument();
    expect(screen.getByText(/anyone who can reach the URL can call it without signing in/))
      .toBeInTheDocument();
    // Provenance is always visible on generated prose.
    expect(screen.getAllByText(/Written from a vetted template/).length).toBeGreaterThan(0);
    // Evidence class replaces any confidence number.
    expect(screen.getByText("Pattern match — needs a human eye")).toBeInTheDocument();
  });

  it("renders every uncertainty the unit reported instead of collapsing it", async () => {
    const runId = runIdFor("complete");
    renderWithProviders(<App />, { route: `/runs/${runId}/findings/G2` });
    expect(
      await screen.findByText("The detector cannot see protection added by middleware or an API gateway."),
    ).toBeInTheDocument();
  });

  it("lists the fix steps as a checklist that remembers a tick in this browser", async () => {
    const user = userEvent.setup();
    const runId = runIdFor("complete");
    renderWithProviders(<App />, { route: `/runs/${runId}/findings/G2` });

    const first = await screen.findByRole("checkbox", {
      name: /Decide who is allowed to call this route/,
    });
    expect(first).not.toBeChecked();
    await user.click(first);
    expect(first).toBeChecked();
  });

  it("offers verify steps and no way to apply a change automatically", async () => {
    const runId = runIdFor("complete");
    renderWithProviders(<App />, { route: `/runs/${runId}/findings/G2` });
    expect(
      await screen.findByText("Call the route without credentials and confirm it returns 401 or 403."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /apply/i })).toBeNull();
  });

  it("shows the rule IDs behind the decision in plain sentences", async () => {
    const runId = runIdFor("complete");
    renderWithProviders(<App />, { route: `/runs/${runId}/findings/G2` });
    const rules = await screen.findByText("auth-requires-review");
    expect(rules).toBeInTheDocument();
    expect(screen.getByText("Authorization findings always need human review.")).toBeInTheDocument();
  });

  it("explains the comparison honestly when only one run exists", async () => {
    const runId = runIdFor("complete");
    renderWithProviders(<App />, { route: `/runs/${runId}/findings/G2` });
    const panel = await screen.findByRole("heading", { name: "Is it gone?" });
    const section = panel.closest("section") as HTMLElement;
    expect(await within(section).findByRole("combobox")).toBeInTheDocument();
  });
});
