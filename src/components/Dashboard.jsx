import { useState } from 'react'

const IconBank = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21V12m0-9L3 8v1h18V8l-9-5zM3 21h18M5 12v9m14-9v9M9 12v9m6-9v9" /></svg>
const IconCard = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
const IconCalendar = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
const IconDollar = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const IconTransfer = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
const IconCheck = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
const IconRocket = ({ className }) => <svg className={className || "w-12 h-12"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841M3.27 6.96L7.05 10.74m0 0a5.971 5.971 0 00-.94 3.139c.007.484.068.966.18 1.435" /></svg>
const IconArrowRight = ({ className }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
const IconTrendUp = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>

const ICON_BG = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']

export default function Dashboard({ accounts, cards, transactions, investments = [], onPayCard, onTransfer }) {
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
  const totalInvestment = investments.reduce((s, a) => s + (Number(a.cost) || 0), 0)
  const totalMonthly = cards.reduce((s, c) => s + (Number(c.monthlyAmount) || 0), 0)
  const paidCount = cards.filter(c => c.monthlyAmount && isPaidThisMonth(c)).length
  const dueCount = cards.filter(c => c.monthlyAmount).length
  const recentTx = (transactions || []).slice(-5).reverse()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">歡迎回來</h1>
        <p className="text-gray-400 text-sm mt-1">我的財務總覽</p>
      </div>

      {/* Stats - gradient cards with big icons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-100 rounded-2xl p-4 md:p-5 border border-indigo-100/50 relative overflow-hidden">
          <div className="absolute -bottom-3 -right-3 opacity-[0.08]">
            <IconDollar className="w-20 h-20 md:w-24 md:h-24" />
          </div>
          <div className="relative">
            <div className="text-lg md:text-xl font-bold text-gray-800">${totalBalance.toLocaleString()}</div>
            <div className="text-[11px] md:text-xs text-gray-500 mt-0.5">現金餘額</div>
            <div className="text-[10px] text-gray-400 mt-1">{accounts.length} 個帳戶</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-2xl p-4 md:p-5 border border-purple-100/50 relative overflow-hidden">
          <div className="absolute -bottom-3 -right-3 opacity-[0.08]">
            <IconTrendUp className="w-20 h-20 md:w-24 md:h-24" />
          </div>
          <div className="relative">
            <div className="text-lg md:text-xl font-bold text-gray-800">${totalInvestment.toLocaleString()}</div>
            <div className="text-[11px] md:text-xs text-gray-500 mt-0.5">投資成本</div>
            <div className="text-[10px] text-gray-400 mt-1">{investments.length} 檔持股</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-50 to-pink-100 rounded-2xl p-4 md:p-5 border border-rose-100/50 relative overflow-hidden col-span-2 md:col-span-1">
          <div className="absolute -bottom-3 -right-3 opacity-[0.08]">
            <IconCalendar className="w-20 h-20 md:w-24 md:h-24" />
          </div>
          <div className="relative">
            <div className="text-lg md:text-xl font-bold text-gray-800">${totalMonthly.toLocaleString()}</div>
            <div className="text-[11px] md:text-xs text-gray-500 mt-0.5">本月應繳</div>
            <div className="text-[10px] text-gray-400 mt-1">{paidCount}/{dueCount} 已繳</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* Left: accounts + recent */}
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">我的帳戶</h3>
            {accounts.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                {accounts.map((acc, i) => {
                  const linked = accountMap[acc.id]?.cards || []
                  const isExpanded = expandedAcc === acc.id
                  return (
                    <div key={acc.id}>
                      <button onClick={() => setExpandedAcc(isExpanded ? null : acc.id)}
                        className="w-full flex items-center px-3 md:px-4 py-2.5 md:py-3 hover:bg-gray-50/50 transition cursor-pointer text-left">
                        <div className={`${ICON_BG[i % ICON_BG.length]} w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0`}>
                          <IconBank className="w-4 h-4" />
                        </div>
                        <div className="ml-2.5 flex-1 min-w-0">
                          <div className="font-medium text-gray-800 text-sm">{acc.bank}</div>
                          <div className="text-[11px] text-gray-400 truncate">
                            {acc.lastFour && `(${acc.lastFour})`}{acc.purpose && ` · ${acc.purpose}`}{linked.length > 0 && ` · ${linked.length} 張卡`}
                          </div>
                        </div>
                        <div className="font-bold text-gray-800 text-sm ml-2">${(Number(acc.balance) || 0).toLocaleString()}</div>
                        <IconArrowRight className={`w-3 h-3 ml-1.5 text-gray-300 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      {isExpanded && (
                        <div className="px-3 md:px-4 pb-2.5 pl-[52px] md:pl-[56px] space-y-1">
                          {linked.length > 0 ? linked.map(card => {
                            const amt = Number(card.monthlyAmount) || 0
                            const paid = isPaidThisMonth(card)
                            return (
                              <div key={card.id} className="flex items-center text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
                                <IconCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="ml-1.5 text-gray-600 flex-1 truncate">{card.name}</span>
                                {amt > 0 && <span className={`font-medium ${paid ? 'text-emerald-500' : 'text-gray-700'}`}>${amt.toLocaleString()}</span>}
                                {paid && <IconCheck className="w-3 h-3 text-emerald-500 ml-1" />}
                              </div>
                            )
                          }) : <div className="text-[11px] text-gray-300 bg-gray-50 rounded-lg px-2.5 py-1.5">尚未綁定信用卡</div>}
                          {accounts.length >= 2 && (
                            <button onClick={(e) => { e.stopPropagation(); onTransfer(acc.id) }}
                              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 px-2.5 py-1 hover:bg-indigo-50 rounded-lg transition cursor-pointer">
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
                <IconBank className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">尚無帳戶</p>
              </div>
            )}
          </div>
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
                      <div key={tx.id} className="flex items-center px-3 md:px-4 py-2 text-xs">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0"><IconTransfer className="w-3.5 h-3.5" /></div>
                        <div className="ml-2 flex-1 truncate"><span className="text-gray-700">{from?.bank || '?'} → {to?.bank || '?'}</span></div>
                        <span className="text-gray-400 mx-2">{dateStr}</span>
                        <span className="font-medium text-gray-800">${tx.amount.toLocaleString()}</span>
                      </div>
                    )
                  }
                  if (tx.type === 'card-payment') {
                    const card = cards.find(c => c.id === tx.cardId)
                    return (
                      <div key={tx.id} className="flex items-center px-3 md:px-4 py-2 text-xs">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0"><IconCheck className="w-3.5 h-3.5" /></div>
                        <div className="ml-2 flex-1 truncate"><span className="text-gray-700">{card?.name || '信用卡'} 繳費</span></div>
                        <span className="text-gray-400 mx-2">{dateStr}</span>
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

        {/* Right: credit card payment */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">信用卡繳費</h3>
          {upcomingCards.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {upcomingCards.map(card => {
                const acc = card.accountId && accountMap[card.accountId]
                const amt = Number(card.monthlyAmount) || 0
                const paid = isPaidThisMonth(card)
                return (
                  <div key={card.id} className="px-3 md:px-4 py-2.5 md:py-3 hover:bg-gray-50/30 transition">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg ${paid ? 'bg-emerald-50 text-emerald-500' : card.daysUntil <= 3 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'} flex items-center justify-center shrink-0`}>
                        {paid ? <IconCheck className="w-4 h-4" /> : <IconCard className="w-4 h-4" />}
                      </div>
                      <div className="ml-2.5 flex-1 min-w-0">
                        <div className="font-medium text-gray-800 text-sm truncate">{card.name}</div>
                        <div className="text-[11px] text-gray-400 truncate">{card.issuer || ''}{acc ? ` → ${acc.bank}` : ''} · 每月 {card.dueDay} 號</div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="font-semibold text-gray-700 text-sm">{amt > 0 ? `$${amt.toLocaleString()}` : '--'}</div>
                        {paid ? <span className="text-[11px] text-emerald-500">已繳</span>
                          : <span className={`text-[11px] ${card.daysUntil <= 3 ? 'text-red-500' : card.daysUntil <= 7 ? 'text-amber-500' : 'text-gray-400'}`}>{card.daysUntil === 0 ? '今天' : `${card.daysUntil} 天後`}</span>}
                      </div>
                    </div>
                    {!paid && amt > 0 && card.accountId && (
                      <div className="mt-1.5 ml-[42px]">
                        <button onClick={() => onPayCard(card.id)}
                          className={`text-xs font-medium px-3 py-1 rounded-lg transition cursor-pointer ${card.daysUntil === 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
              <IconCard className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">尚無信用卡</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-300">
              <IconCalendar className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">尚無繳費日設定</p>
            </div>
          )}
        </div>
      </div>

      {accounts.length === 0 && cards.length === 0 && (
        <div className="text-center py-12 text-gray-300 mt-4">
          <p className="text-base font-medium text-gray-500 mb-1">開始管理你的財務</p>
          <p className="text-sm">先到「銀行帳戶」新增帳戶，再到「信用卡」新增卡片</p>
        </div>
      )}
    </div>
  )
}
