import { num } from '../lib/money'
import { currencyOf } from '../lib/currency'
import { IconTransfer, IconExchange, IconCheck, IconTrendUp, IconDollar, IconEdit } from './icons'

/**
 * Turns a stored transaction into something renderable. Entries written before
 * a field existed (or pointing at a deleted account) still have to render, so
 * every lookup has a fallback.
 *
 * `formatMoney` is a parameter rather than an import because this is a plain
 * function: its callers pass the one from useMoneyFormat(), so the privacy
 * toggle reaches transaction rows too.
 */
export function describeTransaction(tx, state, formatMoney) {
  const accountName = (id) => {
    const account = state.accounts.find(a => a.id === id)
    return account ? `${account.bank}${account.lastFour ? ` ···${account.lastFour}` : ''}` : '已刪除帳戶'
  }
  const currencyFor = (id) => tx.currency || currencyOf(state.accounts.find(a => a.id === id))

  switch (tx.type) {
    case 'income':
    case 'expense': {
      const isIncome = tx.type === 'income'
      return {
        icon: <IconDollar className="w-3.5 h-3.5" />,
        tint: isIncome ? 'tint-emerald' : 'tint-red',
        title: `${tx.category || '未分類'}${tx.note ? ` · ${tx.note}` : ''}`,
        detail: accountName(tx.accountId),
        amount: `${isIncome ? '+' : '-'}${formatMoney(tx.amount, currencyFor(tx.accountId))}`,
        amountClass: isIncome ? 'text-emerald-500' : 'text-red-500',
      }
    }
    case 'transfer':
      return {
        icon: <IconTransfer className="w-3.5 h-3.5" />,
        tint: 'tint-indigo',
        title: `${accountName(tx.fromId)} → ${accountName(tx.toId)}`,
        detail: '轉帳',
        amount: formatMoney(tx.amount, currencyFor(tx.fromId)),
        amountClass: 'text-ink-2',
      }
    case 'exchange':
      return {
        icon: <IconExchange className="w-3.5 h-3.5" />,
        tint: 'tint-amber',
        title: `換匯 ${tx.fromCurrency} → ${tx.toCurrency}`,
        detail: `匯率 ${tx.rate} · 換入 ${formatMoney(tx.toAmount, tx.toCurrency)}`,
        amount: `-${formatMoney(tx.fromAmount, tx.fromCurrency)}`,
        amountClass: 'text-ink-2',
      }
    case 'card-payment':
      return {
        icon: <IconCheck className="w-3.5 h-3.5" />,
        tint: 'tint-emerald',
        title: `${tx.cardName || state.cards.find(c => c.id === tx.cardId)?.name || '信用卡'} 繳款`,
        detail: accountName(tx.accountId),
        amount: `-${formatMoney(tx.amount, currencyFor(tx.accountId))}`,
        amountClass: 'text-red-500',
      }
    case 'invest-buy':
    case 'invest-sell': {
      const isBuy = tx.type === 'invest-buy'
      const settled = isBuy ? num(tx.amount) + num(tx.fee) : num(tx.amount) - num(tx.fee)
      return {
        icon: <IconTrendUp className="w-3.5 h-3.5" />,
        tint: isBuy ? 'tint-emerald' : 'tint-red',
        title: `${isBuy ? '買進' : '賣出'} ${tx.stockName || '持股'} ${num(tx.shares).toLocaleString(undefined, { maximumFractionDigits: 4 })} 股`,
        detail: `${accountName(tx.accountId)}${num(tx.fee) > 0 ? ` · 手續費 ${formatMoney(tx.fee, currencyFor(tx.accountId))}` : ''}`,
        amount: `${isBuy ? '-' : '+'}${formatMoney(settled, currencyFor(tx.accountId))}`,
        amountClass: isBuy ? 'text-red-500' : 'text-emerald-500',
      }
    }
    case 'adjustment': {
      const delta = num(tx.amount)
      return {
        icon: <IconEdit className="w-3.5 h-3.5" />,
        tint: 'tint-neutral',
        title: '餘額校正',
        detail: `${accountName(tx.accountId)} · ${formatMoney(tx.before, currencyFor(tx.accountId))} → ${formatMoney(tx.after, currencyFor(tx.accountId))}`,
        amount: `${delta >= 0 ? '+' : '-'}${formatMoney(Math.abs(delta), currencyFor(tx.accountId))}`,
        amountClass: delta >= 0 ? 'text-emerald-500' : 'text-red-500',
      }
    }
    default:
      return {
        icon: <IconDollar className="w-3.5 h-3.5" />,
        tint: 'tint-neutral',
        title: '未知紀錄',
        detail: tx.type,
        amount: '',
        amountClass: 'text-ink-2',
      }
  }
}
