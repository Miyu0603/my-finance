---
applyTo: "**/*.ts,supabase/**/*,**/migrations/**/*"
---

# Supabase / Database Rules

**DB-01 · MUST** — Use Row Level Security. Never rely solely on frontend protection.

**DB-02 · MUST** — Validate all writes with zod before insert/update.

**DB-03 · MUST** — Never trust client-provided IDs. Verify ownership server-side.

**DB-04 · SHOULD** — Prefer migrations over manual schema changes. Structure must be reproducible.

**DB-05 · SHOULD** — Migrations are safe to roll forward and back. Prefer backward-compatible steps (add column → backfill → switch reads → drop old). Never ship a destructive migration without a tested rollback.

**DB-06 · MUST** — The `service_role` key never reaches the client bundle. Use it only in server-side code; the browser gets the `anon` key plus RLS. (This is core rule SEC-03 applied to Supabase.)
