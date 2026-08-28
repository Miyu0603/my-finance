import { describe, it, expect } from 'vitest'
import {
  emptyState, applyCashTx, applyTransfer, applyExchange, applyInvestTx,
  applyCardPayment, applyBalanceAdjustment, revertTransaction, deleteAccount, LedgerError,
} from './ledger'
import { normalizeState } from './storage'

const DATE = '2026-08-28T00:00:00.000Z'

function seed() {
  return {
    ...emptyState(),
    accounts: [
      { id: 'twd', bank: '國泰', currency: 'TWD', balance: 100000, lastFour: '1111' },
      { id: 'twd2', bank: '玉山', currency: 'TWD', balance: 5000, lastFour: '2222' },
      { id: 'usd', bank: '國泰', currency: 'USD', balance: 1000, lastFour: '3333' },
    ],
    cards: [{ id: 'card', name: '樂天卡', accountId: 'twd', monthlyAmount: '3500', lastPaidDate: null }],
    investments: [
      { id: 's-tw', name: '0050', market: 'tw', shares: 1000, cost: 50000 },
      { id: 's-us', name: 'VOO', market: 'us', shares: 10, cost: 5000 },
    ],
  }
}

const balanceOf = (state, id) => state.accounts.find(a => a.id === id).balance
const lastTx = (state) => state.transactions[state.transactions.length - 1]
const stockOf = (state, id) => state.investments.find(i => i.id === id)

describe('applyCashTx', () => {
  it('records an expense and deducts it', () => {
    const next = applyCashTx(seed(), { type: 'expense', accountId: 'twd', amount: 250, category: '餐飲', date: DATE })
    expect(balanceOf(next, 'twd')).toBe(99750)
    expect(lastTx(next)).toMatchObject({ type: 'expense', amount: 250, category: '餐飲' })
  })

  it('records income', () => {
    const next = applyCashTx(seed(), { type: 'income', accountId: 'twd', amount: 60000, category: '薪水', date: DATE })
    expect(balanceOf(next, 'twd')).toBe(160000)
  })

  it('rejects an expense larger than the balance', () => {
    expect(() => applyCashTx(seed(), { type: 'expense', accountId: 'twd2', amount: 5001, category: '購物', date: DATE }))
      .toThrow(LedgerError)
  })

  it('rejects zero and negative amounts', () => {
    expect(() => applyCashTx(seed(), { type: 'expense', accountId: 'twd', amount: 0, date: DATE })).toThrow(LedgerError)
    expect(() => applyCashTx(seed(), { type: 'expense', accountId: 'twd', amount: -5, date: DATE })).toThrow(LedgerError)
  })

  it('rejects an unknown account', () => {
    expect(() => applyCashTx(seed(), { type: 'expense', accountId: 'nope', amount: 10, date: DATE })).toThrow(LedgerError)
  })
})

describe('applyTransfer', () => {
  it('moves money between two same-currency accounts', () => {
    const next = applyTransfer(seed(), { fromId: 'twd', toId: 'twd2', amount: 1000, date: DATE })
    expect(balanceOf(next, 'twd')).toBe(99000)
    expect(balanceOf(next, 'twd2')).toBe(6000)
  })

  it('refuses to move money across currencies', () => {
    expect(() => applyTransfer(seed(), { fromId: 'usd', toId: 'twd', amount: 100, date: DATE }))
      .toThrow('不同幣別請使用「換匯」功能')
  })

  it('refuses a transfer to the same account', () => {
    expect(() => applyTransfer(seed(), { fromId: 'twd', toId: 'twd', amount: 1, date: DATE })).toThrow(LedgerError)
  })

  it('refuses to overdraw', () => {
    expect(() => applyTransfer(seed(), { fromId: 'twd2', toId: 'twd', amount: 5001, date: DATE })).toThrow(LedgerError)
  })
})

describe('applyExchange', () => {
  it('converts at the given rate after deducting the fee', () => {
    const next = applyExchange(seed(), { fromId: 'twd', toId: 'usd', fromAmount: 32000, rate: 0.03125, fee: 100, date: DATE })
    expect(balanceOf(next, 'twd')).toBe(68000)
    expect(balanceOf(next, 'usd')).toBe(1996.88) // (32000 - 100) * 0.03125 = 996.875 -> 996.88
    expect(lastTx(next)).toMatchObject({ fromCurrency: 'TWD', toCurrency: 'USD' })
  })

  it('refuses a same-currency exchange', () => {
    expect(() => applyExchange(seed(), { fromId: 'twd', toId: 'twd2', fromAmount: 100, rate: 1, date: DATE }))
      .toThrow('換匯的兩個帳戶幣別必須不同')
  })

  it('refuses a fee that swallows the whole amount', () => {
    expect(() => applyExchange(seed(), { fromId: 'twd', toId: 'usd', fromAmount: 100, rate: 0.03, fee: 100, date: DATE }))
      .toThrow(LedgerError)
  })

  it('refuses a missing rate', () => {
    expect(() => applyExchange(seed(), { fromId: 'twd', toId: 'usd', fromAmount: 100, rate: 0, date: DATE })).toThrow(LedgerError)
  })
})

describe('applyInvestTx', () => {
  it('buys: deducts amount plus fee and raises shares and cost', () => {
    const next = applyInvestTx(seed(), { type: 'buy', stockId: 's-tw', accountId: 'twd', shares: 100, amount: 5000, fee: 20, date: DATE })
    expect(balanceOf(next, 'twd')).toBe(94980)
    expect(stockOf(next, 's-tw')).toMatchObject({ shares: 1100, cost: 55000 })
  })

  it('sells: credits amount minus fee and lowers cost proportionally', () => {
    const next = applyInvestTx(seed(), { type: 'sell', stockId: 's-tw', accountId: 'twd', shares: 500, amount: 30000, fee: 50, date: DATE })
    expect(balanceOf(next, 'twd')).toBe(129950)
    expect(stockOf(next, 's-tw')).toMatchObject({ shares: 500, cost: 25000 })
    expect(lastTx(next).costRemoved).toBe(25000)
  })

  it('refuses a US holding paid from a TWD account', () => {
    expect(() => applyInvestTx(seed(), { type: 'buy', stockId: 's-us', accountId: 'twd', shares: 1, amount: 500, date: DATE }))
      .toThrow('美股只能使用 USD 帳戶')
  })

  it('refuses selling more shares than held', () => {
    expect(() => applyInvestTx(seed(), { type: 'sell', stockId: 's-tw', accountId: 'twd', shares: 1001, amount: 100, date: DATE }))
      .toThrow(LedgerError)
  })

  it('refuses a buy the account cannot fund once the fee is added', () => {
    expect(() => applyInvestTx(seed(), { type: 'buy', stockId: 's-tw', accountId: 'twd2', shares: 1, amount: 5000, fee: 1, date: DATE }))
      .toThrow(LedgerError)
  })
})

describe('applyCardPayment', () => {
  it('deducts the amount passed in, not the stored monthly amount', () => {
    const next = applyCardPayment(seed(), { cardId: 'card', amount: 4210, date: DATE })
    expect(balanceOf(next, 'twd')).toBe(95790)
    expect(next.cards[0].lastPaidDate).toBe(DATE)
    expect(lastTx(next).prevLastPaidDate).toBe(null)
  })

  it('refuses an unlinked card', () => {
    const state = seed()
    state.cards[0].accountId = ''
    expect(() => applyCardPayment(state, { cardId: 'card', amount: 100, date: DATE })).toThrow(LedgerError)
  })
})

describe('applyBalanceAdjustment', () => {
  it('records a trace when a balance is edited by hand', () => {
    const next = applyBalanceAdjustment(seed(), { accountId: 'twd', newBalance: 98000, date: DATE })
    expect(balanceOf(next, 'twd')).toBe(98000)
    expect(lastTx(next)).toMatchObject({ type: 'adjustment', before: 100000, after: 98000, amount: -2000 })
  })

  it('records nothing when the balance did not change', () => {
    const next = applyBalanceAdjustment(seed(), { accountId: 'twd', newBalance: 100000, date: DATE })
    expect(next.transactions).toHaveLength(0)
  })
})

describe('revertTransaction', () => {
  const roundTrip = (state, apply) => {
    const after = apply(state)
    const back = revertTransaction(after, lastTx(after).id)
    return { after, back }
  }

  it('undoes an expense', () => {
    const { back } = roundTrip(seed(), s => applyCashTx(s, { type: 'expense', accountId: 'twd', amount: 250, date: DATE }))
    expect(balanceOf(back, 'twd')).toBe(100000)
    expect(back.transactions).toHaveLength(0)
  })

  it('undoes a transfer on both sides', () => {
    const { back } = roundTrip(seed(), s => applyTransfer(s, { fromId: 'twd', toId: 'twd2', amount: 1000, date: DATE }))
    expect(balanceOf(back, 'twd')).toBe(100000)
    expect(balanceOf(back, 'twd2')).toBe(5000)
  })

  it('undoes an exchange without drifting', () => {
    const { back } = roundTrip(seed(), s => applyExchange(s, { fromId: 'twd', toId: 'usd', fromAmount: 32000, rate: 0.03125, fee: 100, date: DATE }))
    expect(balanceOf(back, 'twd')).toBe(100000)
    expect(balanceOf(back, 'usd')).toBe(1000)
  })

  it('undoes a sell and restores the exact cost basis', () => {
    const { back } = roundTrip(seed(), s => applyInvestTx(s, { type: 'sell', stockId: 's-tw', accountId: 'twd', shares: 333, amount: 20000, fee: 30, date: DATE }))
    expect(stockOf(back, 's-tw')).toMatchObject({ shares: 1000, cost: 50000 })
    expect(balanceOf(back, 'twd')).toBe(100000)
  })

  it('undoes a card payment and restores the previous paid date', () => {
    const state = seed()
    state.cards[0].lastPaidDate = '2026-07-15T00:00:00.000Z'
    const { back } = roundTrip(state, s => applyCardPayment(s, { cardId: 'card', amount: 3500, date: DATE }))
    expect(balanceOf(back, 'twd')).toBe(100000)
    expect(back.cards[0].lastPaidDate).toBe('2026-07-15T00:00:00.000Z')
  })

  it('undoes a manual adjustment', () => {
    const { back } = roundTrip(seed(), s => applyBalanceAdjustment(s, { accountId: 'twd', newBalance: 1, date: DATE }))
    expect(balanceOf(back, 'twd')).toBe(100000)
  })

  it('still removes an entry whose account was deleted', () => {
    const after = applyCashTx(seed(), { type: 'expense', accountId: 'twd2', amount: 100, date: DATE })
    const pruned = deleteAccount(after, 'twd2')
    const back = revertTransaction(pruned, lastTx(pruned).id)
    expect(back.transactions).toHaveLength(0)
  })
})

describe('deleteAccount', () => {
  it('unlinks cards that pointed at it and keeps history', () => {
    const after = applyCashTx(seed(), { type: 'expense', accountId: 'twd', amount: 100, date: DATE })
    const next = deleteAccount(after, 'twd')
    expect(next.accounts).toHaveLength(2)
    expect(next.cards[0].accountId).toBe('')
    expect(next.transactions).toHaveLength(1)
  })
})

describe('normalizeState', () => {
  it('returns an empty ledger for junk input', () => {
    expect(normalizeState(null).accounts).toEqual([])
    expect(normalizeState('nope').transactions).toEqual([])
  })

  it('coerces balances saved as strings into numbers', () => {
    const state = normalizeState({ accounts: [{ id: 'a', bank: '國泰', balance: '50000' }] })
    expect(state.accounts[0].balance).toBe(50000)
    expect(state.accounts[0].currency).toBe('TWD')
  })

  it('trims bank names so they group correctly', () => {
    const state = normalizeState({ accounts: [{ id: 'a', bank: ' 國泰 ', balance: 0 }] })
    expect(state.accounts[0].bank).toBe('國泰')
  })

  it('drops card links to accounts that no longer exist', () => {
    const state = normalizeState({ accounts: [], cards: [{ id: 'c', name: '卡', accountId: 'gone' }] })
    expect(state.cards[0].accountId).toBe('')
  })

  it('stamps the current schema version', () => {
    expect(normalizeState({}).version).toBe(1)
  })
})
