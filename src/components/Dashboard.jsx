import { useState } from 'react'
import { readPref, writePref } from '../lib/storage'
import { currencyOf, sumByCurrency } from '../lib/currency'
import { daysUntilDue, isPaidThisMonth, isPartiallyPaid, monthlyAmountOf, outstandingThisMonth } from '../lib/cards'
import { marketCurrency } from '../lib/ledger'
import { staleAccounts, STALE_DAYS } from '../lib/freshness'
import TransactionRow from './TransactionRow'
import {
  IconBank, IconCard, IconCalendar, IconCheck, IconArrowRight, IconTrendUp,
  IconHistory, IconReceipt, IconTransfer, IconEye, IconEyeOff,
} from './icons'
import { useMoneyFormat, useMoneyHidden } from '../lib/moneyDisplay'

/** One hue per bank, so a bank is recognisable before you read its name. */
const BANK_BLOCKS = ['brick-yellow', 'brick-purple', 'brick-blue', 'brick-green', 'brick-peach']

const greeting = (hour = new Date().getHours()) => {
  if (hour < 5) return '夜深了'
  if (hour < 11) return '早安'
  if (hour < 18) return '午安'
  return '晚安'
}

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-bold text-ink text-base">{title}</h2>
      {onAction && (
        <button onClick={onAction}
          className="pill-outline flex items-center gap-1 text-xs font-medium px-3 py-1.5 hover:bg-surface-3 transition cursor-pointer">
          {actionLabel} <IconArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

/** Label capsule that sits on a filled block. */
function BlockTag({ children, solid = true }) {
  return (
    <span className={`${solid ? 'pill-solid' : 'pill-outline'} text-[12px] font-semibold px-3 py-1`}>
      {children}
    </span>
  )
}

function Meter({ label, value, total }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <>
      <div className="flex items-center justify-between text-[12px] font-semibold mt-4">
        <span>{label}</span><span>{percent}%</span>
      </div>
      <div className="meter mt-1.5" role="img" aria-label={`${label} ${percent}%`}>
        <span style={{ width: `${percent}%` }} />
      </div>
    </>
  )
}

function EmptyCard({ icon, text }) {
  return (
    <div className="brick brick-plain rounded-card p-8 text-center text-muted">
      {icon}<p className="text-xs mt-2">{text}</p>
    </div>
  )
}

function HeroAction({ icon, label, onClick }) {
  return (
    <button onClick={onClick}
      className="hero-chip flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold cursor-pointer">
      {icon}{label}
    </button>
  )
}

/**
 * The headline block. It shows the largest currency full size and the rest
 * beside it — a finance app is allowed one big number, but not one that
 * silently adds TWD to USD.
 */
function BalanceHero({ totals, accountCount, cardCount, lastEntry, hidden, onRecord, onTransfer, onHistory }) {
  const formatMoney = useMoneyFormat()
  const [primary, ...rest] = totals

  return (
    <section className="hero rounded-card mb-3.5 overflow-hidden">
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-2">
          <BlockTag>總資產 {primary ? primary.currency : ''}</BlockTag>
          <IconTrendUp className="w-[18px] h-[18px]" />
        </div>

        <div className="mt-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {hidden ? (
            <span className="text-[34px] leading-none font-extrabold tracking-tight">*****</span>
          ) : (
            <>
              <span className="text-[34px] leading-none font-extrabold tracking-tight">
                {primary ? formatMoney(primary.total, primary.currency) : '—'}
              </span>
              {rest.map(({ currency, total }) => (
                <span key={currency} className="text-sm font-bold hero-soft">
                  {formatMoney(total, currency)}
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

      <p className="hero-footer px-5 md:px-6 py-2.5 text-[11px] font-medium">
        {accountCount} 個帳戶 · {cardCount} 張卡{lastEntry && ` · 最後一筆 ${lastEntry}`}
      </p>
    </section>
  )
}

function StatBlock({ block, tag, totals, footnote, meter }) {
  const formatMoney = useMoneyFormat()
  const hidden = useMoneyHidden()
  // Masked, every currency renders the same string, so show it once.
  const [primary, ...rest] = hidden ? totals.slice(0, 1) : totals
  return (
    <div className={`brick ${block} rounded-card p-4 md:p-5`}>
      <BlockTag solid={false}>{tag}</BlockTag>
      <div className="text-[26px] md:text-[30px] leading-none font-extrabold tracking-tight mt-3.5">
        {primary ? formatMoney(primary.total, primary.currency) : '—'}
      </div>
      {rest.length > 0 && (
        <div className="text-[13px] font-semibold mt-1">
          另有 {rest.map(r => formatMoney(r.total, r.currency)).join(' · ')}
        </div>
      )}
      <div className="text-[12px] font-medium opacity-75 mt-1">{footnote}</div>
      {meter}
    </div>
  )
}

export default function Dashboard({
  state, onPayCard, onOpenHistory, onRecord, onTransfer, onNavigate,
  amountsHidden, onToggleAmounts,
}) {
  const formatMoney = useMoneyFormat()
  const { accounts, cards, investments, transactions } = state
  const [expandedBank, setExpandedBank] = useState(null)
  const [balanceCurrency, setBalanceCurrency] = useState(() => readPref('balance-currency', 'ALL'))

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

  // A hand-kept balance is only as good as the last time it was touched.
  const stale = staleAccounts(accounts, transactions)

  const cashTotals = sumByCurrency(accounts, currencyOf, a => a.balance)
  const currencyOptions = cashTotals.map(entry => entry.currency)
  // A saved currency can disappear when its last account is deleted.
  const activeCurrency = currencyOptions.includes(balanceCurrency) ? balanceCurrency : 'ALL'
  const heroTotals = activeCurrency === 'ALL'
    ? cashTotals
    : cashTotals.filter(entry => entry.currency === activeCurrency)

  const investTotals = sumByCurrency(investments, i => marketCurrency(i.market), i => i.cost)
  const unpaidCards = cards.filter(c => outstandingThisMonth(c, transactions) > 0)
  // What is still owed this month, so a part-paid bill keeps its remainder.
  const dueTotals = sumByCurrency(
    unpaidCards,
    card => currencyOf(accounts.find(a => a.id === card.accountId)),
    card => outstandingThisMonth(card, transactions),
  )
  const payableCards = cards.filter(c => monthlyAmountOf(c) > 0)
  const paidCount = payableCards.filter(c => isPaidThisMonth(c, transactions)).length

  const upcomingCards = cards
    .map(card => ({ card, days: daysUntilDue(card.dueDay) }))
    .filter(entry => entry.days !== null)
    .sort((a, b) => a.days - b.days)
  const nextDue = upcomingCards.find(({ card }) => outstandingThisMonth(card, transactions) > 0)

  // Totals per currency, so a bank's share is measured against its own currency.
  const currencyTotal = new Map(cashTotals.map(({ currency, total }) => [currency, total]))

  const sortedTx = transactions.slice().sort((a, b) => new Date(b.date) - new Date(a.date))
  const recentTx = sortedTx.slice(0, 5)
  const lastEntry = sortedTx[0]
    ? new Date(sortedTx[0].date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
    : null

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-[13px] text-ink-4">
            {greeting()}
            {unpaidCards.length > 0 && <> — 這個月還有 <span className="font-bold text-accent">{unpaidCards.length} 張卡</span> 沒繳</>}
          </p>
          <h1 className="text-2xl md:text-[32px] leading-tight font-extrabold text-ink tracking-tight mt-0.5">我的資產</h1>
        </div>
        <button onClick={onToggleAmounts} aria-pressed={amountsHidden}
          aria-label={amountsHidden ? '顯示金額' : '隱藏金額'}
          className="pill-outline w-10 h-10 flex items-center justify-center shrink-0 hover:bg-surface-3 transition cursor-pointer">
          {amountsHidden ? <IconEyeOff className="w-[18px] h-[18px]" /> : <IconEye className="w-[18px] h-[18px]" />}
        </button>
      </div>

      {currencyOptions.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-3.5" role="group" aria-label="顯示幣別">
          {['ALL', ...currencyOptions].map(code => (
            <button key={code} onClick={() => pickBalanceCurrency(code)} aria-pressed={activeCurrency === code}
              className={`text-[13px] font-semibold px-4 py-1.5 transition cursor-pointer ${
                activeCurrency === code ? 'pill-solid' : 'pill-outline hover:bg-surface-3'}`}>
              {code === 'ALL' ? '全部幣別' : code}
            </button>
          ))}
        </div>
      )}

      <div className={`grid grid-cols-1 gap-3.5 ${nextDue ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        <div className="md:col-span-1">
          <BalanceHero totals={heroTotals} accountCount={accounts.length} cardCount={cards.length}
            lastEntry={lastEntry} hidden={amountsHidden}
            onRecord={onRecord} onTransfer={onTransfer} onHistory={onOpenHistory} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-1 gap-3.5 md:col-span-1 mb-3.5 md:mb-0">
          <StatBlock block="brick-purple" tag="投資成本" totals={investTotals}
            footnote={`${investments.length} 檔持股`} />
          <StatBlock block="brick-blue" tag="本月待繳" totals={dueTotals}
            footnote={`${paidCount}／${payableCards.length} 已繳`}
            meter={payableCards.length > 0
              ? <Meter label="本月繳款完成度" value={paidCount} total={payableCards.length} />
              : null} />
        </div>

        {nextDue && (
          <div className="md:col-span-1 mb-5 md:mb-0">
            <div className="brick brick-plain rounded-card p-4 md:p-5 h-full flex flex-col">
              <BlockTag solid={false}>最近要繳的一筆</BlockTag>
              <div className="flex items-start justify-between gap-2 mt-3.5">
                <div className="min-w-0">
                  <div className="font-bold text-ink text-[15px] truncate">{nextDue.card.name}</div>
                  <div className="text-[12px] text-muted mt-0.5 truncate">
                    每月 {nextDue.card.dueDay} 日 · {accounts.find(a => a.id === nextDue.card.accountId)?.bank || '未綁定帳戶'} 扣款
                  </div>
                </div>
                <div className="text-[17px] font-extrabold text-ink shrink-0">
                  {formatMoney(outstandingThisMonth(nextDue.card, transactions), currencyOf(accounts.find(a => a.id === nextDue.card.accountId)))}
                </div>
              </div>
              <div className="text-[12px] font-semibold text-accent mt-2">
                {nextDue.days === 0 ? '今天到期' : `${nextDue.days} 天後到期`}
              </div>
              {nextDue.card.accountId && (
                <button onClick={() => onPayCard(nextDue.card.id)}
                  className="mt-auto pt-3 w-full">
                  <span className="block bg-solid text-on-solid rounded-tile py-3 text-sm font-bold hover:bg-solid-hover transition">
                    立即繳款
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mt-6">
        <section>
          <SectionHeader title="我的帳戶" actionLabel="全部"
            onAction={accounts.length ? () => onNavigate('accounts') : undefined} />
          {stale.length > 0 && (
            <button onClick={() => onNavigate('accounts')}
              className="brick brick-peach rounded-tile w-full text-left px-3.5 py-2.5 mb-3 cursor-pointer hover:opacity-90 transition">
              <span className="text-[12px] font-semibold">
                {stale.length} 個帳戶超過 {STALE_DAYS} 天沒有紀錄
              </span>
              <span className="block text-[11px] opacity-75 mt-0.5">
                對一下銀行的實際餘額，不符就直接改，會留下校正紀錄
              </span>
            </button>
          )}
          {accounts.length === 0 ? (
            <EmptyCard icon={<IconBank className="w-8 h-8 mx-auto" />} text="尚無帳戶" />
          ) : (
            <div className="rail rail-bleed">
              {bankOrder.map((bank, index) => {
                const bankAccounts = byBank.get(bank)
                const bankTotals = sumByCurrency(bankAccounts, currencyOf, a => a.balance)
                const cardCount = bankAccounts.reduce((sum, a) => sum + (cardsByAccount.get(a.id)?.length || 0), 0)
                const expanded = expandedBank === bank
                const lead = bankTotals[0]
                return (
                  <button key={bank} onClick={() => setExpandedBank(expanded ? null : bank)}
                    aria-expanded={expanded} aria-label={`${bank}，${bankAccounts.length} 個帳戶`}
                    className={`brick ${bankAccounts.find(a => a.color)?.color ? `brick-${bankAccounts.find(a => a.color).color}` : BANK_BLOCKS[index % BANK_BLOCKS.length]} w-48 text-left rounded-card p-4 transition cursor-pointer ${expanded ? 'shadow-card' : ''}`}>
                    <div className="flex items-center justify-between">
                      <BlockTag>{bank}</BlockTag>
                      <IconBank className="w-4 h-4" />
                    </div>
                    <div className="text-[19px] font-extrabold tracking-tight mt-3">
                      {lead ? formatMoney(lead.total, lead.currency) : '—'}
                    </div>
                    <div className="text-[11px] font-medium opacity-75">
                      {bankAccounts.length} 個帳戶{cardCount > 0 && ` · ${cardCount} 張卡`}
                    </div>
                    {lead && (
                      <Meter label="餘額佔比" value={lead.total} total={currencyTotal.get(lead.currency) || 0} />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {expandedBank && byBank.has(expandedBank) && (
            <div className="brick brick-plain rounded-card p-3 mt-3 space-y-1.5">
              {byBank.get(expandedBank).map(account => (
                <div key={account.id} className="flex items-center text-xs bg-surface-2 rounded-tile px-3 py-2">
                  {account.color && (
                    <span aria-hidden="true" className={`brick brick-${account.color} w-2 h-4 rounded-pill shrink-0 mr-1.5`} />
                  )}
                  <span className="pill-outline text-[10px] font-bold px-2 py-0.5 shrink-0">{currencyOf(account)}</span>
                  <span className="ml-2 text-ink-4 flex-1 truncate">
                    {account.lastFour && `···${account.lastFour}`}{account.purpose && ` · ${account.purpose}`}
                  </span>
                  <span className="font-bold text-ink-2">{formatMoney(account.balance, currencyOf(account))}</span>
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
                      <span className={`font-bold ${paid ? 'text-emerald-600' : 'text-ink-2'}`}>
                        {formatMoney(amount, currencyOf(accounts.find(a => a.id === card.accountId)))}
                      </span>
                    )}
                    {paid && <IconCheck className="w-3 h-3 text-emerald-600 ml-1" />}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <SectionHeader title="近期紀錄" actionLabel={`全部 ${transactions.length}`}
            onAction={transactions.length ? onOpenHistory : undefined} />
          {recentTx.length === 0 ? (
            <EmptyCard icon={<IconHistory className="w-8 h-8 mx-auto" />} text="尚無紀錄" />
          ) : (
            <div className="brick brick-plain rounded-card overflow-hidden">
              {recentTx.map(tx => (
                <div key={tx.id} className="border-t border-line first:border-t-0">
                  <TransactionRow tx={tx} state={state} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-6">
        <SectionHeader title="信用卡繳費" actionLabel="全部"
          onAction={cards.length ? () => onNavigate('cards') : undefined} />
        {upcomingCards.length === 0 ? (
          <EmptyCard
            icon={cards.length === 0 ? <IconCard className="w-8 h-8 mx-auto" /> : <IconCalendar className="w-8 h-8 mx-auto" />}
            text={cards.length === 0 ? '尚無信用卡' : '尚無繳費日設定'} />
        ) : (
          <div className="brick brick-plain rounded-card overflow-hidden">
            {upcomingCards.map(({ card, days }) => {
              const account = accounts.find(a => a.id === card.accountId)
              const amount = monthlyAmountOf(card)
              const paid = isPaidThisMonth(card, transactions)
              const owing = outstandingThisMonth(card, transactions)
              const partial = isPartiallyPaid(card, transactions)
              return (
                <div key={card.id} className="px-4 py-3 border-t border-line first:border-t-0 flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-tile border-2 border-[var(--edge)] flex items-center justify-center shrink-0 ${card.color ? `brick-${card.color}` : paid ? 'brick-green' : days <= 3 ? 'brick-peach' : 'brick-plain'}`}>
                    {paid ? <IconCheck className="w-4 h-4" /> : <IconCard className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-ink text-sm truncate">{card.name}</div>
                    <div className="text-[11px] text-muted truncate">
                      {card.issuer || ''}{account ? ` → ${account.bank}` : ' · 未綁定帳戶'} · 每月 {card.dueDay} 日
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-ink text-sm">
                      {amount > 0 ? formatMoney(paid ? amount : owing, currencyOf(account)) : '--'}
                    </div>
                    {paid
                      ? <span className="text-[11px] font-semibold text-emerald-600">已繳清</span>
                      : partial
                      ? <span className="text-[11px] font-semibold text-accent">部分已繳</span>
                      : <span className={`text-[11px] font-semibold ${days <= 3 ? 'text-accent' : 'text-muted'}`}>
                          {days === 0 ? '今天' : `${days} 天後`}
                        </span>}
                  </div>
                  {!paid && amount > 0 && card.accountId && (
                    <button onClick={() => onPayCard(card.id)}
                      className="pill-solid text-[12px] font-semibold px-3.5 py-1.5 shrink-0 cursor-pointer hover:opacity-85 transition">
                      繳款
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {accounts.length === 0 && cards.length === 0 && (
        <div className="text-center py-12 mt-4">
          <p className="text-base font-bold text-ink-3 mb-1">開始管理你的財務</p>
          <p className="text-sm text-muted">先到「銀行帳戶」新增帳戶，再到「信用卡」新增卡片</p>
        </div>
      )}
    </div>
  )
}
