#!/usr/bin/env bun
/**
 * Token-drift report: counts `text-[Npx]`-style arbitrary Tailwind values and inline
 * `style={{...}}` objects in the app's own screens/components, where a token should almost
 * always exist instead (`AGENTS.md` already bans `text-[Npx]` outright).
 *
 * Scoped to `src/components/ml` and `src/routes` — chart internals (`src/components/charts`),
 * shadcn/vendor primitives (`src/components/ui`, `animate-ui`, `kibo-ui`, `spectrumui`,
 * `waves-cn`, `agents-ui`) and `src/lab`/`src/registry` (Storybook-only) are excluded: their
 * arbitrary values are mostly computed geometry (chart positions, transform math), not drift.
 *
 * Non-blocking by design (see docs/token-scale-spec-2026-09-16.md and the audit plan): the
 * current count (~126 across the whole repo, most of it already outside this script's scope) is
 * small enough to triage by hand rather than fail CI on. Once triaged, promote individual
 * findings to a real fix (a new/extended token) or an explicit allowlist comment, then consider
 * making this blocking.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SCOPED_DIRS = ["src/components/ml", "src/routes"];
const PATTERNS: { name: string; re: RegExp }[] = [
  { name: "text-[Npx] arbitrary value", re: /text-\[[^\]]+\]/g },
  { name: "inline style={{...}}", re: /style=\{\{/g },
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(entry) && !entry.endsWith(".stories.tsx")) out.push(full);
  }
  return out;
}

let total = 0;
const perFile = new Map<string, number>();

for (const dir of SCOPED_DIRS) {
  for (const file of walk(dir)) {
    const text = readFileSync(file, "utf8");
    let fileCount = 0;
    for (const { re } of PATTERNS) {
      const matches = text.match(re);
      if (matches) fileCount += matches.length;
    }
    if (fileCount > 0) {
      perFile.set(file, fileCount);
      total += fileCount;
    }
  }
}

console.log(`Token drift (text-[Npx] / style={{}}) in ${SCOPED_DIRS.join(", ")}: ${total} total\n`);
for (const [file, count] of [...perFile.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${count.toString().padStart(3)}  ${file}`);
}
if (total === 0) console.log("  (none)");

// Non-blocking: report only, see the doc comment above.
process.exit(0);
