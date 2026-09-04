/**
 * How long a balance has gone without being touched.
 *
 * A hand-kept ledger's weakness is not that a figure is wrong, it is that you
 * cannot tell whether NT$182,450 was confirmed today or three months ago. This
 * turns that into something the UI can show, using only data the ledger already
 * has: the dates on the transactions that moved each account.
 */
const DAY = 86400000

/** Tunable: a month is the natural reconciliation cadence for a bank account. */
export const FRESH_DAYS = 14
export const STALE_DAYS = 30

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/** Every way a transaction can move one account's balance. */
export function touchesAccount(tx, accountId) {
  switch (tx.type) {
    case 'income':
    case 'expense':
    case 'card-payment':
    case 'invest-buy':
    case 'invest-sell':
    case 'adjustment':
      return tx.accountId === accountId
    case 'transfer':
    case 'exchange':
      return tx.fromId === accountId || tx.toId === accountId
    default:
      return false
  }
}

const parse = (iso) => {
  const at = new Date(iso)
  return Number.isNaN(at.getTime()) ? null : at
}

/** The most recent transaction date for this account, or null. */
export function lastTouched(account, transactions = []) {
  let latest = null
  transactions.forEach(tx => {
    if (!touchesAccount(tx, account.id)) return
    const at = parse(tx.date)
    if (at && (!latest || at > latest)) latest = at
  })
  return latest
}

/**
 * `level` is what the UI colours on:
 *   fresh   — touched recently, nothing to do
 *   aging   — worth a look
 *   stale   — long enough that the figure should not be trusted
 *   unknown — an account carried over from before creation dates were stored,
 *             with no history yet; silent rather than nagging about a date we
 *             genuinely do not have.
 */
export function accountFreshness(account, transactions = [], today = new Date()) {
  const touched = lastTouched(account, transactions)
  const since = touched || (account.createdAt ? parse(account.createdAt) : null)
  if (!since) return { level: 'unknown', days: null, at: null, everUsed: false }

  const days = Math.max(0, Math.round((startOfDay(today) - startOfDay(since)) / DAY))
  const level = days <= FRESH_DAYS ? 'fresh' : days <= STALE_DAYS ? 'aging' : 'stale'
  return { level, days, at: since, everUsed: Boolean(touched) }
}

/** Accounts whose figures have gone long enough to be worth re-checking. */
export function staleAccounts(accounts, transactions = [], today = new Date()) {
  return accounts.filter(a => accountFreshness(a, transactions, today).level === 'stale')
}

export function describeFreshness({ level, days, everUsed }) {
  if (level === 'unknown') return '尚無紀錄'
  if (days === 0) return everUsed ? '今天更新' : '今天建立'
  if (!everUsed) return `建立後 ${days} 天未使用`
  return `${days} 天前更新`
}
