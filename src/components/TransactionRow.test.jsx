import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { MoneyFormatContext, maskedMoney, visibleMoney, MASK } from '../lib/moneyDisplay'
import TransactionRow from './TransactionRow'

const state = {
  accounts: [{ id: 'a1', bank: '國泰', lastFour: '1234', currency: 'TWD', balance: 1000 }],
  cards: [],
  investments: [],
  transactions: [],
}
const tx = { id: 't1', type: 'expense', accountId: 'a1', amount: 280, category: '餐飲', currency: 'TWD', date: '2026-08-28T00:00:00.000Z' }

const renderWith = (money) => render(
  <MoneyFormatContext.Provider value={money}>
    <TransactionRow tx={tx} state={state} />
  </MoneyFormatContext.Provider>,
)

/**
 * The privacy toggle works by swapping the formatter behind every amount, so
 * this asserts a screen far away from the dashboard hero honours it too.
 */
describe('money masking', () => {
  afterEach(cleanup)

  it('prints the real amount when not masked', () => {
    renderWith(visibleMoney)
    expect(screen.getByText('-NT$280')).toBeTruthy()
  })

  it('masks the amount everywhere the formatter is used', () => {
    renderWith(maskedMoney)
    expect(screen.queryByText('-NT$280')).toBe(null)
    expect(screen.getByText(`-${MASK}`)).toBeTruthy()
  })

  it('leaves non-money text alone', () => {
    renderWith(maskedMoney)
    expect(screen.getByText('餐飲')).toBeTruthy()
  })
})
