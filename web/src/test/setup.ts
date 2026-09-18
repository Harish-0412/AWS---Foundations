import "@testing-library/jest-dom/vitest";

// jsdom has no clipboard; the copy buttons use it, so tests get a stub that records writes.
if (!navigator.clipboard) {
  const writes: string[] = [];
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: async (value: string) => {
        writes.push(value);
      },
      readText: async () => writes.at(-1) ?? "",
    },
    configurable: true,
  });
}
