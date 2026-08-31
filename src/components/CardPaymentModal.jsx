import { useState } from 'react'
import { num } from '../lib/money'
import { currencyOf } from '../lib/currency'
import { monthlyAmountOf } from '../lib/cards'
import { useMoneyFormat } from '../lib/moneyDisplay'
import { Modal, TextField, GhostButton, ErrorNote } from './ui'
import { IconCard } from './icons'

/**
 * The real statement rarely matches the amount typed into the card months ago,
 * so the stored monthly amount is only a default here — the user confirms the
 * figure that is actually being deducted.
 */
export default function CardPaymentModal({ card, accounts, onSubmit, onClose }) {
  const formatMoney = useMoneyFormat()
  const [amount, setAmount] = useState(String(monthlyAmountOf(card) || ''))
  const [error, setError] = useState('')

  const account = accounts.find(a => a.id === card.accountId)
  const currency = account ? currencyOf(account) : 'TWD'

  const submit = () => {
    setError('')
    if (!account) return setError('這張卡尚未綁定扣款帳戶，請先到「信用卡」設定')
    const value = num(amount)
    if (!(value > 0)) return setError('請輸入有效金額')
    if (value > num(account.balance)) {
      return setError(`餘額不足（目前 ${formatMoney(account.balance, currency)}）`)
    }
    if (onSubmit(card.id, value)) onClose()
  }

  return (
    <Modal title={`繳款 ${card.name}`}
      subtitle={account ? `從 ${account.bank}${account.lastFour ? ` ···${account.lastFour}` : ''} 扣款` : '尚未綁定扣款帳戶'}
      onClose={onClose} tint="tint-emerald" icon={<IconCard className="w-5 h-5" />}
      footer={
        <>
          <button onClick={submit} disabled={!account}
            className="flex-1 bg-emerald-500 text-white py-3 rounded-pill text-sm font-medium hover:bg-emerald-600 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            確認扣款
          </button>
          <GhostButton onClick={onClose}>取消</GhostButton>
        </>
      }>
      <div className="space-y-4">
        {account && (
          <div className="bg-surface-2 rounded-tile px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted">扣款後餘額</span>
            <span className="text-sm font-medium text-ink-3">
              {formatMoney(num(account.balance) - num(amount), currency)}
            </span>
          </div>
        )}

        <TextField label={`本次繳款金額（${currency}）`} type="number" min="0" step="any"
          placeholder="輸入實際帳單金額" value={amount} onChange={setAmount}
          hint="預設帶入卡片設定的應繳金額，可依實際帳單修改" />

        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  )
}
