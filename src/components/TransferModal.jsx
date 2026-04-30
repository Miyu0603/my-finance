import { useState } from 'react'

const IconTransfer = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>

export default function TransferModal({ accounts, onTransfer, onClose, defaultFromId }) {
    const [fromId, setFromId] = useState(defaultFromId || '')
    const [toId, setToId] = useState('')
    const [amount, setAmount] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = () => {
        setError('')
        if (!fromId || !toId) return setError('請選擇轉出與轉入帳戶')
        if (fromId === toId) return setError('轉出與轉入帳戶不能相同')
        const amt = Number(amount)
        if (!amt || amt <= 0) return setError('請輸入有效金額')
        const fromAcc = accounts.find(a => a.id === fromId)
        if (fromAcc && (Number(fromAcc.balance) || 0) < amt) {
            return setError(`餘額不足（目前 $${(Number(fromAcc.balance) || 0).toLocaleString()}）`)
        }
        onTransfer(fromId, toId, amt)
        onClose()
    }

    const getLabel = (acc) => `${acc.bank}${acc.lastFour ? ` (${acc.lastFour})` : ''} - $${(Number(acc.balance) || 0).toLocaleString()}`

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 border border-gray-100" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <IconTransfer className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">帳戶轉帳</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1.5">轉出帳戶</label>
                        <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50" value={fromId} onChange={e => setFromId(e.target.value)}>
                            <option value="">-- 請選擇 --</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{getLabel(acc)}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-center">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1.5">轉入帳戶</label>
                        <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50" value={toId} onChange={e => setToId(e.target.value)}>
                            <option value="">-- 請選擇 --</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{getLabel(acc)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 block mb-1.5">轉帳金額</label>
                        <input className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition bg-gray-50/50" type="number" min="1" placeholder="請輸入金額" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={handleSubmit} className="flex-1 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition cursor-pointer">確認轉帳</button>
                    <button onClick={onClose} className="flex-1 bg-gray-50 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 transition cursor-pointer">取消</button>
                </div>
            </div>
        </div>
    )
}
