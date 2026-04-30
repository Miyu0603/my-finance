import { useState } from 'react'

const IconTrendUp = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
const IconEdit = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const IconTrash = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
const IconPlus = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
const IconMinus = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>

const CARD_BG_TW = [
    'bg-gradient-to-br from-violet-100 to-purple-200',
    'bg-gradient-to-br from-blue-100 to-indigo-200',
    'bg-gradient-to-br from-emerald-100 to-teal-200',
    'bg-gradient-to-br from-amber-100 to-yellow-200',
    'bg-gradient-to-br from-rose-100 to-pink-200',
    'bg-gradient-to-br from-fuchsia-100 to-purple-200',
]
const CARD_BG_US = [
    'bg-gradient-to-br from-blue-100 to-cyan-200',
    'bg-gradient-to-br from-emerald-100 to-green-200',
    'bg-gradient-to-br from-amber-100 to-orange-200',
    'bg-gradient-to-br from-violet-100 to-indigo-200',
    'bg-gradient-to-br from-rose-100 to-red-200',
    'bg-gradient-to-br from-cyan-100 to-sky-200',
]
const ICON_BG_TW = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-fuchsia-500']
const ICON_BG_US = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-cyan-500']

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }

const emptyStock = { name: '', market: 'tw', shares: '', cost: '', note: '' }

export default function InvestmentManager({ investments, accounts, onChange, onInvestTx }) {
    const [market, setMarket] = useState('tw')
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState(emptyStock)
    const [txModal, setTxModal] = useState(null)

    const filtered = (investments || []).filter(inv => inv.market === market)
    const totalCost = filtered.reduce((s, inv) => s + (Number(inv.cost) || 0), 0)

    const startAdd = () => { setForm({ ...emptyStock, market }); setEditing('new') }
    const startEdit = (inv) => {
        setForm({ name: inv.name, market: inv.market, shares: inv.shares ?? '', cost: inv.cost ?? '', note: inv.note || '' })
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

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">投資</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {market === 'tw' ? '台股' : '美股'}持倉
                        {filtered.length > 0 && <span className="ml-2 text-gray-500 font-medium">/ 總成本 <span className="text-gray-800">${totalCost.toLocaleString()}</span></span>}
                    </p>
                </div>
                <button onClick={startAdd} className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition cursor-pointer shadow-lg shadow-gray-900/20">
                    <IconPlus className="w-4 h-4" />
                    新增
                </button>
            </div>

            {/* Market toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-5 max-w-xs">
                <button onClick={() => setMarket('tw')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${market === 'tw' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500'}`}>
                    台股
                </button>
                <button onClick={() => setMarket('us')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${market === 'us' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                    美股
                </button>
            </div>

            {/* Add/Edit form */}
            {editing && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 text-sm">{editing === 'new' ? '新增持股' : '編輯持股'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
                            placeholder="股票/ETF 名稱（如：0050、AAPL）" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
                            placeholder="總股數" type="number" step="any" value={form.shares} onChange={e => setForm({ ...form, shares: e.target.value })} />
                        <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
                            placeholder="總成本（實質投入金額）" type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
                        <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
                            placeholder="備註（選填）" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={save} className="bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition cursor-pointer">儲存</button>
                        <button onClick={cancel} className="bg-gray-100 text-gray-500 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition cursor-pointer">取消</button>
                    </div>
                </div>
            )}

            {/* Stock list */}
            {filtered.length === 0 && !editing ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <IconTrendUp className="w-8 h-8 text-violet-400" />
                    </div>
                    <p className="text-gray-400 text-sm">尚未新增{market === 'tw' ? '台股' : '美股'}持股</p>
                    <p className="text-gray-300 text-xs mt-1">點擊右上角「新增」開始追蹤</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((inv, i) => {
                        const bgArr = market === 'tw' ? CARD_BG_TW : CARD_BG_US
                        const iconArr = market === 'tw' ? ICON_BG_TW : ICON_BG_US
                        return (
                            <div key={inv.id} className={`${bgArr[i % bgArr.length]} rounded-2xl p-5 border border-white/60 relative group overflow-hidden`}>
                                <div className="absolute -bottom-4 -right-4 opacity-[0.06]">
                                    <IconTrendUp className="w-24 h-24" />
                                </div>
                                <div className="relative">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className={`${iconArr[i % iconArr.length]} w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm text-xs font-bold`}>
                                            {market === 'tw' ? '台' : 'US'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-800 text-sm truncate">{inv.name}</div>
                                            {inv.note && <div className="text-[11px] text-gray-500 truncate">{inv.note}</div>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div>
                                            <div className="text-lg font-bold text-gray-800">{Number(inv.shares || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                                            <div className="text-[10px] text-gray-400">總股數</div>
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-gray-800">${(Number(inv.cost) || 0).toLocaleString()}</div>
                                            <div className="text-[10px] text-gray-400">總成本</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setTxModal({ stock: inv, type: 'buy' })} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 px-2.5 py-1.5 rounded-lg bg-white/60 hover:bg-white/80 transition cursor-pointer">
                                            <IconPlus className="w-3.5 h-3.5" /> 買進
                                        </button>
                                        <button onClick={() => setTxModal({ stock: inv, type: 'sell' })} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg bg-white/60 hover:bg-white/80 transition cursor-pointer">
                                            <IconMinus className="w-3.5 h-3.5" /> 賣出
                                        </button>
                                        <button onClick={() => startEdit(inv)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg bg-white/60 hover:bg-white/80 transition cursor-pointer">
                                            <IconEdit className="w-3.5 h-3.5" /> 編輯
                                        </button>
                                        <button onClick={() => remove(inv.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg bg-white/60 hover:bg-white/80 transition cursor-pointer">
                                            <IconTrash className="w-3.5 h-3.5" /> 刪除
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Buy/Sell Modal */}
            {txModal && (
                <InvestTxModal
                    stock={txModal.stock}
                    type={txModal.type}
                    accounts={accounts}
                    onSubmit={(data) => { onInvestTx(data); setTxModal(null) }}
                    onClose={() => setTxModal(null)}
                />
            )}
        </div>
    )
}

function InvestTxModal({ stock, type, accounts, onSubmit, onClose }) {
    const [accountId, setAccountId] = useState('')
    const [shares, setShares] = useState('')
    const [amount, setAmount] = useState('')
    const [fee, setFee] = useState('')
    const [error, setError] = useState('')

    const isBuy = type === 'buy'
    const title = isBuy ? `買進 ${stock.name}` : `賣出 ${stock.name}`

    // Filter accounts: 台股 → TWD only, 美股 → USD only
    const requiredCurrency = stock.market === 'tw' ? 'TWD' : 'USD'
    const filteredAccounts = accounts.filter(a => (a.currency || 'TWD') === requiredCurrency)

    const handleSubmit = () => {
        setError('')
        const amt = Number(amount)
        const sh = Number(shares)
        const f = Number(fee) || 0
        if (!sh || sh <= 0) return setError('請輸入有效股數')
        if (!amt || amt <= 0) return setError('請輸入有效金額')
        if (!accountId) return setError('請選擇帳戶')
        if (f < 0) return setError('手續費不可為負數')

        if (isBuy) {
            const acc = filteredAccounts.find(a => a.id === accountId)
            const totalDeduct = amt + f
            if (acc && (Number(acc.balance) || 0) < totalDeduct) {
                return setError(`帳戶餘額不足（需 $${totalDeduct.toLocaleString()}，目前 $${(Number(acc.balance) || 0).toLocaleString()}）`)
            }
        } else {
            if (sh > (Number(stock.shares) || 0)) {
                return setError(`持有股數不足（目前 ${Number(stock.shares || 0).toLocaleString()} 股）`)
            }
        }

        onSubmit({
            type,
            stockId: stock.id,
            stockName: stock.name,
            accountId,
            shares: sh,
            amount: amt,
            fee: f,
            date: new Date().toISOString(),
        })
    }

    const CURRENCY_SYMBOL = { TWD: 'NT$', USD: '$' }
    const sym = CURRENCY_SYMBOL[requiredCurrency] || '$'
    const getLabel = (acc) => `${acc.bank}${acc.lastFour ? ` (${acc.lastFour})` : ''} - ${sym}${(Number(acc.balance) || 0).toLocaleString()}`

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border border-gray-100" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBuy ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {isBuy ? <IconPlus className="w-5 h-5" /> : <IconMinus className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                        <p className="text-xs text-gray-400">
                            目前持有 {Number(stock.shares || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })} 股
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1.5">
                            {isBuy ? '扣款帳戶' : '入帳帳戶'}（{requiredCurrency} 帳戶）
                        </label>
                        <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
                            value={accountId} onChange={e => setAccountId(e.target.value)}>
                            <option value="">-- 請選擇 --</option>
                            {filteredAccounts.map(acc => <option key={acc.id} value={acc.id}>{getLabel(acc)}</option>)}
                        </select>
                        {filteredAccounts.length === 0 && <p className="text-[11px] text-amber-500 mt-1">尚無 {requiredCurrency} 帳戶，請先新增</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1.5">股數</label>
                        <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
                            type="number" step="any" min="0" placeholder="輸入股數" value={shares} onChange={e => setShares(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1.5">
                            {isBuy ? '扣款金額' : '入帳金額（含損益）'}
                        </label>
                        <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
                            type="number" min="0" placeholder={isBuy ? '實際扣款金額' : '實際入帳金額'} value={amount} onChange={e => setAmount(e.target.value)} />
                        {!isBuy && <p className="text-[11px] text-gray-400 mt-1">賣出金額可自行填寫，反映實際損益</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1.5">手續費（直接扣除）</label>
                        <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
                            type="number" min="0" placeholder="0" value={fee} onChange={e => setFee(e.target.value)} />
                        {isBuy && Number(amount) > 0 && Number(fee) > 0 && <p className="text-[11px] text-gray-400 mt-1">實際扣款：{sym}{(Number(amount) + Number(fee)).toLocaleString()}</p>}
                        {!isBuy && Number(amount) > 0 && Number(fee) > 0 && <p className="text-[11px] text-gray-400 mt-1">實際入帳：{sym}{(Number(amount) - Number(fee)).toLocaleString()}</p>}
                    </div>
                    {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={handleSubmit}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer text-white ${isBuy ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                        確認{isBuy ? '買進' : '賣出'}
                    </button>
                    <button onClick={onClose} className="flex-1 bg-gray-50 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition cursor-pointer">取消</button>
                </div>
            </div>
        </div>
    )
}
