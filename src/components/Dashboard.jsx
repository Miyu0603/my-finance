import { useState } from 'react'
import { readPref, writePref } from '../lib/storage'
import { currencyOf, formatMoney, sumByCurrency } from '../lib/currency'
import { daysUntilDue, isPaidThisMonth, monthlyAmountOf } from '../lib/cards'
import { marketCurrency } from '../lib/ledger'
import TransactionRow from './TransactionRow'
import {
  IconBank, IconCard, IconCalendar, IconCheck, IconArrowRight, IconTrendUp,
  IconHistory, IconReceipt, IconTransfer, IconEye, IconEyeOff, IconChevronDown,
} from './icons'

const ICON_BG = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-semibold text-ink-2 text-sm">{title}</h2>
      {onAction && (
        <button onClick={onAction}
          className="flex items-center gap-1 text-xs text-ink-4 hover:text-solid transition cursor-pointer">
          {actionLabel} <IconArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

function HeroAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick}
      className="hero-chip flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer">
      {icon}{label}
    </button>
  )
}

function EmptyCard({ icon, text }) {
  return (
    <div className="bg-surface rounded-card border border-line p-8 text-center text-muted">
      {icon}<p className="text-xs mt-2">{text}</p>
    </div>
  )
}

/**
 * The hero shows the largest currency in full size and stacks the rest beneath
 * it. A finance app is allowed one big number, but not one that silently adds
 * TWD to USD.
 */
function BalanceHero({
  totals, accountCount, cardCount, lastEntry,
  hidden, onToggleHidden, currency, currencyOptions, onCurrencyChange,
  onRecord, onTransfer, onHistory,
}) {
  const [primary, ...rest] = totals

  return (
    <section className="hero rounded-card shadow-card mb-4 overflow-hidden">
      <div className="relative p-5 md:p-6">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgb(255 255 255 / 0.85), transparent 70%)' }} aria-hidden="true" />
        <div className="relative">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs hero-soft">總資產</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={onToggleHidden} aria-pressed={hidden}
                aria-label={hidden ? '顯示金額' : '隱藏金額'}
                className="hero-chip w-8 h-8 flex items-center justify-center cursor-pointer">
                {hidden ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
              </button>
              {currencyOptions.length > 1 && (
                <div className="hero-chip relative flex items-center">
                  <select value={currency} onChange={e => onCurrencyChange(e.target.value)} aria-label="顯示幣別"
                    className="appearance-none bg-transparent pl-3 pr-7 py-1.5 text-xs font-medium cursor-pointer focus:outline-none">
                    <option value="ALL" className="bg-surface text-ink">ALL</option>
                    {currencyOptions.map(code => (
                      <option key={code} value={code} className="bg-surface text-ink">{code}</option>
                    ))}
                  </select>
                  <IconChevronDown className="w-3 h-3 absolute right-2 pointer-events-none" />
                </div>
              )}
            </div>
          </div>

          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {hidden ? (
              <span className="text-3xl md:text-4xl font-bold tracking-widest">*****</span>
            ) : (
              <>
                <span className="text-3xl md:text-4xl font-bold tracking-tight">
                  {primary ? formatMoney(primary.total, primary.currency) : '—'}
                </span>
                {rest.map(({ currency: code, total }) => (
                  <span key={code} className="text-sm font-semibold hero-soft">
                    {formatMoney(total, code)}
                  </span>
                ))}
              </>
            )}
          </div>

          <div className="flex gap-2 mt-5">
            <HeroAction icon={<IconReceipt className="w-4 h-4" />} label="記帳" onClick={onRecord} />
            <HeroAction icon={<IconTransfer className="w-4 h-4" />} label="轉帳" onClick={onTransfer} />
            <HeroAction icon={<IconHistory className="w-4 h-4" />} label="紀錄" onClick={onHistory} />
          </div>
        </div>
      </div>

      <p className="hero-footer px-5 md:px-6 py-3 text-[11px] tracking-wide">
        {accountCount} 個帳戶 · {cardCount} 張卡{lastEntry && ` · 最後一筆 ${lastEntry}`}
      </p>
    </section>
  )
}

function StatTile({ skin, icon, totals, label, footnote }) {
  const [primary, ...rest] = totals
  return (
    <div className={`${skin} skin rounded-card p-4 relative overflow-hidden`}>
      <div className="absolute -bottom-3 -right-3 opacity-[0.08]" aria-hidden="true">{icon}</div>
      <div className="relative">
        <div className="text-lg font-bold text-ink-2">
          {primary ? formatMoney(primary.total, primary.currency) : '—'}
        </div>
        {rest.map(({ currency, total }) => (
          <div key={currency} className="text-xs font-semibold text-ink-3">{formatMoney(total, currency)}</div>
        ))}
        <div className="text-[11px] text-ink-4 mt-1">{label}</div>
        <div className="text-[10px] text-muted mt-0.5">{footnote}</div>
      </div>
    </div>
  )
}

export default function Dashboard({ state, onPayCard, onOpenHistory, onRecord, onTransfer, onNavigate }) {
  const { accounts, cards, investments, transactions } = state
  const [expandedBank, setExpandedBank] = useState(null)
  const [amountsHidden, setAmountsHidden] = useState(() => readPref('hide-amounts', false))
  const [balanceCurrency, setBalanceCurrency] = useState(() => readPref('balance-currency', 'ALL'))

  const toggleAmounts = () => {
    setAmountsHidden(prev => { writePref('hide-amounts', !prev); return !prev })
  }
  const pickBalanceCurrency = (next) => { writePref('balance-currency', next); setBalanceCurrency(next) }

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
  const currencyOptions = cashTotals.map(entry => entry.currency)
  // A saved currency can disappear when its last account is deleted.
  const activeCurrency = currencyOptions.includes(balanceCurrency) ? balanceCurrency : 'ALL'
  const heroTotals = activeCurrency === 'ALL'
    ? cashTotals
    : cashTotals.filter(entry => entry.currency === activeCurrency)
  const investTotals = sumByCurrency(investments, i => marketCurrency(i.market), i => i.cost)
  const dueTotals = sumByCurrency(
    cards.filter(c => monthlyAmountOf(c) > 0 && !isPaidThisMonth(c)),
    card => currencyOf(accounts.find(a => a.id === card.accountId)),
    monthlyAmountOf,
  )

  const payableCards = cards.filter(c => monthlyAmountOf(c) > 0)
  const paidCount = payableCards.filter(c => isPaidThisMonth(c)).length

  const upcomingCards = cards
    .map(card => ({ card, days: daysUntilDue(card.dueDay) }))
    .filter(entry => entry.days !== null)
    .sort((a, b) => a.days - b.days)

  const sortedTx = transactions.slice().sort((a, b) => new Date(b.date) - new Date(a.date))
  const recentTx = sortedTx.slice(0, 5)
  const lastEntry = sortedTx[0]
    ? new Date(sortedTx[0].date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
    : null

  return (
    <div>
      <div className="mb-5">
        <p className="text-muted text-sm">歡迎回來</p>
        <h1 className="text-xl md:text-2xl font-bold text-ink">我的財務總覽</h1>
      </div>

      <BalanceHero totals={heroTotals} accountCount={accounts.length} cardCount={cards.length}
        lastEntry={lastEntry} hidden={amountsHidden} onToggleHidden={toggleAmounts}
        currency={activeCurrency} currencyOptions={currencyOptions} onCurrencyChange={pickBalanceCurrency}
        onRecord={onRecord} onTransfer={onTransfer} onHistory={onOpenHistory} />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatTile skin="skin-purple" icon={<IconTrendUp className="w-20 h-20" />}
          totals={investTotals} label="投資成本" footnote={`${investments.length} 檔持股`} />
        <StatTile skin="skin-rose" icon={<IconCalendar className="w-20 h-20" />}
          totals={dueTotals} label="本月待繳" footnote={`${paidCount}/${payableCards.length} 已繳`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        <div className="space-y-6">
          <section>
            <SectionHeader title="我的帳戶" actionLabel="全部" onAction={accounts.length ? () => onNavigate('accounts') : undefined} />
            {accounts.length === 0 ? (
              <EmptyCard icon={<IconBank className="w-8 h-8 mx-auto" />} text="尚無帳戶" />
            ) : (
              // A horizontal rail keeps every bank one swipe away instead of
              // pushing the rest of the dashboard off the screen.
              <div className="rail -mx-4 px-4 md:mx-0 md:px-0">
                {bankOrder.map((bank, index) => {
                  const bankAccounts = byBank.get(bank)
                  const bankTotals = sumByCurrency(bankAccounts, currencyOf, a => a.balance)
                  const cardCount = bankAccounts.reduce((sum, a) => sum + (cardsByAccount.get(a.id)?.length || 0), 0)
                  const expanded = expandedBank === bank
                  return (
                    <button key={bank} onClick={() => setExpandedBank(expanded ? null : bank)}
                      aria-expanded={expanded} aria-label={`${bank}，${bankAccounts.length} 個帳戶`}
                      className={`w-44 text-left bg-surface rounded-card border p-4 transition cursor-pointer ${expanded ? 'border-solid shadow-card' : 'border-line hover:border-line-2'}`}>
                      <span className={`${ICON_BG[index % ICON_BG.length]} w-9 h-9 rounded-tile flex items-center justify-center text-white mb-3`}>
                        <IconBank className="w-4 h-4" />
                      </span>
                      <span className="block font-medium text-ink-2 text-sm truncate">{bank}</span>
                      <span className="block text-[11px] text-muted mb-2">
                        {bankAccounts.length} 個帳戶{cardCount > 0 && ` · ${cardCount} 張卡`}
                      </span>
                      {bankTotals.map(({ currency, total }) => (
                        <span key={currency} className="block font-bold text-ink-2 text-sm">
                          {formatMoney(total, currency)}
                        </span>
                      ))}
                    </button>
                  )
                })}
              </div>
            )}

            {expandedBank && byBank.has(expandedBank) && (
              <div className="bg-surface rounded-card border border-line p-3 mt-3 space-y-1.5">
                {byBank.get(expandedBank).map(account => (
                  <div key={account.id} className="flex items-center text-xs bg-surface-2 rounded-tile px-3 py-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tint-neutral shrink-0">{currencyOf(account)}</span>
                    <span className="ml-2 text-ink-4 flex-1 truncate">
                      {account.lastFour && `···${account.lastFour}`}{account.purpose && ` · ${account.purpose}`}
                    </span>
                    <span className="font-medium text-ink-3">{formatMoney(account.balance, currencyOf(account))}</span>
                  </div>
                ))}
                {byBank.get(expandedBank).flatMap(a => cardsByAccount.get(a.id) || []).map(card => {
                  const amount = monthlyAmountOf(card)
                  const paid = isPaidThisMonth(card)
                  return (
                    <div key={card.id} className="flex items-center text-xs bg-surface-2 rounded-tile px-3 py-2">
                      <IconCard className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className="ml-2 text-ink-4 flex-1 truncate">{card.name}</span>
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
          </section>

          <section>
            <SectionHeader title="近期紀錄"
              actionLabel={`全部 ${transactions.length}`}
              onAction={transactions.length ? onOpenHistory : undefined} />
            {recentTx.length === 0 ? (
              <EmptyCard icon={<IconHistory className="w-8 h-8 mx-auto" />} text="尚無紀錄" />
            ) : (
              <div className="bg-surface rounded-card border border-line overflow-hidden">
                {recentTx.map(tx => (
                  <div key={tx.id} className="border-t border-line-soft first:border-t-0">
                    <TransactionRow tx={tx} state={state} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section>
          <SectionHeader title="信用卡繳費" actionLabel="全部"
            onAction={cards.length ? () => onNavigate('cards') : undefined} />
          {upcomingCards.length === 0 ? (
            <EmptyCard
              icon={cards.length === 0 ? <IconCard className="w-8 h-8 mx-auto" /> : <IconCalendar className="w-8 h-8 mx-auto" />}
              text={cards.length === 0 ? '尚無信用卡' : '尚無繳費日設定'} />
          ) : (
            <div className="bg-surface rounded-card border border-line overflow-hidden">
              {upcomingCards.map(({ card, days }) => {
                const account = accounts.find(a => a.id === card.accountId)
                const amount = monthlyAmountOf(card)
                const paid = isPaidThisMonth(card)
                return (
                  <div key={card.id} className="px-4 py-3 border-t border-line-soft first:border-t-0 hover:bg-surface-2 transition">
                    <div className="flex items-center">
                      <div className={`w-9 h-9 rounded-tile flex items-center justify-center shrink-0 ${paid ? 'tint-emerald' : days <= 3 ? 'tint-red' : 'tint-neutral'}`}>
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
                      <div className="mt-2 ml-[46px]">
                        <button onClick={() => onPayCard(card.id)}
                          className={`text-xs font-medium px-3.5 py-1.5 rounded-pill transition cursor-pointer ${days === 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-surface-3 text-ink-3 hover:bg-surface-4'}`}>
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
