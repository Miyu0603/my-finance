/**
 * The privacy toggle. Every amount in the app is rendered through
 * formatMoney(), so swapping that one function out masks all of them at once —
 * a new screen cannot forget to honour the setting, because it has no other way
 * to print money.
 *
 * Components read the formatter with useMoneyFormat() instead of importing
 * formatMoney directly; the call sites themselves stay unchanged.
 */
import { createContext, useContext } from 'react'
import { formatMoney } from './currency'

export const MASK = '*****'

export const maskMoney = () => MASK

export const MoneyFormatContext = createContext({ formatMoney, hidden: false })

export const visibleMoney = { formatMoney, hidden: false }
export const maskedMoney = { formatMoney: maskMoney, hidden: true }

/** The formatter. Call sites keep calling it `formatMoney`. */
export function useMoneyFormat() {
  return useContext(MoneyFormatContext).formatMoney
}

/**
 * Whether amounts are masked. Only needed where several amounts would otherwise
 * collapse into repeated, identical "*****" rows.
 */
export function useMoneyHidden() {
  return useContext(MoneyFormatContext).hidden
}
