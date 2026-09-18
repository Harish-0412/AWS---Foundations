/**
 * §11: the progress model.
 *
 * Checklist state is a local note, stored in this browser and labelled as such. The backend has
 * no notion of a half-fixed finding, and the interface must not imply that it does: the loop only
 * closes when a later run no longer contains the finding's content-derived ID.
 */
import { useCallback, useEffect, useState } from "react";

const PREFIX = "first-commit.checklist.";

function read(key: string): number[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is number => typeof value === "number");
  } catch {
    return [];
  }
}

export function useChecklist(findingId: string) {
  const key = `${PREFIX}${findingId}`;
  const [done, setDone] = useState<number[]>(() =>
    typeof window === "undefined" ? [] : read(key),
  );

  useEffect(() => {
    setDone(read(key));
  }, [key]);

  const toggle = useCallback(
    (index: number) => {
      setDone((current) => {
        const next = current.includes(index)
          ? current.filter((value) => value !== index)
          : [...current, index];
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // The checkbox still works for this session even without storage.
        }
        return next;
      });
    },
    [key],
  );

  const reset = useCallback(() => {
    setDone([]);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore.
    }
  }, [key]);

  return { done, toggle, reset };
}
