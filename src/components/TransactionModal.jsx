import { useState } from 'react'
import { num } from '../lib/money'
import { currencyOf } from '../lib/currency'
import { useMoneyFormat } from '../lib/moneyDisplay'
import { Modal, TextField, SelectField, GhostButton, ErrorNote, Field } from './ui'
import { IconMinus, IconPlus } from './icons'

const EXPENSE_CATEGORIES = ['餐飲', '交通', '購物', '娛樂', '生活', '醫療', '教育', '其他']
const INCOME_CATEGORIES = ['薪水', '獎金', '投資收入', '副業', '退款', '其他']

/**
 * `account` is optional: opened from an account row it is preselected, opened
 * from the dashboard's quick action the user picks one here. Recording an
 * expense is the most frequent action in the app, so it should not require
 * navigating to a list first.
 */
export default function TransactionModal({ account, accounts = [], onSubmit, onClose }) {
  const formatMoney = useMoneyFormat()
  const [type, setType] = useState('expense')
  const [accountId, setAccountId] = useState(account?.id || '')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const isExpense = type === 'expense'
  const target = account || accounts.find(a => a.id === accountId) || null
  const currency = target ? currencyOf(target) : null
  const categories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const switchType = (next) => { setType(next); setCategory(''); setError('') }

  const submit = () => {
    setError('')
    if (!target) return setError('請選擇帳戶')
    const value = num(amount)
    if (!(value > 0)) return setError('請輸入有效金額')
    if (!category) return setError('請選擇分類')
    if (isExpense && value > num(target.balance)) {
      return setError(`餘額不足（目前 ${formatMoney(target.balance, currency)}）`)
    }
    const ok = onSubmit({
      type, amount: value, category, note: note.trim(),
      accountId: target.id, date: new Date().toISOString(),
    })
    if (ok) onClose()
  }

  const subtitle = target
    ? `${target.bank}${target.lastFour ? ` ···${target.lastFour}` : ''} · ${formatMoney(target.balance, currency)}`
    : '選一個帳戶開始記帳'

  return (
    <Modal title={`記錄${isExpense ? '支出' : '收入'}`} subtitle={subtitle}
      onClose={onClose} tint={isExpense ? 'tint-red' : 'tint-emerald'}
      icon={isExpense ? <IconMinus className="w-5 h-5" /> : <IconPlus className="w-5 h-5" />}
      footer={
        <>
          <button onClick={submit}
            className={`flex-1 py-2.5 rounded-pill text-sm font-medium transition cursor-pointer text-white ${isExpense ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
            確認記錄
          </button>
          <GhostButton onClick={onClose}>取消</GhostButton>
        </>
      }>
      <div role="tablist" aria-label="記帳類型" className="flex bg-surface-3 rounded-pill p-1 mb-4">
        {[['expense', '支出'], ['income', '收入']].map(([value, text]) => (
          <button key={value} role="tab" aria-selected={type === value} onClick={() => switchType(value)}
            className={`flex-1 py-2 rounded-pill text-sm font-medium transition cursor-pointer ${
              type === value
                ? `bg-surface shadow-sm ${value === 'expense' ? 'text-red-500' : 'text-emerald-500'}`
                : 'text-ink-4'}`}>
            {text}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {!account && (
          <SelectField label="帳戶" value={accountId} onChange={(v) => { setAccountId(v); setError('') }}
            hint={accounts.length === 0 ? '尚無帳戶，請先到「銀行帳戶」新增' : undefined}>
            <option value="">-- 請選擇 --</option>
            {accounts.map(item => (
              <option key={item.id} value={item.id}>
                {item.bank}{item.lastFour ? ` ···${item.lastFour}` : ''} — {formatMoney(item.balance, currencyOf(item))}
              </option>
            ))}
          </SelectField>
        )}

        <TextField label={currency ? `金額（${currency}）` : '金額'} type="number" min="0" step="any"
          placeholder="請輸入金額" value={amount} onChange={setAmount} />

        <Field label="分類">
          {() => (
            <div className="flex flex-wrap gap-2">
              {categories.map(item => (
                <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item}
                  className={`px-3.5 py-1.5 rounded-pill text-sm font-medium transition cursor-pointer ${
                    category === item
                      ? `text-white ${isExpense ? 'bg-red-500' : 'bg-emerald-500'}`
                      : 'bg-surface-3 text-ink-4 hover:bg-surface-4'}`}>
                  {item}
                </button>
              ))}
            </div>
          )}
        </Field>

        <TextField label="備註（選填）" placeholder="例：午餐、加油" value={note} onChange={setNote} />

        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  )
}
