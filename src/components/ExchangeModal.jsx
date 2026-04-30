import { useState } from 'react'

const IconExchange = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m-4 6H4m0 0l4 4m-4-4l4-4" /></svg>

const CURRENCY_SYMBOL = { TWD: 'NT$', USD: '$', JPY: '¥', EUR: '€', GBP: '£', AUD: 'A$', CNY: '¥', HKD: 'HK$', SGD: 'S$', KRW: '₩' }

export default function ExchangeModal({ account, accounts, onExchange, onClose }) {
  const sameBankAccounts = accounts.filter(a => a.bank === account.bank && a.id !== account.id)
  const [toId, setToId] = useState(sameBankAccounts[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState('')
  const [fee, setFee] = useState('')
  const [error, setError] = useState('')

  const fromCur = account.currency || 'TWD'
  const toAcc = sameBankAccounts.find(a => a.id === toId)
  const toCur = toAcc ? (toAcc.currency || 'TWD') : ''

  const fromSym = CURRENCY_SYMBOL[fromCur] || fromCur
  const toSym = toCur ? (CURRENCY_SYMBOL[toCur] || toCur) : ''

  const calcReceived = () => {
    const amt = Number(amount) || 0
    const r = Number(rate) || 0
    const f = Number(fee) || 0
    if (amt <= 0 || r <= 0) return 0
    return (amt - f) * r
  }

  const handleSubmit = () => {
    setError('')
    const amt = Number(amount)
    const r = Number(rate)
    const f = Number(fee) || 0

    if (!toId) return setError('請選擇目標帳戶')
    if (!amt || amt <= 0) return setError('請輸入有效金額')
    if (!r || r <= 0) return setError('請輸入匯率')
    if (f < 0) return setError('手續費不可為負數')
    if (f >= amt) return setError('手續費不可大於等於換匯金額')

    const fromBalance = Number(account.balance) || 0
    if (amt > fromBalance) {
      return setError(`餘額不足（目前 ${fromSym}${fromBalance.toLocaleString()}）`)
    }

    const received = (amt - f) * r

    onExchange({
      fromId: account.id,
      toId,
      fromAmount: amt,
      toAmount: Math.round(received * 100) / 100,
      rate: r,
      fee: f,
      fromCurrency: fromCur,
      toCurrency: toCur,
      date: new Date().toISOString(),
    })
    onClose()
  }

  const getLabel = (acc) => {
    const cur = acc.currency || 'TWD'
    const sym = CURRENCY_SYMBOL[cur] || cur
    return `${cur} ${acc.lastFour ? `(···${acc.lastFour})` : ''} - ${sym}${(Number(acc.balance) || 0).toLocaleString()}`
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <IconExchange className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">換匯</h3>
            <p className="text-xs text-gray-400">{account.bank} · {fromCur} → {toCur || '...'}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* From account (fixed) */}
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <div className="text-[11px] text-gray-400 mb-0.5">從</div>
            <div className="text-sm font-medium text-gray-700">{fromCur} {account.lastFour ? `(···${account.lastFour})` : ''}</div>
            <div className="text-xs text-gray-400">餘額 {fromSym}{(Number(account.balance) || 0).toLocaleString()}</div>
          </div>

          {/* To account */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1.5">換入帳戶</label>
            <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
              value={toId} onChange={e => setToId(e.target.value)}>
              {sameBankAccounts.length === 0 && <option value="">-- 無可換匯帳戶 --</option>}
              {sameBankAccounts.map(acc => <option key={acc.id} value={acc.id}>{getLabel(acc)}</option>)}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1.5">換匯金額（{fromCur}）</label>
            <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
              type="number" min="0" placeholder={`要換出多少 ${fromCur}`} value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          {/* Exchange rate */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1.5">匯率（1 {fromCur} = ? {toCur}）</label>
            <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
              type="number" step="any" min="0" placeholder="例：0.032（台幣換美金）" value={rate} onChange={e => setRate(e.target.value)} />
          </div>

          {/* Fee */}
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1.5">手續費（{fromCur}，直接扣除）</label>
            <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
              type="number" min="0" placeholder="0" value={fee} onChange={e => setFee(e.target.value)} />
          </div>

          {/* Preview */}
          {Number(amount) > 0 && Number(rate) > 0 && (
            <div className="bg-emerald-50 rounded-xl px-4 py-3 text-sm">
              <div className="text-emerald-700 font-medium">預計換入：{toSym}{calcReceived().toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              {Number(fee) > 0 && <div className="text-emerald-600/70 text-xs mt-0.5">扣除手續費 {fromSym}{Number(fee).toLocaleString()} 後以匯率 {rate} 換算</div>}
            </div>
          )}

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleSubmit} className="flex-1 bg-amber-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-amber-600 transition cursor-pointer">確認換匯</button>
          <button onClick={onClose} className="flex-1 bg-gray-50 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition cursor-pointer">取消</button>
        </div>
      </div>
    </div>
  )
}
