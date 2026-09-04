/**
 * Every mutation that touches money lives here as a pure function
 * `(state, input) => state`, so the UI never does arithmetic on balances.
 *
 * Invariant: each apply* helper records a transaction carrying **everything
 * needed to undo it** (previous balances, the exact cost removed from a
 * holding, the previous paid date). revertTransaction() relies on that — it
 * never recomputes, so an undo can't drift from the original entry.
 */
import { genId } from './id'
import { num, round2 } from './money'
import { currencyOf } from './currency'

export const SCHEMA_VERSION = 1

export class LedgerError extends Error {}

const fail = (msg) => { throw new LedgerError(msg) }

export function emptyState() {
  return { version: SCHEMA_VERSION, accounts: [], cards: [], investments: [], transactions: [] }
}

export const marketCurrency = (market) => (market === 'us' ? 'USD' : 'TWD')

const findAccount = (state, id) => state.accounts.find(a => a.id === id)

function shiftBalance(accounts, id, delta) {
  return accounts.map(a => (a.id === id ? { ...a, balance: round2(num(a.balance) + delta) } : a))
}

function withTx(state, accounts, tx, extra = {}) {
  return {
    ...state,
    accounts,
    ...extra,
    transactions: [...state.transactions, { id: genId(), ...tx }],
  }
}

function requireFunds(account, needed) {
  if (num(account.balance) < needed) {
    fail(`「${account.bank}」餘額不足（需要 ${round2(needed).toLocaleString()}，目前 ${num(account.balance).toLocaleString()}）`)
  }
}

/* ---------- cash ---------- */

export function applyCashTx(state, { type, accountId, amount, category, note, date }) {
  const account = findAccount(state, accountId) || fail('找不到帳戶')
  const amt = round2(amount)
  if (!(amt > 0)) fail('金額必須大於 0')
  if (type !== 'income' && type !== 'expense') fail('未知的記帳類型')
  if (type === 'expense') requireFunds(account, amt)

  const accounts = shiftBalance(state.accounts, accountId, type === 'income' ? amt : -amt)
  return withTx(state, accounts, { type, accountId, amount: amt, category, note, date })
}

/* ---------- transfer ---------- */

export function applyTransfer(state, { fromId, toId, amount, date }) {
  const from = findAccount(state, fromId) || fail('找不到轉出帳戶')
  const to = findAccount(state, toId) || fail('找不到轉入帳戶')
  if (fromId === toId) fail('轉出與轉入帳戶不能相同')
  // Cross-currency movement must go through applyExchange, which needs a rate.
  if (currencyOf(from) !== currencyOf(to)) fail('不同幣別請使用「換匯」功能')
  const amt = round2(amount)
  if (!(amt > 0)) fail('金額必須大於 0')
  requireFunds(from, amt)

  let accounts = shiftBalance(state.accounts, fromId, -amt)
  accounts = shiftBalance(accounts, toId, amt)
  return withTx(state, accounts, { type: 'transfer', fromId, toId, amount: amt, currency: currencyOf(from), date })
}

/* ---------- exchange ---------- */

export function applyExchange(state, { fromId, toId, fromAmount, rate, fee = 0, date }) {
  const from = findAccount(state, fromId) || fail('找不到換出帳戶')
  const to = findAccount(state, toId) || fail('找不到換入帳戶')
  const fromCurrency = currencyOf(from)
  const toCurrency = currencyOf(to)
  if (fromCurrency === toCurrency) fail('換匯的兩個帳戶幣別必須不同')
  const amt = round2(fromAmount)
  const r = num(rate)
  const f = round2(fee)
  if (!(amt > 0)) fail('金額必須大於 0')
  if (!(r > 0)) fail('請輸入匯率')
  if (f < 0) fail('手續費不可為負數')
  if (f >= amt) fail('手續費不可大於等於換匯金額')
  requireFunds(from, amt)

  const toAmount = round2((amt - f) * r)
  let accounts = shiftBalance(state.accounts, fromId, -amt)
  accounts = shiftBalance(accounts, toId, toAmount)
  return withTx(state, accounts, {
    type: 'exchange', fromId, toId, fromAmount: amt, toAmount,
    rate: r, fee: f, fromCurrency, toCurrency, date,
  })
}

/* ---------- investments ---------- */

export function applyInvestTx(state, { type, stockId, accountId, shares, amount, fee = 0, date }) {
  const stock = state.investments.find(i => i.id === stockId) || fail('找不到持股')
  const account = findAccount(state, accountId) || fail('找不到帳戶')
  const required = marketCurrency(stock.market)
  if (currencyOf(account) !== required) fail(`${stock.market === 'us' ? '美股' : '台股'}只能使用 ${required} 帳戶`)

  const sh = num(shares)
  const amt = round2(amount)
  const f = round2(fee)
  if (!(sh > 0)) fail('股數必須大於 0')
  if (!(amt > 0)) fail('金額必須大於 0')
  if (f < 0) fail('手續費不可為負數')

  const heldShares = num(stock.shares)
  const heldCost = num(stock.cost)
  const isBuy = type === 'buy'
  if (!isBuy && sh > heldShares) fail(`持有股數不足（目前 ${heldShares.toLocaleString()} 股）`)

  const cashDelta = isBuy ? -(amt + f) : amt - f
  if (isBuy) requireFunds(account, amt + f)

  // Selling removes cost proportionally; the exact figure is stored on the tx
  // so an undo restores the original cost basis rather than recomputing it.
  const costRemoved = isBuy ? 0 : round2(heldShares > 0 ? (heldCost / heldShares) * sh : 0)
  const investments = state.investments.map(inv => {
    if (inv.id !== stockId) return inv
    return isBuy
      ? { ...inv, shares: round2(heldShares + sh), cost: round2(heldCost + amt) }
      : { ...inv, shares: round2(Math.max(0, heldShares - sh)), cost: round2(Math.max(0, heldCost - costRemoved)) }
  })

  const accounts = shiftBalance(state.accounts, accountId, cashDelta)
  return withTx(state, accounts, {
    type: isBuy ? 'invest-buy' : 'invest-sell',
    stockId, stockName: stock.name, market: stock.market, accountId,
    shares: sh, amount: amt, fee: f, costRemoved,
    currency: required, date,
  }, { investments })
}

/* ---------- credit cards ---------- */

/**
 * A payment is a dated entry against an account, not a flag on the card. The
 * account defaults to the card's linked one but can be overridden for a single
 * payment, and the date is the caller's — settling on the 15th and recording it
 * on the 18th should read as the 15th.
 */
export function applyCardPayment(state, { cardId, accountId, amount, date }) {
  const card = state.cards.find(c => c.id === cardId) || fail('找不到信用卡')
  const payFrom = accountId || card.accountId
  const account = findAccount(state, payFrom) || fail('請選擇扣款帳戶')
  const amt = round2(amount)
  if (!(amt > 0)) fail('繳款金額必須大於 0')
  requireFunds(account, amt)

  const accounts = shiftBalance(state.accounts, payFrom, -amt)
  return withTx(state, accounts, {
    type: 'card-payment', cardId, cardName: card.name, accountId: payFrom,
    amount: amt, currency: currencyOf(account), date,
  })
}

/* ---------- manual balance correction ---------- */

/** Editing a balance by hand must leave a trace, or the ledger silently drifts. */
export function applyBalanceAdjustment(state, { accountId, newBalance, date }) {
  const account = findAccount(state, accountId) || fail('找不到帳戶')
  const before = num(account.balance)
  const after = round2(newBalance)
  if (before === after) return state

  const accounts = state.accounts.map(a => (a.id === accountId ? { ...a, balance: after } : a))
  return withTx(state, accounts, {
    type: 'adjustment', accountId, before, after,
    amount: round2(after - before), currency: currencyOf(account), date,
  })
}

/* ---------- undo ---------- */

/**
 * Reverses a transaction's effects and drops it from history. Accounts or
 * holdings that no longer exist are skipped — the entry still disappears, so a
 * deleted account can't leave an un-removable row behind.
 */
export function revertTransaction(state, txId) {
  const tx = state.transactions.find(t => t.id === txId) || fail('找不到這筆紀錄')
  let accounts = state.accounts
  const cards = state.cards
  let investments = state.investments

  switch (tx.type) {
    case 'income':
      accounts = shiftBalance(accounts, tx.accountId, -num(tx.amount)); break
    case 'expense':
      accounts = shiftBalance(accounts, tx.accountId, num(tx.amount)); break
    case 'transfer':
      accounts = shiftBalance(accounts, tx.fromId, num(tx.amount))
      accounts = shiftBalance(accounts, tx.toId, -num(tx.amount)); break
    case 'exchange':
      accounts = shiftBalance(accounts, tx.fromId, num(tx.fromAmount))
      accounts = shiftBalance(accounts, tx.toId, -num(tx.toAmount)); break
    // Paid-state is derived from the log, so dropping the entry is the whole undo.
    case 'card-payment':
      accounts = shiftBalance(accounts, tx.accountId, num(tx.amount))
      break
    case 'invest-buy':
    case 'invest-sell': {
      const isBuy = tx.type === 'invest-buy'
      accounts = shiftBalance(accounts, tx.accountId, isBuy ? num(tx.amount) + num(tx.fee) : -(num(tx.amount) - num(tx.fee)))
      investments = investments.map(inv => {
        if (inv.id !== tx.stockId) return inv
        return isBuy
          ? { ...inv, shares: round2(num(inv.shares) - num(tx.shares)), cost: round2(Math.max(0, num(inv.cost) - num(tx.amount))) }
          : { ...inv, shares: round2(num(inv.shares) + num(tx.shares)), cost: round2(num(inv.cost) + num(tx.costRemoved)) }
      })
      break
    }
    case 'adjustment':
      accounts = accounts.map(a => (a.id === tx.accountId ? { ...a, balance: round2(num(tx.before)) } : a))
      break
    default:
      fail('這筆紀錄無法復原')
  }

  return { ...state, accounts, cards, investments, transactions: state.transactions.filter(t => t.id !== txId) }
}

/* ---------- entity removal ---------- */

/** Unlinks dependent cards so no card points at a dead account. History is kept. */
export function deleteAccount(state, accountId) {
  return {
    ...state,
    accounts: state.accounts.filter(a => a.id !== accountId),
    cards: state.cards.map(c => (c.accountId === accountId ? { ...c, accountId: '' } : c)),
  }
}
