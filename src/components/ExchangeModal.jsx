import { useState } from 'react'
import { num, round2 } from '../lib/money'
import { currencyOf } from '../lib/currency'
import { useMoneyFormat } from '../lib/moneyDisplay'
import { Modal, TextField, SelectField, GhostButton, ErrorNote } from './ui'
import { IconExchange } from './icons'

export default function ExchangeModal({ account, accounts, onExchange, onClose }) {
  const formatMoney = useMoneyFormat()
  const fromCurrency = currencyOf(account)
  // Same-bank, different-currency only — a same-currency "exchange" is a transfer.
  const targets = accounts.filter(a =>
    a.bank === account.bank && a.id !== account.id && currencyOf(a) !== fromCurrency)

  const [toId, setToId] = useState(targets[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState('')
  const [fee, setFee] = useState('')
  const [error, setError] = useState('')

  const toAccount = targets.find(a => a.id === toId)
  const toCurrency = toAccount ? currencyOf(toAccount) : ''

  const value = num(amount)
  const rateValue = num(rate)
  const feeValue = num(fee)
  const received = value > 0 && rateValue > 0 ? round2((value - feeValue) * rateValue) : 0

  const submit = () => {
    setError('')
    if (!toId) return setError('請選擇換入帳戶')
    if (!(value > 0)) return setError('請輸入有效金額')
    if (!(rateValue > 0)) return setError('請輸入匯率')
    if (feeValue < 0) return setError('手續費不可為負數')
    if (feeValue >= value) return setError('手續費不可大於等於換匯金額')
    if (value > num(account.balance)) {
      return setError(`餘額不足（目前 ${formatMoney(account.balance, fromCurrency)}）`)
    }
    const ok = onExchange({ fromId: account.id, toId, fromAmount: value, rate: rateValue, fee: feeValue })
    if (ok) onClose()
  }

  return (
    <Modal title="換匯" subtitle={`${account.bank} · ${fromCurrency} → ${toCurrency || '…'}`}
      onClose={onClose} tint="tint-amber" icon={<IconExchange className="w-5 h-5" />}
      footer={
        <>
          <button onClick={submit} disabled={targets.length === 0}
            className="flex-1 bg-amber-500 text-white py-3 rounded-pill text-sm font-medium hover:bg-amber-600 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            確認換匯
          </button>
          <GhostButton onClick={onClose}>取消</GhostButton>
        </>
      }>
      <div className="space-y-4">
        <div className="bg-surface-2 rounded-tile px-4 py-3">
          <div className="text-[11px] text-muted mb-0.5">從</div>
          <div className="text-sm font-medium text-ink-3">
            {fromCurrency}{account.lastFour ? ` ···${account.lastFour}` : ''}
          </div>
          <div className="text-xs text-muted">餘額 {formatMoney(account.balance, fromCurrency)}</div>
        </div>

        <SelectField label="換入帳戶" value={toId} onChange={setToId}
          hint={targets.length === 0 ? `「${account.bank}」沒有其他幣別的帳戶，請先新增一個` : undefined}>
          {targets.length === 0 && <option value="">-- 無可換匯帳戶 --</option>}
          {targets.map(target => (
            <option key={target.id} value={target.id}>
              {currencyOf(target)}{target.lastFour ? ` ···${target.lastFour}` : ''} — {formatMoney(target.balance, currencyOf(target))}
            </option>
          ))}
        </SelectField>

        <TextField label={`換匯金額（${fromCurrency}）`} type="number" min="0" step="any"
          placeholder={`要換出多少 ${fromCurrency}`} value={amount} onChange={setAmount} />

        <TextField label={`匯率（1 ${fromCurrency} = ? ${toCurrency || '?'}）`} type="number" min="0" step="any"
          placeholder="例：0.032（台幣換美金）" value={rate} onChange={setRate} />

        <TextField label={`手續費（${fromCurrency}，換匯前先扣除）`} type="number" min="0" step="any"
          placeholder="0" value={fee} onChange={setFee} />

        {received > 0 && (
          <div className="tint-emerald rounded-tile px-4 py-3 text-sm">
            <div className="font-medium">預計換入：{formatMoney(received, toCurrency)}</div>
            {feeValue > 0 && (
              <div className="text-xs opacity-80 mt-0.5">
                扣除手續費 {formatMoney(feeValue, fromCurrency)} 後以匯率 {rateValue} 換算
              </div>
            )}
          </div>
        )}

        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  )
}
