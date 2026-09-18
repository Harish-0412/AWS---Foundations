import type { Config } from "tailwindcss";

/**
 * Every colour resolves to a CSS custom property defined once in `src/theme/tokens.css`.
 * Components never name a raw hex value, so light and dark stay in step.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        "surface-sunken": "var(--surface-sunken)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        ink: "var(--text)",
        muted: "var(--text-muted)",
        faint: "var(--text-faint)",
        accent: "var(--accent)",
        warn: "var(--warn)",
        "warn-fill": "var(--warn-fill)",
        error: "var(--error)",
        "error-fill": "var(--error-fill)",
        severity: {
          critical: "var(--severity-critical)",
          high: "var(--severity-high)",
          medium: "var(--severity-medium)",
          low: "var(--severity-low)",
          info: "var(--severity-info)",
        },
        decision: {
          deny: "var(--decision-deny)",
          review: "var(--decision-review)",
          permit: "var(--decision-permit)",
        },
        coverage: {
          partial: "var(--coverage-partial)",
          failed: "var(--coverage-failed)",
          complete: "var(--coverage-complete)",
        },
      },
      fontFamily: {
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
      maxWidth: { prose: "72ch" },
      spacing: { 18: "4.5rem" },
    },
  },
  plugins: [],
} satisfies Config;
