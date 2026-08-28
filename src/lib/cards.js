/** Credit-card cycle helpers. Kept out of components so they can be tested. */
import { num } from './money'

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

export function isPaidThisMonth(card, today = new Date()) {
  if (!card.lastPaidDate) return false
  const paid = new Date(card.lastPaidDate)
  if (Number.isNaN(paid.getTime())) return false
  return paid.getFullYear() === today.getFullYear() && paid.getMonth() === today.getMonth()
}

export const monthlyAmountOf = (card) => num(card.monthlyAmount)
