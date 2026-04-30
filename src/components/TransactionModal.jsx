import { useState } from 'react'

const EXPENSE_CATEGORIES = ['餐飲', '交通', '購物', '娛樂', '生活', '醫療', '教育', '其他']
const INCOME_CATEGORIES = ['薪水', '獎金', '投資收入', '副業', '退款', '其他']

const IconMinus = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
const IconPlus = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>

export default function TransactionModal({ account, onSubmit, onClose }) {
    const [type, setType] = useState('expense')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('')
    const [note, setNote] = useState('')
    const [error, setError] = useState('')

    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

    const handleSubmit = () => {
        setError('')
        const amt = Number(amount)
        if (!amt || amt <= 0) return setError('請輸入有效金額')
        if (!category) return setError('請選擇分類')
        if (type === 'expense' && (Number(account.balance) || 0) < amt) {
            return setError(`餘額不足（目前 $${(Number(account.balance) || 0).toLocaleString()}）`)
        }
        onSubmit({ type, amount: amt, category, note: note.trim(), accountId: account.id, date: new Date().toISOString() })
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border border-gray-100" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'expense' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {type === 'expense' ? <IconMinus className="w-5 h-5" /> : <IconPlus className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">記錄{type === 'expense' ? '支出' : '收入'}</h3>
                        <p className="text-xs text-gray-400">{account.bank}{account.lastFour ? ` (${account.lastFour})` : ''}</p>
                    </div>
                </div>

                {/* Type toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
                    <button onClick={() => { setType('expense'); setCategory('') }}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${type === 'expense' ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500'}`}>
                        支出
                    </button>
                    <button onClick={() => { setType('income'); setCategory('') }}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${type === 'income' ? 'bg-white text-emerald-500 shadow-sm' : 'text-gray-500'}`}>
                        收入
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1.5">金額</label>
                        <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
                            type="number" min="1" placeholder="請輸入金額" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1.5">分類</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setCategory(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${category === cat ? (type === 'expense' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1.5">備註（選填）</label>
                        <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50"
                            type="text" placeholder="例：午餐、加油" value={note} onChange={e => setNote(e.target.value)} />
                    </div>
                    {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                </div>

                <div className="flex gap-3 mt-6">
                    <button onClick={handleSubmit}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer text-white ${type === 'expense' ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                        確認記錄
                    </button>
                    <button onClick={onClose} className="flex-1 bg-gray-50 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition cursor-pointer">取消</button>
                </div>
            </div>
        </div>
    )
}
