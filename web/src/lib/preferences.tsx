/**
 * The register switch (§4). One preference, persisted per browser, defaulting to Beginner.
 *
 * `audience` is also sent to the backend as a first-class input, and it is part of the
 * explanation cache key there, so switching re-renders from cache rather than re-spending.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Audience = "beginner" | "developer";

const STORAGE_KEY = "first-commit.audience";

type AudienceContextValue = {
  audience: Audience;
  setAudience: (audience: Audience) => void;
  toggle: () => void;
};

const AudienceContext = createContext<AudienceContextValue>({
  audience: "beginner",
  setAudience: () => undefined,
  toggle: () => undefined,
});

function readStored(): Audience {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "developer" ? "developer" : "beginner";
  } catch {
    return "beginner";
  }
}

export function AudienceProvider({ children }: { children: ReactNode }) {
  const [audience, setAudienceState] = useState<Audience>(() =>
    typeof window === "undefined" ? "beginner" : readStored(),
  );

  useEffect(() => {
    document.documentElement.dataset.audience = audience;
  }, [audience]);

  const setAudience = useCallback((next: Audience) => {
    setAudienceState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // A browser that refuses storage still gets the switch for this session.
    }
  }, []);

  const value = useMemo<AudienceContextValue>(
    () => ({
      audience,
      setAudience,
      toggle: () => setAudience(audience === "beginner" ? "developer" : "beginner"),
    }),
    [audience, setAudience],
  );

  return <AudienceContext.Provider value={value}>{children}</AudienceContext.Provider>;
}

export function useAudience(): AudienceContextValue {
  return useContext(AudienceContext);
}

/** Theme preference: follows the OS unless the user picks a side. */
export type ThemePreference = "system" | "light" | "dark";

const THEME_KEY = "first-commit.theme";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") return "system";
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  });

  useEffect(() => {
    if (theme === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // Ignore: the toggle still works for this session.
    }
  }, []);

  return { theme, setTheme };
}
