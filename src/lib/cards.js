/** Credit-card cycle helpers. Kept out of components so they can be tested. */
import { num, round2 } from './money'

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()

/**
 * The next occurrence of `dueDay`, today included. Short months clamp to their
 * last day, so a "31st" card is due on 28 Feb rather than silently rolling into
 * March. Returns null when the card has no usable due day.
 */
export function nextDueDate(dueDay, today = new Date()) {
  const day = parseInt(dueDay, 10)
  if (!Number.isInteger(day) || day < 1 || day > 31) return null

  const at = (year, month) => new Date(year, month, Math.min(day, daysInMonth(year, month)))
  const thisMonth = at(today.getFullYear(), today.getMonth())
  return thisMonth >= startOfDay(today) ? thisMonth : at(today.getFullYear(), today.getMonth() + 1)
}

const MS_PER_DAY = 86400000

export function daysUntilDue(dueDay, today = new Date()) {
  const due = nextDueDate(dueDay, today)
  if (!due) return null
  return Math.round((due - startOfDay(today)) / MS_PER_DAY)
}

export const monthlyAmountOf = (card) => num(card.monthlyAmount)

const inSameMonth = (iso, today) => {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return false
  return at.getFullYear() === today.getFullYear() && at.getMonth() === today.getMonth()
}

/**
 * How much of this card's bill has been settled this calendar month.
 *
 * Derived from the transaction log rather than a flag on the card: a boolean
 * cannot tell a 3,000 instalment from a full 8,420 settlement, and the old
 * `lastPaidDate` made a partial payment hide the remaining balance entirely.
 * Deriving it also means undoing a payment needs no bookkeeping — remove the
 * entry and the figure follows.
 */
export function paidThisMonth(card, transactions = [], today = new Date()) {
  return round2(transactions.reduce((sum, tx) => (
    tx.type === 'card-payment' && tx.cardId === card.id && inSameMonth(tx.date, today)
      ? sum + num(tx.amount)
      : sum
  ), 0))
}

/** Bill minus what has already gone out this month; never negative. */
export function outstandingThisMonth(card, transactions = [], today = new Date()) {
  return round2(Math.max(0, monthlyAmountOf(card) - paidThisMonth(card, transactions, today)))
}

/** Fully settled only when nothing is left, not merely when something was paid. */
export function isPaidThisMonth(card, transactions = [], today = new Date()) {
  const bill = monthlyAmountOf(card)
  if (bill <= 0) return false
  return outstandingThisMonth(card, transactions, today) === 0
}

/** Something has been paid, but the bill is not cleared. */
export function isPartiallyPaid(card, transactions = [], today = new Date()) {
  const paid = paidThisMonth(card, transactions, today)
  return paid > 0 && outstandingThisMonth(card, transactions, today) > 0
}
