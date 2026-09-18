import { QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

import { ApiProvider, makeQueryClient } from "../api/context";
import { recordedApi } from "../api/client";
import { AudienceProvider } from "../lib/preferences";

/** Queries are not retried in tests, so a failure surfaces immediately. */
export function makeTestClient() {
  const client = makeQueryClient();
  client.setDefaultOptions({ queries: { retry: false } });
  return client;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = "/" }: { route?: string } = {},
): RenderResult {
  return render(
    <QueryClientProvider client={makeTestClient()}>
      <ApiProvider api={recordedApi()}>
        <AudienceProvider>
          <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
        </AudienceProvider>
      </ApiProvider>
    </QueryClientProvider>,
  );
}
