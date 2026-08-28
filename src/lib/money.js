/**
 * Money is stored as a plain number, not integer minor units — a deliberate
 * trade-off for a hand-kept ledger. Every arithmetic result goes through
 * round2() so float drift (0.1 + 0.2) can never accumulate into the balances.
 */
export function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}

/** Coerce anything that came from a form/localStorage into a usable number. */
export function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
