import { describe, it, expect } from 'vitest'
import { nextDueDate, daysUntilDue, isPaidThisMonth, isPartiallyPaid, paidThisMonth, outstandingThisMonth } from './cards'

const on = (y, m, d) => new Date(y, m - 1, d)

describe('nextDueDate', () => {
  it('stays in this month when the day is still ahead', () => {
    expect(nextDueDate('15', on(2026, 8, 3))).toEqual(on(2026, 8, 15))
  })

  it('counts today as due', () => {
    expect(nextDueDate('15', on(2026, 8, 15))).toEqual(on(2026, 8, 15))
  })

  it('rolls into next month once the day has passed', () => {
    expect(nextDueDate('5', on(2026, 8, 20))).toEqual(on(2026, 9, 5))
  })

  it('rolls across the year boundary', () => {
    expect(nextDueDate('5', on(2026, 12, 20))).toEqual(on(2027, 1, 5))
  })

  it('clamps a 31st due day to the last day of a short month', () => {
    expect(nextDueDate('31', on(2026, 2, 1))).toEqual(on(2026, 2, 28))
    expect(nextDueDate('31', on(2026, 4, 1))).toEqual(on(2026, 4, 30))
  })

  it('returns null for a missing or nonsense due day', () => {
    expect(nextDueDate('', on(2026, 8, 1))).toBe(null)
    expect(nextDueDate('40', on(2026, 8, 1))).toBe(null)
  })
})

describe('daysUntilDue', () => {
  it('is 0 on the due day', () => {
    expect(daysUntilDue('15', on(2026, 8, 15))).toBe(0)
  })

  it('counts real calendar days, not a fixed 30', () => {
    // 20 Feb -> 5 Mar is 13 days; the old "+30" fallback returned 15.
    expect(daysUntilDue('5', on(2026, 2, 20))).toBe(13)
  })

  it('handles a month-end rollover', () => {
    expect(daysUntilDue('1', on(2026, 1, 31))).toBe(1)
  })
})

describe('payment state derived from the log', () => {
  const today = on(2026, 8, 28)
  const card = { id: 'c1', monthlyAmount: '8420' }
  const payment = (amount, date) => ({ type: 'card-payment', cardId: 'c1', amount, date: date.toISOString() })

  it('is unpaid with no payments', () => {
    expect(paidThisMonth(card, [], today)).toBe(0)
    expect(outstandingThisMonth(card, [], today)).toBe(8420)
    expect(isPaidThisMonth(card, [], today)).toBe(false)
  })

  /**
   * The regression this replaced a boolean for: paying 3,000 of an 8,420 bill
   * used to mark the card settled and drop the remaining 5,420 off the
   * dashboard entirely.
   */
  it('keeps the remainder visible after a partial payment', () => {
    const log = [payment(3000, on(2026, 8, 20))]
    expect(paidThisMonth(card, log, today)).toBe(3000)
    expect(outstandingThisMonth(card, log, today)).toBe(5420)
    expect(isPaidThisMonth(card, log, today)).toBe(false)
    expect(isPartiallyPaid(card, log, today)).toBe(true)
  })

  it('adds up several payments in the same month', () => {
    const log = [payment(3000, on(2026, 8, 10)), payment(5420, on(2026, 8, 25))]
    expect(paidThisMonth(card, log, today)).toBe(8420)
    expect(outstandingThisMonth(card, log, today)).toBe(0)
    expect(isPaidThisMonth(card, log, today)).toBe(true)
    expect(isPartiallyPaid(card, log, today)).toBe(false)
  })

  it('ignores payments from other months and other cards', () => {
    const log = [
      payment(8420, on(2026, 7, 15)),
      { type: 'card-payment', cardId: 'other', amount: 8420, date: on(2026, 8, 15).toISOString() },
      { type: 'expense', accountId: 'a1', amount: 8420, date: on(2026, 8, 15).toISOString() },
    ]
    expect(paidThisMonth(card, log, today)).toBe(0)
    expect(isPaidThisMonth(card, log, today)).toBe(false)
  })

  it('never reports a negative remainder when overpaid', () => {
    const log = [payment(9000, on(2026, 8, 20))]
    expect(outstandingThisMonth(card, log, today)).toBe(0)
    expect(isPaidThisMonth(card, log, today)).toBe(true)
  })

  it('is not "paid" when there is no bill to pay', () => {
    expect(isPaidThisMonth({ id: 'c1', monthlyAmount: '' }, [], today)).toBe(false)
  })

  it('ignores an unparseable date', () => {
    expect(paidThisMonth(card, [{ type: 'card-payment', cardId: 'c1', amount: 100, date: 'nope' }], today)).toBe(0)
  })
})
