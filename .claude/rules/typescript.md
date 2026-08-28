---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript Rules

These implement core rule **ARCH-04** ("data shapes are contracts") for TypeScript.

**TS-01 · MUST** — Types are contracts. Avoid `any`; prefer `type` / `interface`, or a zod schema when the value crosses a runtime boundary.

**TS-02 · MUST** — Validate at runtime wherever data enters the program (form input, API response, `JSON.parse`, env vars). A compile-time type is not a runtime guarantee — parse, don't cast.

**TS-03 · SHOULD** — Prefer `unknown` over `any` when a type is genuinely not known yet, then narrow it.

**TS-04 · SHOULD** — Keep `strict` on in `tsconfig.json`. Don't silence errors with `@ts-ignore`; if you must, use `@ts-expect-error` with a comment explaining why.

**TS-05 · SHOULD** — Derive types instead of duplicating them (`z.infer`, `ReturnType`, indexed access) so a shape is defined once.
