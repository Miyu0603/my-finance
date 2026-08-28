import { num } from './money'

export const CURRENCIES = ['TWD', 'USD', 'JPY', 'EUR', 'GBP', 'AUD', 'CNY', 'HKD', 'SGD', 'KRW']

export const CURRENCY_SYMBOL = {
  TWD: 'NT$', USD: '$', JPY: '¥', EUR: '€', GBP: '£',
  AUD: 'A$', CNY: '¥', HKD: 'HK$', SGD: 'S$', KRW: '₩',
}

/** Accounts saved before the multi-currency feature have no `currency` field. */
export function currencyOf(account) {
  return account?.currency || 'TWD'
}

export function symbolOf(currency) {
  return CURRENCY_SYMBOL[currency] || currency
}

export function formatMoney(amount, currency) {
  const n = num(amount)
  const decimals = Number.isInteger(n) ? 0 : 2
  return `${symbolOf(currency)}${n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

/**
 * Totals must never mix currencies — returns [{ currency, total }] sorted with
 * the largest holding first, so callers are forced to render them separately.
 */
export function sumByCurrency(items, getCurrency, getAmount) {
  const totals = new Map()
  items.forEach(item => {
    const cur = getCurrency(item)
    totals.set(cur, (totals.get(cur) || 0) + num(getAmount(item)))
  })
  return [...totals.entries()]
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => b.total - a.total)
}
