import { useState } from 'react'

const IconCard = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
const IconEdit = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const IconTrash = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
const IconNote = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
const IconCheck = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

const emptyCard = { name: '', issuer: '', accountId: '', dueDay: '', annualFee: '', note: '', monthlyAmount: '' }

const CARD_BG = [
  'bg-gradient-to-br from-violet-100 to-indigo-200',
  'bg-gradient-to-br from-rose-100 to-pink-200',
  'bg-gradient-to-br from-emerald-100 to-teal-200',
  'bg-gradient-to-br from-amber-100 to-orange-200',
  'bg-gradient-to-br from-blue-100 to-cyan-200',
  'bg-gradient-to-br from-fuchsia-100 to-purple-200',
]

const CARD_ICON_BG = [
  'bg-violet-500', 'bg-rose-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-blue-500', 'bg-fuchsia-500',
]

export default function CardManager({ cards, accounts, onChange, onPayCard }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyCard)

  const startAdd = () => { setForm(emptyCard); setEditing('new') }
  const startEdit = (card) => {
    setForm({
      name: card.name, issuer: card.issuer, accountId: card.accountId || '',
      dueDay: card.dueDay || '', annualFee: card.annualFee || '', note: card.note || '',
      monthlyAmount: card.monthlyAmount || ''
    })
    setEditing(card.id)
  }
  const save = () => {
    if (!form.name.trim()) return
    if (editing === 'new') onChange([...cards, { ...form, id: genId() }])
    else onChange(cards.map(c => c.id === editing ? { ...c, ...form } : c))
    setEditing(null)
  }
  const remove = (id) => onChange(cards.filter(c => c.id !== id))
  const cancel = () => setEditing(null)

  const getAccountName = (accountId) => {
    const acc = accounts.find(a => a.id === accountId)
    if (!acc) return '未設定'
    return `${acc.bank}${acc.lastFour ? ` (${acc.lastFour})` : ''}`
  }

  const today = new Date()
  const currentDay = today.getDate()

  const isDueToday = (card) => {
    if (!card.dueDay) return false
    return parseInt(card.dueDay, 10) === currentDay
  }

  const isPaidThisMonth = (card) => {
    if (!card.lastPaidDate) return false
    const paid = new Date(card.lastPaidDate)
    return paid.getMonth() === today.getMonth() && paid.getFullYear() === today.getFullYear()
  }

  const totalMonthly = cards.reduce((s, c) => s + (Number(c.monthlyAmount) || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">信用卡</h1>
          <p className="text-gray-400 text-sm mt-1">
            管理你的所有信用卡及扣繳帳戶
            {cards.length > 0 && <span className="ml-2 text-gray-500 font-medium">/ 本月應繳合計 <span className="text-gray-800">${totalMonthly.toLocaleString()}</span></span>}
          </p>
        </div>
        <button onClick={startAdd} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition shadow-lg shadow-gray-900/10 cursor-pointer">
          + 新增信用卡
        </button>
      </div>

      {editing !== null && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={cancel}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border border-gray-100" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-5 text-gray-900">
              {editing === 'new' ? '新增信用卡' : '編輯信用卡'}
            </h3>
            <div className="space-y-4">
              <FormField label="卡片名稱 *" placeholder="例：LINE Pay 信用卡" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
              <FormField label="發卡銀行" placeholder="例：中國信託" value={form.issuer} onChange={v => setForm(f => ({ ...f, issuer: v }))} />
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1.5">繳款扣款帳戶</label>
                <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50" value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}>
                  <option value="">-- 請選擇帳戶 --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bank}{acc.lastFour ? ` (${acc.lastFour})` : ''}{acc.purpose ? ` - ${acc.purpose}` : ''} [${(Number(acc.balance) || 0).toLocaleString()}]
                    </option>
                  ))}
                </select>
                {accounts.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1.5">請先到「銀行帳戶」頁面新增帳戶</p>
                )}
              </div>
              <FormField label="本月應繳金額" placeholder="例：3500" value={form.monthlyAmount} type="number" onChange={v => setForm(f => ({ ...f, monthlyAmount: v }))} />
              <div className="flex gap-3">
                <FormField label="繳費日（每月幾號）" placeholder="例：15" value={form.dueDay} type="number" onChange={v => setForm(f => ({ ...f, dueDay: v }))} />
                <FormField label="年費" placeholder="例：0 或 1500" value={form.annualFee} onChange={v => setForm(f => ({ ...f, annualFee: v }))} />
              </div>
              <FormField label="備註" placeholder="例：海外消費 3% 回饋" value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition cursor-pointer">儲存</button>
              <button onClick={cancel} className="flex-1 bg-gray-50 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition cursor-pointer">取消</button>
            </div>
          </div>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="text-center py-20 text-gray-300">
          <IconCard className="w-12 h-12 mx-auto mb-4" />
          <p className="text-sm">還沒有信用卡，點擊上方「新增信用卡」開始吧</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => {
            const paid = isPaidThisMonth(card)
            const dueToday = isDueToday(card)
            const amt = Number(card.monthlyAmount) || 0
            return (
              <div key={card.id} className={`${CARD_BG[i % CARD_BG.length]} rounded-2xl p-5 border border-white/60 hover:shadow-md transition group relative overflow-hidden`}>
                <div className="absolute -right-8 -top-8 w-28 h-28 bg-white/10 rounded-full" />
                <div className="absolute -right-4 top-12 w-20 h-20 bg-white/10 rounded-full" />

                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`${CARD_ICON_BG[i % CARD_ICON_BG.length]} w-10 h-10 rounded-xl flex items-center justify-center text-white`}>
                      <IconCard className="w-5 h-5" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => startEdit(card)} className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer transition"><IconEdit /></button>
                      <button onClick={() => remove(card.id)} className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center text-gray-400 hover:text-red-500 cursor-pointer transition"><IconTrash /></button>
                    </div>
                  </div>

                  <div className="font-semibold text-gray-800">{card.name}</div>
                  {card.issuer && <div className="text-xs text-gray-500 mt-0.5">{card.issuer}</div>}

                  {/* Monthly amount */}
                  <div className="mt-3 mb-2">
                    <div className="text-xs text-gray-500">本月應繳</div>
                    <div className="text-xl font-bold text-gray-800">
                      {amt > 0 ? `$${amt.toLocaleString()}` : '--'}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400">扣款帳戶</span>
                      <span className="font-medium text-gray-700 bg-white/60 px-2 py-0.5 rounded-full">{getAccountName(card.accountId)}</span>
                    </div>
                    {card.dueDay && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">繳費日</span>
                        <span className={`font-medium ${dueToday ? 'text-red-600' : 'text-gray-700'}`}>
                          每月 {card.dueDay} 號{dueToday ? ' (今天)' : ''}
                        </span>
                      </div>
                    )}
                    {card.annualFee && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">年費</span>
                        <span className="font-medium text-gray-700">${card.annualFee}</span>
                      </div>
                    )}
                  </div>

                  {/* Pay button */}
                  {amt > 0 && card.accountId && (
                    <div className="mt-3">
                      {paid ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                          <IconCheck className="w-3.5 h-3.5" />
                          <span className="font-medium">本月已繳</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onPayCard(card.id)}
                          className={`w-full text-xs font-medium px-3 py-2 rounded-lg transition cursor-pointer ${
                            dueToday
                              ? 'bg-red-500 text-white hover:bg-red-600 shadow-md'
                              : 'bg-white/70 text-gray-700 hover:bg-white'
                          }`}
                        >
                          {dueToday ? '今天到期 - 立即扣款' : '手動繳費扣款'}
                        </button>
                      )}
                    </div>
                  )}

                  {card.note && (
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-2 bg-white/40 rounded-lg px-2 py-1">
                      <IconNote className="w-3 h-3 shrink-0" />
                      <span>{card.note}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FormField({ label, placeholder, value, onChange, maxLength, type }) {
  return (
    <div className="flex-1">
      <label className="text-sm font-medium text-gray-600 block mb-1.5">{label}</label>
      <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50" placeholder={placeholder} value={value} type={type || 'text'} maxLength={maxLength} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
