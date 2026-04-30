import { useState } from 'react'

const IconTrendUp = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
const IconEdit = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const IconTrash = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>

const INVEST_BG = [
    'bg-gradient-to-br from-violet-100 to-purple-200',
    'bg-gradient-to-br from-emerald-100 to-teal-200',
    'bg-gradient-to-br from-amber-100 to-yellow-200',
    'bg-gradient-to-br from-blue-100 to-cyan-200',
    'bg-gradient-to-br from-rose-100 to-pink-200',
    'bg-gradient-to-br from-fuchsia-100 to-purple-200',
]

const ICON_BG = ['bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-rose-500', 'bg-fuchsia-500']

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }

const emptyInvestment = { name: '', note: '', balance: '' }

export default function InvestmentManager({ investments, onChange }) {
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(emptyInvestment)

    const startAdd = () => { setForm(emptyInvestment); setEditing('new') }
    const startEdit = (inv) => {
        setForm({ name: inv.name, note: inv.note || '', balance: inv.balance ?? '' })
        setEditing(inv.id)
    }
    const save = () => {
        if (!form.name.trim()) return
        if (editing === 'new') onChange([...investments, { ...form, id: genId() }])
        else onChange(investments.map(a => a.id === editing ? { ...a, ...form } : a))
        setEditing(null)
    }
    const remove = (id) => onChange(investments.filter(a => a.id !== id))
    const cancel = () => setEditing(null)

    const totalBalance = investments.reduce((s, a) => s + (Number(a.balance) || 0), 0)

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">投資帳戶</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        管理你的投資資產
                        {investments.length > 0 && <span className="ml-2 text-gray-500 font-medium">/ 總資產 <span className="text-gray-800">${totalBalance.toLocaleString()}</span></span>}
                    </p>
                </div>
                <button onClick={startAdd} className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition cursor-pointer shadow-lg shadow-gray-900/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    新增
                </button>
            </div>

            {editing && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 text-sm">{editing === 'new' ? '新增投資帳戶' : '編輯投資帳戶'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
                            placeholder="帳戶名稱（如：台股證券、美股、基金）" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
                            placeholder="目前市值" type="number" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} />
                        <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50 md:col-span-2"
                            placeholder="備註（選填，如：定期定額 0050）" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={save} className="bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition cursor-pointer">儲存</button>
                        <button onClick={cancel} className="bg-gray-100 text-gray-500 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition cursor-pointer">取消</button>
                    </div>
                </div>
            )}

            {investments.length === 0 && !editing ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <IconTrendUp className="w-8 h-8 text-violet-400" />
                    </div>
                    <p className="text-gray-400 text-sm">尚未新增投資帳戶</p>
                    <p className="text-gray-300 text-xs mt-1">點擊右上角「新增」開始追蹤你的投資</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {investments.map((inv, i) => (
                        <div key={inv.id} className={`${INVEST_BG[i % INVEST_BG.length]} rounded-2xl p-5 border border-white/60 relative group overflow-hidden`}>
                            <div className="absolute -bottom-4 -right-4 opacity-[0.06]">
                                <IconTrendUp className="w-24 h-24" />
                            </div>
                            <div className="relative">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <div className={`${ICON_BG[i % ICON_BG.length]} w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm`}>
                                        <IconTrendUp className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-800 text-sm truncate">{inv.name}</div>
                                        {inv.note && <div className="text-[11px] text-gray-500 truncate">{inv.note}</div>}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-gray-800 mb-1">${(Number(inv.balance) || 0).toLocaleString()}</div>
                                <div className="text-[11px] text-gray-400">目前市值</div>
                                <div className="flex gap-1.5 mt-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(inv)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg bg-white/60 hover:bg-white/80 transition cursor-pointer">
                                        <IconEdit className="w-3.5 h-3.5" /> 編輯
                                    </button>
                                    <button onClick={() => remove(inv.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg bg-white/60 hover:bg-white/80 transition cursor-pointer">
                                        <IconTrash className="w-3.5 h-3.5" /> 刪除
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
