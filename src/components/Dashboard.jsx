import { useState } from 'react'

import { currencyOf, formatMoney, sumByCurrency } from '../lib/currency'
import { daysUntilDue, isPaidThisMonth, monthlyAmountOf } from '../lib/cards'
import { marketCurrency } from '../lib/ledger'
import TransactionRow from './TransactionRow'
import { IconBank, IconCard, IconCalendar, IconDollar, IconCheck, IconArrowRight, IconTrendUp, IconHistory } from './icons'

const ICON_BG = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']

/** Currency totals are rendered as a stacked list — never summed into one figure. */
function TotalsStack({ totals, empty }) {
  if (totals.length === 0) return <div className="text-lg md:text-xl font-bold text-ink-2">{empty}</div>
  return (
    <div className="space-y-0.5">
      {totals.map(({ currency, total }, index) => (
        <div key={currency} className={index === 0 ? 'text-lg md:text-xl font-bold text-ink-2' : 'text-sm font-semibold text-ink-3'}>
          {formatMoney(total, currency)}
        </div>
      ))}
    </div>
  )
}

function StatCard({ skin, icon, totals, empty, label, footnote }) {
  return (
    <div className={`${skin} skin rounded-2xl p-4 md:p-5 relative overflow-hidden`}>
      <div className="absolute -bottom-3 -right-3 opacity-[0.08]" aria-hidden="true">{icon}</div>
      <div className="relative">
        <TotalsStack totals={totals} empty={empty} />
        <div className="text-[11px] md:text-xs text-ink-4 mt-1">{label}</div>
        <div className="text-[10px] text-muted mt-0.5">{footnote}</div>
      </div>
    </div>
  )
}

export default function Dashboard({ state, onPayCard, onOpenHistory }) {
  const { accounts, cards, investments, transactions } = state
  const [expandedBank, setExpandedBank] = useState(null)

  const cardsByAccount = new Map()
  cards.forEach(card => {
    if (!card.accountId) return
    if (!cardsByAccount.has(card.accountId)) cardsByAccount.set(card.accountId, [])
    cardsByAccount.get(card.accountId).push(card)
  })

  const bankOrder = []
  const byBank = new Map()
  accounts.forEach(account => {
    if (!byBank.has(account.bank)) { byBank.set(account.bank, []); bankOrder.push(account.bank) }
    byBank.get(account.bank).push(account)
  })

  const cashTotals = sumByCurrency(accounts, currencyOf, a => a.balance)
  const investTotals = sumByCurrency(investments, i => marketCurrency(i.market), i => i.cost)
  const unpaidCards = cards.filter(c => monthlyAmountOf(c) > 0 && !isPaidThisMonth(c))
  const dueTotals = sumByCurrency(
    unpaidCards,
    card => currencyOf(accounts.find(a => a.id === card.accountId)),
    monthlyAmountOf,
  )

  const payableCards = cards.filter(c => monthlyAmountOf(c) > 0)
  const paidCount = payableCards.filter(c => isPaidThisMonth(c)).length

  const upcomingCards = cards
    .map(card => ({ card, days: daysUntilDue(card.dueDay) }))
    .filter(entry => entry.days !== null)
    .sort((a, b) => a.days - b.days)

  const recentTx = transactions.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-ink">歡迎回來</h1>
        <p className="text-muted text-sm mt-1">我的財務總覽</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard skin="skin-indigo" icon={<IconDollar className="w-20 h-20 md:w-24 md:h-24" />}
          totals={cashTotals} empty="—" label="現金餘額" footnote={`${accounts.length} 個帳戶`} />
        <StatCard skin="skin-purple" icon={<IconTrendUp className="w-20 h-20 md:w-24 md:h-24" />}
          totals={investTotals} empty="—" label="投資成本" footnote={`${investments.length} 檔持股`} />
        <div className="col-span-2 md:col-span-1">
          <StatCard skin="skin-rose" icon={<IconCalendar className="w-20 h-20 md:w-24 md:h-24" />}
            totals={dueTotals} empty="—" label="本月待繳"
            footnote={`${paidCount}/${payableCards.length} 已繳`} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        <div className="space-y-5">
          <section>
            <h2 className="font-semibold text-ink-2 mb-3 text-sm">我的帳戶</h2>
            {accounts.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-line p-8 text-center text-faint">
                <IconBank className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">尚無帳戶</p>
              </div>
            ) : (
              <div className="bg-surface rounded-2xl border border-line overflow-hidden">
                {bankOrder.map((bank, index) => {
                  const bankAccounts = byBank.get(bank)
                  const expanded = expandedBank === bank
                  const bankTotals = sumByCurrency(bankAccounts, currencyOf, a => a.balance)
                  const cardCount = bankAccounts.reduce((sum, a) => sum + (cardsByAccount.get(a.id)?.length || 0), 0)
                  return (
                    <div key={bank} className="border-t border-line-soft first:border-t-0">
                      <button onClick={() => setExpandedBank(expanded ? null : bank)} aria-expanded={expanded}
                        className="w-full flex items-center px-3 md:px-4 py-2.5 md:py-3 hover:bg-surface-2 transition cursor-pointer text-left">
                        <span className={`${ICON_BG[index % ICON_BG.length]} w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0`}>
                          <IconBank className="w-4 h-4" />
                        </span>
                        <span className="ml-2.5 flex-1 min-w-0">
                          <span className="block font-medium text-ink-2 text-sm">{bank}</span>
                          <span className="block text-[11px] text-muted truncate">
                            {bankAccounts.length} 個帳戶{cardCount > 0 && ` · ${cardCount} 張卡`}
                          </span>
                        </span>
                        <span className="text-right ml-2">
                          {bankTotals.map(({ currency, total }) => (
                            <span key={currency} className="block font-bold text-ink-2 text-sm">
                              {formatMoney(total, currency)}
                            </span>
                          ))}
                        </span>
                        <IconArrowRight className={`w-3 h-3 ml-1.5 text-faint transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`} />
                      </button>
                      {expanded && (
                        <div className="px-3 md:px-4 pb-2.5 pl-[52px] md:pl-[56px] space-y-1">
                          {bankAccounts.map(account => (
                            <div key={account.id} className="flex items-center text-xs bg-surface-2 rounded-lg px-2.5 py-1.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tint-neutral shrink-0">{currencyOf(account)}</span>
                              <span className="ml-1.5 text-ink-4 flex-1 truncate">
                                {account.lastFour && `···${account.lastFour}`}{account.purpose && ` · ${account.purpose}`}
                              </span>
                              <span className="font-medium text-ink-3">{formatMoney(account.balance, currencyOf(account))}</span>
                            </div>
                          ))}
                          {bankAccounts.flatMap(a => cardsByAccount.get(a.id) || []).map(card => {
                            const amount = monthlyAmountOf(card)
                            const paid = isPaidThisMonth(card)
                            return (
                              <div key={card.id} className="flex items-center text-xs bg-surface-2 rounded-lg px-2.5 py-1.5">
                                <IconCard className="w-3.5 h-3.5 text-muted shrink-0" />
                                <span className="ml-1.5 text-ink-4 flex-1 truncate">{card.name}</span>
                                {amount > 0 && (
                                  <span className={`font-medium ${paid ? 'text-emerald-500' : 'text-ink-3'}`}>
                                    {formatMoney(amount, currencyOf(accounts.find(a => a.id === card.accountId)))}
                                  </span>
                                )}
                                {paid && <IconCheck className="w-3 h-3 text-emerald-500 ml-1" />}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-ink-2 text-sm">近期紀錄</h2>
              {transactions.length > 0 && (
                <button onClick={onOpenHistory}
                  className="flex items-center gap-1 text-xs text-ink-4 hover:text-ink-2 transition cursor-pointer">
                  <IconHistory className="w-3.5 h-3.5" /> 全部紀錄（{transactions.length}）
                </button>
              )}
            </div>
            {recentTx.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-line p-8 text-center text-faint">
                <IconHistory className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">尚無紀錄</p>
              </div>
            ) : (
              <div className="bg-surface rounded-2xl border border-line overflow-hidden divide-y divide-[var(--color-line-soft)]">
                {recentTx.map(tx => <TransactionRow key={tx.id} tx={tx} state={state} />)}
              </div>
            )}
          </section>
        </div>

        <section>
          <h2 className="font-semibold text-ink-2 mb-3 text-sm">信用卡繳費</h2>
          {upcomingCards.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-line p-8 text-center text-faint">
              {cards.length === 0
                ? <><IconCard className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">尚無信用卡</p></>
                : <><IconCalendar className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">尚無繳費日設定</p></>}
            </div>
          ) : (
            <div className="bg-surface rounded-2xl border border-line">
              {upcomingCards.map(({ card, days }) => {
                const account = accounts.find(a => a.id === card.accountId)
                const amount = monthlyAmountOf(card)
                const paid = isPaidThisMonth(card)
                return (
                  <div key={card.id} className="px-3 md:px-4 py-2.5 md:py-3 border-t border-line-soft first:border-t-0 hover:bg-surface-2 transition">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${paid ? 'tint-emerald' : days <= 3 ? 'tint-red' : 'tint-neutral'}`}>
                        {paid ? <IconCheck className="w-4 h-4" /> : <IconCard className="w-4 h-4" />}
                      </div>
                      <div className="ml-2.5 flex-1 min-w-0">
                        <div className="font-medium text-ink-2 text-sm truncate">{card.name}</div>
                        <div className="text-[11px] text-muted truncate">
                          {card.issuer || ''}{account ? ` → ${account.bank}` : ' · 未綁定帳戶'} · 每月 {card.dueDay} 號
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="font-semibold text-ink-3 text-sm">
                          {amount > 0 ? formatMoney(amount, currencyOf(account)) : '--'}
                        </div>
                        {paid
                          ? <span className="text-[11px] text-emerald-500">已繳</span>
                          : <span className={`text-[11px] ${days <= 3 ? 'text-red-500' : days <= 7 ? 'text-amber-500' : 'text-muted'}`}>
                              {days === 0 ? '今天' : `${days} 天後`}
                            </span>}
                      </div>
                    </div>
                    {!paid && amount > 0 && card.accountId && (
                      <div className="mt-1.5 ml-[42px]">
                        <button onClick={() => onPayCard(card.id)}
                          className={`text-xs font-medium px-3 py-1 rounded-lg transition cursor-pointer ${days === 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-surface-3 text-ink-4 hover:bg-surface-4'}`}>
                          {days === 0 ? '立即繳款' : '手動繳款'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {accounts.length === 0 && cards.length === 0 && (
        <div className="text-center py-12 mt-4">
          <p className="text-base font-medium text-ink-4 mb-1">開始管理你的財務</p>
          <p className="text-sm text-muted">先到「銀行帳戶」新增帳戶，再到「信用卡」新增卡片</p>
        </div>
      )}
    </div>
  )
}
