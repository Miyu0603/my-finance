import { useState } from 'react'

const IconBank = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21V12m0-9L3 8v1h18V8l-9-5zM3 21h18M5 12v9m14-9v9M9 12v9m6-9v9" /></svg>
const IconCard = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
const IconCalendar = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
const IconDollar = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const IconTransfer = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
const IconCheck = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
const IconRocket = ({ className }) => <svg className={className || "w-12 h-12"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841M3.27 6.96L7.05 10.74m0 0a5.971 5.971 0 00-.94 3.139c.007.484.068.966.18 1.435" /></svg>
const IconArrowRight = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>

const ICON_BG = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']

export default function Dashboard({ accounts, cards, transactions, onPayCard, onTransfer }) {
  const [expandedAcc, setExpandedAcc] = useState(null)

  const accountMap = {}
  accounts.forEach(acc => { accountMap[acc.id] = { ...acc, cards: [] } })
  cards.forEach(card => {
    if (card.accountId && accountMap[card.accountId]) accountMap[card.accountId].cards.push(card)
  })

  const today = new Date()
  const currentDay = today.getDate()

  const isPaidThisMonth = (card) => {
    if (!card.lastPaidDate) return false
    const paid = new Date(card.lastPaidDate)
    return paid.getMonth() === today.getMonth() && paid.getFullYear() === today.getFullYear()
  }

  const upcomingCards = cards
    .filter(c => c.dueDay)
    .map(c => {
      const due = parseInt(c.dueDay, 10)
      let daysUntil = due - currentDay
      if (daysUntil < 0) daysUntil += 30
      return { ...c, daysUntil }
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)

  const totalBalance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0)
  const totalMonthly = cards.reduce((s, c) => s + (Number(c.monthlyAmount) || 0), 0)
  const paidCount = cards.filter(c => c.monthlyAmount && isPaidThisMonth(c)).length
  const dueCount = cards.filter(c => c.monthlyAmount).length

  const recentTx = (transactions || []).slice(-5).reverse()

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">歡迎回來</h1>
        <p className="text-gray-400 text-sm mt-1">你的財務總覽</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <IconDollar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">${totalBalance.toLocaleString()}</div>
              <div className="text-xs text-gray-400">帳戶總餘額</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <IconCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">{cards.length} 張</div>
              <div className="text-xs text-gray-400">信用卡</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <IconCalendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">${totalMonthly.toLocaleString()}</div>
              <div className="text-xs text-gray-400">本月應繳 ({paidCount}/{dueCount} 已繳)</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left column: accounts + cards */}
        <div className="space-y-6">
          {/* Accounts */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">我的帳戶</h3>
            {accounts.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {accounts.map((acc, i) => {
                  const linked = accountMap[acc.id]?.cards || []
                  const isExpanded = expandedAcc === acc.id
                  return (
                    <div key={acc.id}>
                      <button
                        onClick={() => setExpandedAcc(isExpanded ? null : acc.id)}
                        className="w-full flex items-center px-4 py-3 hover:bg-gray-50/50 transition cursor-pointer text-left"
                      >
                        <div className={`${ICON_BG[i % ICON_BG.length]} w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0`}>
                          <IconBank className="w-4 h-4" />
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="font-medium text-gray-800 text-sm">{acc.bank}</div>
                          <div className="text-xs text-gray-400">
                            {acc.lastFour && `(${acc.lastFour})`}
                            {acc.purpose && ` · ${acc.purpose}`}
                            {linked.length > 0 && ` · ${linked.length} 張卡`}
                          </div>
                        </div>
                        <div className="font-bold text-gray-800 text-sm">${(Number(acc.balance) || 0).toLocaleString()}</div>
                        <IconArrowRight className={`w-3.5 h-3.5 ml-2 text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      {isExpanded && linked.length > 0 && (
                        <div className="px-4 pb-3 pl-15 space-y-1.5">
                          {linked.map(card => {
                            const amt = Number(card.monthlyAmount) || 0
                            const paid = isPaidThisMonth(card)
                            return (
                              <div key={card.id} className="flex items-center text-xs bg-gray-50 rounded-lg px-3 py-2">
                                <IconCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="ml-2 text-gray-600 flex-1">{card.name}</span>
                                {amt > 0 && <span className={`font-medium ${paid ? 'text-emerald-500' : 'text-gray-700'}`}>${amt.toLocaleString()}</span>}
                                {paid && <IconCheck className="w-3 h-3 text-emerald-500 ml-1" />}
                              </div>
                            )
                          })}
                          {accounts.length >= 2 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onTransfer(acc.id) }}
                              className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600 px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            >
                              <IconTransfer className="w-3.5 h-3.5" /> 從此帳戶轉帳
                            </button>
                          )}
                        </div>
                      )}
                      {isExpanded && linked.length === 0 && (
                        <div className="px-4 pb-3 pl-15">
                          <div className="text-xs text-gray-300 bg-gray-50 rounded-lg px-3 py-2">尚未綁定信用卡</div>
                          {accounts.length >= 2 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onTransfer(acc.id) }}
                              className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600 px-3 py-1.5 mt-1.5 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            >
                              <IconTransfer className="w-3.5 h-3.5" /> 從此帳戶轉帳
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-300">
                <IconBank className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs">尚無帳戶</p>
              </div>
            )}
          </div>

          {/* Recent transactions */}
          {recentTx.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">近期紀錄</h3>
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {recentTx.map(tx => {
                  const date = new Date(tx.date)
                  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
                  if (tx.type === 'transfer') {
                    const from = accounts.find(a => a.id === tx.fromId)
                    const to = accounts.find(a => a.id === tx.toId)
                    return (
                      <div key={tx.id} className="flex items-center px-4 py-2.5 text-xs">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                          <IconTransfer className="w-3.5 h-3.5" />
                        </div>
                        <div className="ml-2.5 flex-1">
                          <span className="text-gray-700">{from?.bank || '?'} → {to?.bank || '?'}</span>
                        </div>
                        <span className="text-gray-500 mr-2">{dateStr}</span>
                        <span className="font-medium text-gray-800">${tx.amount.toLocaleString()}</span>
                      </div>
                    )
                  }
                  if (tx.type === 'card-payment') {
                    const card = cards.find(c => c.id === tx.cardId)
                    return (
                      <div key={tx.id} className="flex items-center px-4 py-2.5 text-xs">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                          <IconCheck className="w-3.5 h-3.5" />
                        </div>
                        <div className="ml-2.5 flex-1">
                          <span className="text-gray-700">{card?.name || '信用卡'} 繳費</span>
                        </div>
                        <span className="text-gray-500 mr-2">{dateStr}</span>
                        <span className="font-medium text-red-500">-${tx.amount.toLocaleString()}</span>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column: credit card payment schedule */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">信用卡繳費</h3>
          {upcomingCards.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {upcomingCards.map(card => {
                const acc = card.accountId && accountMap[card.accountId]
                const amt = Number(card.monthlyAmount) || 0
                const paid = isPaidThisMonth(card)
                return (
                  <div key={card.id} className="px-4 py-3 hover:bg-gray-50/30 transition">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg ${paid ? 'bg-emerald-50 text-emerald-500' : card.daysUntil <= 3 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'} flex items-center justify-center shrink-0`}>
                        {paid ? <IconCheck className="w-4 h-4" /> : <IconCard className="w-4 h-4" />}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="font-medium text-gray-800 text-sm">{card.name}</div>
                        <div className="text-xs text-gray-400">
                          {card.issuer || ''}
                          {acc ? ` → ${acc.bank}` : ''}
                          {` · 每月 ${card.dueDay} 號`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-700 text-sm">{amt > 0 ? `$${amt.toLocaleString()}` : '--'}</div>
                        {paid ? (
                          <span className="text-xs text-emerald-500">已繳</span>
                        ) : (
                          <span className={`text-xs ${card.daysUntil <= 3 ? 'text-red-500' : card.daysUntil <= 7 ? 'text-amber-500' : 'text-gray-400'}`}>
                            {card.daysUntil === 0 ? '今天' : `${card.daysUntil} 天後`}
                          </span>
                        )}
                      </div>
                    </div>
                    {!paid && amt > 0 && card.accountId && (
                      <div className="mt-2 ml-11">
                        <button
                          onClick={() => onPayCard(card.id)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            card.daysUntil === 0
                              ? 'bg-red-500 text-white hover:bg-red-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {card.daysUntil === 0 ? '立即扣款' : '手動繳費'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : cards.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-300">
              <IconCard className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs">尚無信用卡</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-300">
              <IconCalendar className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs">尚無繳費日設定</p>
            </div>
          )}
        </div>
      </div>

      {accounts.length === 0 && cards.length === 0 && (
        <div className="text-center py-16 text-gray-300 mt-4">
          <IconRocket className="mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-500 mb-2">開始管理你的財務</p>
          <p className="text-sm">先到「銀行帳戶」新增帳戶，再到「信用卡」新增卡片</p>
        </div>
      )}
    </div>
  )
}
