import { describe, it, expect } from 'vitest'
import {
  touchesAccount, lastTouched, accountFreshness, staleAccounts, describeFreshness,
} from './freshness'

const on = (y, m, d) => new Date(y, m - 1, d)
const iso = (y, m, d) => on(y, m, d).toISOString()
const TODAY = on(2026, 9, 4)

const account = { id: 'a1', bank: '國泰' }

describe('touchesAccount', () => {
  it('matches the single-account entry types', () => {
    for (const type of ['income', 'expense', 'card-payment', 'invest-buy', 'invest-sell', 'adjustment']) {
      expect(touchesAccount({ type, accountId: 'a1' }, 'a1')).toBe(true)
      expect(touchesAccount({ type, accountId: 'other' }, 'a1')).toBe(false)
    }
  })

  it('matches both sides of a transfer and an exchange', () => {
    for (const type of ['transfer', 'exchange']) {
      expect(touchesAccount({ type, fromId: 'a1', toId: 'b' }, 'a1')).toBe(true)
      expect(touchesAccount({ type, fromId: 'b', toId: 'a1' }, 'a1')).toBe(true)
      expect(touchesAccount({ type, fromId: 'b', toId: 'c' }, 'a1')).toBe(false)
    }
  })

  it('ignores entry types it does not know', () => {
    expect(touchesAccount({ type: 'mystery', accountId: 'a1' }, 'a1')).toBe(false)
  })
})

describe('lastTouched', () => {
  it('returns the most recent date, not the last in the array', () => {
    const log = [
      { type: 'expense', accountId: 'a1', date: iso(2026, 9, 1) },
      { type: 'expense', accountId: 'a1', date: iso(2026, 8, 1) },
    ]
    expect(lastTouched(account, log)).toEqual(on(2026, 9, 1))
  })

  it('ignores other accounts and unparseable dates', () => {
    const log = [
      { type: 'expense', accountId: 'other', date: iso(2026, 9, 3) },
      { type: 'expense', accountId: 'a1', date: 'nope' },
      { type: 'expense', accountId: 'a1', date: iso(2026, 8, 20) },
    ]
    expect(lastTouched(account, log)).toEqual(on(2026, 8, 20))
  })

  it('is null with no history', () => {
    expect(lastTouched(account, [])).toBe(null)
  })
})

describe('accountFreshness', () => {
  const touchedOn = (y, m, d) => [{ type: 'expense', accountId: 'a1', date: iso(y, m, d) }]

  it('is fresh inside two weeks', () => {
    expect(accountFreshness(account, touchedOn(2026, 9, 4), TODAY)).toMatchObject({ level: 'fresh', days: 0 })
    expect(accountFreshness(account, touchedOn(2026, 8, 22), TODAY)).toMatchObject({ level: 'fresh', days: 13 })
  })

  it('ages between two weeks and a month', () => {
    expect(accountFreshness(account, touchedOn(2026, 8, 20), TODAY)).toMatchObject({ level: 'aging', days: 15 })
    expect(accountFreshness(account, touchedOn(2026, 8, 5), TODAY)).toMatchObject({ level: 'aging', days: 30 })
  })

  it('goes stale past a month', () => {
    expect(accountFreshness(account, touchedOn(2026, 8, 4), TODAY)).toMatchObject({ level: 'stale', days: 31 })
  })

  it('falls back to the creation date when the account was never used', () => {
    const fresh = accountFreshness({ id: 'a1', createdAt: iso(2026, 9, 2) }, [], TODAY)
    expect(fresh).toMatchObject({ level: 'fresh', days: 2, everUsed: false })

    const forgotten = accountFreshness({ id: 'a1', createdAt: iso(2026, 6, 1) }, [], TODAY)
    expect(forgotten.level).toBe('stale')
  })

  /** Accounts predating creation dates must not be nagged about a date we lack. */
  it('stays silent for legacy accounts with no history and no creation date', () => {
    expect(accountFreshness({ id: 'a1' }, [], TODAY)).toMatchObject({ level: 'unknown', days: null })
  })

  it('prefers real activity over the creation date', () => {
    const acc = { id: 'a1', createdAt: iso(2026, 1, 1) }
    expect(accountFreshness(acc, touchedOn(2026, 9, 3), TODAY)).toMatchObject({ level: 'fresh', everUsed: true })
  })
})

describe('staleAccounts', () => {
  it('lists only the ones past the threshold', () => {
    const accounts = [
      { id: 'a1' }, // unknown — never counted
      { id: 'a2', createdAt: iso(2026, 9, 1) },
      { id: 'a3', createdAt: iso(2026, 1, 1) },
    ]
    expect(staleAccounts(accounts, [], TODAY).map(a => a.id)).toEqual(['a3'])
  })
})

describe('describeFreshness', () => {
  it('reads differently for a used account and an unused one', () => {
    expect(describeFreshness({ level: 'fresh', days: 0, everUsed: true })).toBe('今天更新')
    expect(describeFreshness({ level: 'fresh', days: 0, everUsed: false })).toBe('今天建立')
    expect(describeFreshness({ level: 'stale', days: 40, everUsed: true })).toBe('40 天前更新')
    expect(describeFreshness({ level: 'stale', days: 40, everUsed: false })).toBe('建立後 40 天未使用')
    expect(describeFreshness({ level: 'unknown', days: null })).toBe('尚無紀錄')
  })
})
