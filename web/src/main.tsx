import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App";
import { ApiProvider, makeQueryClient } from "./api/context";
import { AudienceProvider } from "./lib/preferences";
import "./index.css";

const client = makeQueryClient();

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <ApiProvider>
        <AudienceProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AudienceProvider>
      </ApiProvider>
    </QueryClientProvider>
  </StrictMode>,
);
