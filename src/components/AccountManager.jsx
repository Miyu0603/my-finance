import { useState } from 'react'

const IconBank = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21V12m0-9L3 8v1h18V8l-9-5zM3 21h18M5 12v9m14-9v9M9 12v9m6-9v9" /></svg>
const IconEdit = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const IconTrash = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
const IconTransfer = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>

const ICON_BG = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

const emptyAccount = { bank: '', lastFour: '', purpose: '', note: '', balance: '' }

export default function AccountManager({ accounts, onChange, onTransfer }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyAccount)

  const startAdd = () => { setForm(emptyAccount); setEditing('new') }
  const startEdit = (acc) => {
    setForm({ bank: acc.bank, lastFour: acc.lastFour, purpose: acc.purpose, note: acc.note || '', balance: acc.balance ?? '' })
    setEditing(acc.id)
  }
  const save = () => {
    if (!form.bank.trim()) return
    if (editing === 'new') onChange([...accounts, { ...form, id: genId() }])
    else onChange(accounts.map(a => a.id === editing ? { ...a, ...form } : a))
    setEditing(null)
  }
  const remove = (id) => onChange(accounts.filter(a => a.id !== id))
  const cancel = () => setEditing(null)

  const totalBalance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">銀行帳戶</h1>
          <p className="text-gray-400 text-sm mt-1">
            管理你的所有銀行帳戶
            {accounts.length > 0 && <span className="ml-2 text-gray-500 font-medium">/ 總餘額 <span className="text-gray-800">${totalBalance.toLocaleString()}</span></span>}
          </p>
        </div>
        <button onClick={startAdd} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition shadow-lg shadow-gray-900/10 cursor-pointer">
          + 新增帳戶
        </button>
      </div>

      {editing !== null && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={cancel}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border border-gray-100" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-5 text-gray-900">
              {editing === 'new' ? '新增銀行帳戶' : '編輯銀行帳戶'}
            </h3>
            <div className="space-y-4">
              <FormField label="銀行名稱 *" placeholder="例：中國信託、國泰世華" value={form.bank} onChange={v => setForm(f => ({ ...f, bank: v }))} />
              <FormField label="帳號末四碼" placeholder="例：1234" value={form.lastFour} maxLength={4} onChange={v => setForm(f => ({ ...f, lastFour: v.replace(/\D/g, '').slice(0, 4) }))} />
              <FormField label="帳戶餘額" placeholder="例：50000" value={form.balance} type="number" onChange={v => setForm(f => ({ ...f, balance: v }))} />
              <FormField label="用途" placeholder="例：薪轉戶、儲蓄、生活開銷" value={form.purpose} onChange={v => setForm(f => ({ ...f, purpose: v }))} />
              <FormField label="備註" placeholder="任何補充資訊" value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition cursor-pointer">儲存</button>
              <button onClick={cancel} className="flex-1 bg-gray-50 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition cursor-pointer">取消</button>
            </div>
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="text-center py-20 text-gray-300">
          <IconBank className="w-12 h-12 mx-auto mb-4" />
          <p className="text-sm">還沒有帳戶，點擊上方「新增帳戶」開始吧</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {accounts.map((acc, i) => (
            <div key={acc.id} className="flex items-center px-5 py-3.5 group hover:bg-gray-50/50 transition">
              <div className={`${ICON_BG[i % ICON_BG.length]} w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0`}>
                <IconBank className="w-4 h-4" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-800 text-sm">{acc.bank}</span>
                  {acc.lastFour && <span className="text-xs text-gray-400 font-mono">({acc.lastFour})</span>}
                  {acc.purpose && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{acc.purpose}</span>}
                </div>
                {acc.note && <p className="text-xs text-gray-400 mt-0.5 truncate">{acc.note}</p>}
              </div>
              <div className="font-bold text-gray-800 text-sm mx-4 whitespace-nowrap">
                ${(Number(acc.balance) || 0).toLocaleString()}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                {accounts.length >= 2 && (
                  <button onClick={() => onTransfer(acc.id)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-indigo-50 flex items-center justify-center text-gray-400 hover:text-indigo-500 cursor-pointer transition" title="轉帳"><IconTransfer /></button>
                )}
                <button onClick={() => startEdit(acc)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer transition" title="編輯"><IconEdit /></button>
                <button onClick={() => remove(acc.id)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 cursor-pointer transition" title="刪除"><IconTrash /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FormField({ label, placeholder, value, onChange, maxLength, type }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600 block mb-1.5">{label}</label>
      <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50" placeholder={placeholder} value={value} type={type || 'text'} maxLength={maxLength} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
