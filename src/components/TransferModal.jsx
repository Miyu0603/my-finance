import { useState } from 'react'
import { num } from '../lib/money'
import { currencyOf, formatMoney } from '../lib/currency'
import { Modal, TextField, SelectField, PrimaryButton, GhostButton, ErrorNote } from './ui'
import { IconTransfer, IconArrowDown } from './icons'

export default function TransferModal({ accounts, defaultFromId, onTransfer, onClose }) {
  const [fromId, setFromId] = useState(defaultFromId || '')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const fromAccount = accounts.find(a => a.id === fromId)
  const currency = fromAccount ? currencyOf(fromAccount) : null

  /*
   * Only same-currency accounts are offered. Moving between currencies needs a
   * rate, so it belongs to 換匯 — otherwise a USD 1,000 transfer would land as
   * TWD 1,000.
   */
  const targets = fromAccount
    ? accounts.filter(a => a.id !== fromId && currencyOf(a) === currency)
    : []

  const pickFrom = (id) => {
    setFromId(id)
    setToId('')
    setError('')
  }

  const submit = () => {
    setError('')
    if (!fromId) return setError('請選擇轉出帳戶')
    if (!toId) return setError('請選擇轉入帳戶')
    const value = num(amount)
    if (!(value > 0)) return setError('請輸入有效金額')
    if (value > num(fromAccount.balance)) {
      return setError(`餘額不足（目前 ${formatMoney(fromAccount.balance, currency)}）`)
    }
    if (onTransfer({ fromId, toId, amount: value })) onClose()
  }

  const label = (account) =>
    `${account.bank}${account.lastFour ? ` ···${account.lastFour}` : ''} — ${formatMoney(account.balance, currencyOf(account))}`

  return (
    <Modal title="帳戶轉帳" subtitle="同幣別帳戶之間移動，餘額不變的只是位置"
      onClose={onClose} tint="tint-indigo" icon={<IconTransfer className="w-5 h-5" />}
      footer={<><PrimaryButton onClick={submit}>確認轉帳</PrimaryButton><GhostButton onClick={onClose}>取消</GhostButton></>}>
      <div className="space-y-4">
        <SelectField label="轉出帳戶" value={fromId} onChange={pickFrom}>
          <option value="">-- 請選擇 --</option>
          {accounts.map(account => <option key={account.id} value={account.id}>{label(account)}</option>)}
        </SelectField>

        <div className="flex justify-center" aria-hidden="true">
          <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-muted">
            <IconArrowDown className="w-4 h-4" />
          </div>
        </div>

        <SelectField label={currency ? `轉入帳戶（${currency}）` : '轉入帳戶'} value={toId} onChange={setToId}
          disabled={!fromAccount}
          hint={fromAccount && targets.length === 0 ? `沒有其他 ${currency} 帳戶可以轉入，跨幣別請改用「換匯」` : undefined}>
          <option value="">-- 請選擇 --</option>
          {targets.map(account => <option key={account.id} value={account.id}>{label(account)}</option>)}
        </SelectField>

        <TextField label={currency ? `轉帳金額（${currency}）` : '轉帳金額'} type="number" min="0" step="any"
          placeholder="請輸入金額" value={amount} onChange={setAmount} />

        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  )
}
