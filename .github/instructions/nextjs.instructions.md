---
applyTo: "app/**/*.{ts,tsx},src/**/*.{ts,tsx}"
---

# Next.js Rules

**NEXT-01 · SHOULD** — Use App Router. Avoid Pages Router for new projects.

**NEXT-02 · SHOULD** — Prefer Server Components. Use Client Components only for state, browser APIs, or interaction.

**NEXT-03 · SHOULD** — Keep data fetching near the server. Avoid unnecessary client fetching.

**NEXT-04 · SHOULD** — Use Server Actions when appropriate. Avoid building APIs only your own UI consumes.

**NEXT-05 · MUST** — Loading and error states are mandatory. Every page considers Loading / Empty / Error / Success.
