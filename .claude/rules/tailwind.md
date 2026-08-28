---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.vue"
  - "**/*.svelte"
  - "**/*.html"
  - "tailwind.config.*"
---

# Tailwind Rules

Only relevant when the project actually uses Tailwind — ignore otherwise.

**TW-01 · SHOULD** — Prefer reusable components. Avoid 100-line class strings.

**TW-02 · SHOULD** — Extract patterns repeated 3+ times.

**TW-03 · SHOULD** — Use design tokens. Avoid arbitrary values unless necessary (`w-44`, not `w-[173px]`).
