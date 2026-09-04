import { useState } from 'react'
import { num } from '../lib/money'
import { currencyOf } from '../lib/currency'
import { monthlyAmountOf, paidThisMonth, outstandingThisMonth } from '../lib/cards'
import { useMoneyFormat } from '../lib/moneyDisplay'
import { Modal, TextField, SelectField, GhostButton, ErrorNote } from './ui'
import { IconCard } from './icons'

const toDateInput = (date) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Reads the date input back as local midnight. `new Date('2026-09-04')` parses
 * as UTC, which lands on the previous day west of Greenwich and would file the
 * payment in the wrong month at the start of one.
 */
const fromDateInput = (value) => {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day, 12)
}

/**
 * One payment is one dated entry: the amount actually paid, when it was paid,
 * and which account it came out of. The card's linked account and current bill
 * are only defaults — a real statement rarely matches a figure typed in months
 * ago, and a one-off payment from another account should not re-bind the card.
 */
export default function CardPaymentModal({ card, accounts, transactions, onSubmit, onClose }) {
  const formatMoney = useMoneyFormat()
  const outstanding = outstandingThisMonth(card, transactions)
  const alreadyPaid = paidThisMonth(card, transactions)

  const [amount, setAmount] = useState(String(outstanding || monthlyAmountOf(card) || ''))
  const [accountId, setAccountId] = useState(card.accountId || '')
  const [paidOn, setPaidOn] = useState(toDateInput(new Date()))
  const [error, setError] = useState('')

  const account = accounts.find(a => a.id === accountId)
  const currency = account ? currencyOf(account) : 'TWD'
  const value = num(amount)

  const submit = () => {
    setError('')
    if (!account) return setError('請選擇扣款帳戶')
    if (!(value > 0)) return setError('請輸入有效金額')
    if (value > num(account.balance)) {
      return setError(`餘額不足（目前 ${formatMoney(account.balance, currency)}）`)
    }
    const date = fromDateInput(paidOn)
    if (!date) return setError('請選擇繳款日期')
    if (onSubmit(card.id, { amount: value, accountId, date: date.toISOString() })) onClose()
  }

  return (
    <Modal title={`繳款 ${card.name}`}
      subtitle={`本月帳單 ${formatMoney(monthlyAmountOf(card), currency)}`}
      onClose={onClose} tint="tint-emerald" icon={<IconCard className="w-5 h-5" />}
      footer={
        <>
          <button onClick={submit}
            className="flex-1 bg-solid text-on-solid py-3 rounded-tile text-sm font-bold hover:bg-solid-hover transition cursor-pointer">
            確認繳款
          </button>
          <GhostButton onClick={onClose}>取消</GhostButton>
        </>
      }>
      <div className="space-y-4">
        {alreadyPaid > 0 && (
          <div className="brick brick-plain rounded-tile px-4 py-3 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted">本月已繳</span>
              <span className="font-bold text-ink-2">{formatMoney(alreadyPaid, currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">尚欠</span>
              <span className="font-bold text-accent">{formatMoney(outstanding, currency)}</span>
            </div>
          </div>
        )}

        <TextField label={`本次繳款金額（${currency}）`} type="number" min="0" step="any"
          placeholder="輸入實際繳款金額" value={amount} onChange={setAmount}
          hint={alreadyPaid > 0 ? '預設帶入尚欠的金額' : '預設帶入本月帳單金額，可依實際繳款修改'} />

        <TextField label="繳款日期" type="date" value={paidOn} onChange={setPaidOn}
          hint="補記過去的繳款時，選當天實際扣款的日期" />

        <SelectField label="扣款帳戶" value={accountId} onChange={(v) => { setAccountId(v); setError('') }}
          hint={card.accountId ? '預設是卡片綁定的帳戶，這次改用別的不會動到綁定' : '這張卡尚未綁定帳戶'}>
          <option value="">-- 請選擇 --</option>
          {accounts.map(item => (
            <option key={item.id} value={item.id}>
              {item.bank}{item.lastFour ? ` ···${item.lastFour}` : ''} — {formatMoney(item.balance, currencyOf(item))}
            </option>
          ))}
        </SelectField>

        {account && value > 0 && (
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-muted">扣款後餘額</span>
            <span className="font-bold text-ink-2">{formatMoney(num(account.balance) - value, currency)}</span>
          </div>
        )}

        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  )
}
