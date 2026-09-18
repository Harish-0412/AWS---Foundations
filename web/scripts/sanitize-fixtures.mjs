/**
 * Strips machine-local absolute paths out of the recorded runs in `src/data/fixtures`.
 *
 * The recorded documents are real pipeline output, and a real run records the local directory it
 * read as `source.label`. That path is not part of any contract the interface reads, and it names
 * whoever recorded the fixture, so it is rewritten to the repository-relative path before the
 * file is committed. Nothing else in the document is touched: the notices, findings, decisions,
 * usage and trace all stay exactly as the pipeline wrote them.
 *
 * Run after re-recording a fixture:  node scripts/sanitize-fixtures.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, "..", "src", "data", "fixtures");

// Any absolute path ending in one of the repository's own fixture folders.
const LOCAL_FIXTURE_PATH = /[A-Za-z]:\\+(?:[^"\\]+\\+)*fixtures\\+([A-Za-z0-9._-]+)/g;

let changed = 0;
for (const name of readdirSync(fixtures)) {
  if (!name.endsWith(".json")) continue;
  const path = join(fixtures, name);
  const before = readFileSync(path, "utf8");
  const after = before.replace(LOCAL_FIXTURE_PATH, (_match, folder) => `fixtures/${folder}`);
  if (after === before) continue;
  JSON.parse(after); // Refuse to write a document that no longer parses.
  writeFileSync(path, after);
  changed += 1;
  console.log(`rewrote ${name}`);
}
console.log(changed === 0 ? "every recorded run is already path-free" : `${changed} file(s) rewritten`);
