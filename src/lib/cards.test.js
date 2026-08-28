import { describe, it, expect } from 'vitest'
import { nextDueDate, daysUntilDue, isPaidThisMonth } from './cards'

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

describe('isPaidThisMonth', () => {
  const today = on(2026, 8, 28)

  it('is false without a payment', () => {
    expect(isPaidThisMonth({}, today)).toBe(false)
  })

  it('is true for a payment made this calendar month', () => {
    expect(isPaidThisMonth({ lastPaidDate: on(2026, 8, 2).toISOString() }, today)).toBe(true)
  })

  it('is false for last month and for the same month a year ago', () => {
    expect(isPaidThisMonth({ lastPaidDate: on(2026, 7, 30).toISOString() }, today)).toBe(false)
    expect(isPaidThisMonth({ lastPaidDate: on(2025, 8, 30).toISOString() }, today)).toBe(false)
  })

  it('ignores an unparseable date', () => {
    expect(isPaidThisMonth({ lastPaidDate: 'not-a-date' }, today)).toBe(false)
  })
})
