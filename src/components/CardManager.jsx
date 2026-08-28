import { useState } from 'react'
import { genId } from '../lib/id'

import { currencyOf, formatMoney, sumByCurrency } from '../lib/currency'
import { daysUntilDue, isPaidThisMonth, monthlyAmountOf } from '../lib/cards'
import { Modal, ConfirmDialog, TextField, SelectField, PrimaryButton, GhostButton } from './ui'
import { IconCard, IconEdit, IconTrash, IconCheck } from './icons'

const SKINS = ['skin-purple', 'skin-rose', 'skin-emerald', 'skin-amber', 'skin-blue', 'skin-fuchsia']
const ICON_BG = ['bg-violet-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-fuchsia-500']

const emptyCard = { name: '', issuer: '', accountId: '', dueDay: '', annualFee: '', note: '', monthlyAmount: '' }

export default function CardManager({ cards, accounts, onChange, onPayCard }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyCard)
  const [deleting, setDeleting] = useState(null)

  const startAdd = () => { setForm(emptyCard); setEditing('new') }
  const startEdit = (card) => {
    setForm({
      name: card.name, issuer: card.issuer, accountId: card.accountId || '', dueDay: card.dueDay || '',
      annualFee: card.annualFee || '', note: card.note || '', monthlyAmount: card.monthlyAmount || '',
    })
    setEditing(card.id)
  }

  const save = () => {
    const name = form.name.trim()
    if (!name) return
    const next = { ...form, name, issuer: form.issuer.trim() }
    onChange(editing === 'new'
      ? [...cards, { ...next, id: genId(), lastPaidDate: null }]
      : cards.map(c => (c.id === editing ? { ...c, ...next } : c)))
    setEditing(null)
  }

  const accountOf = (card) => accounts.find(a => a.id === card.accountId) || null
  const currencyFor = (card) => currencyOf(accountOf(card))

  // Cards can be settled from accounts in different currencies, so never one total.
  const dueTotals = sumByCurrency(
    cards.filter(c => monthlyAmountOf(c) > 0 && !isPaidThisMonth(c)),
    currencyFor,
    monthlyAmountOf,
  )
  const linkedCount = cards.filter(c => c.accountId).length

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-ink">信用卡</h1>
          <p className="text-muted text-sm mt-1">
            共 {cards.length} 張{linkedCount > 0 && `，${linkedCount} 張已綁定扣款帳戶`}
          </p>
          {dueTotals.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {dueTotals.map(({ currency, total }) => (
                <span key={currency} className="text-xs text-ink-4">
                  <span className="text-muted">本月待繳 {currency}</span>{' '}
                  <span className="font-semibold text-ink-2">{formatMoney(total, currency)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <button onClick={startAdd}
          className="bg-solid text-on-solid px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-sm font-medium hover:bg-solid-hover transition shadow-lg shadow-black/10 cursor-pointer shrink-0">
          <span className="md:hidden" aria-hidden="true">+</span>
          <span className="hidden md:inline">+ 新增</span>
          <span className="sr-only md:hidden">新增信用卡</span>
        </button>
      </div>

      {editing !== null && (
        <Modal title={editing === 'new' ? '新增信用卡' : '編輯信用卡'} onClose={() => setEditing(null)}
          tint="tint-violet" icon={<IconCard className="w-5 h-5" />}
          footer={<><PrimaryButton onClick={save} disabled={!form.name.trim()}>儲存</PrimaryButton><GhostButton onClick={() => setEditing(null)}>取消</GhostButton></>}>
          <div className="space-y-3">
            <TextField label="卡片名稱 *" placeholder="LINE Pay 信用卡" value={form.name}
              onChange={v => setForm(f => ({ ...f, name: v }))} />
            <TextField label="發卡銀行" placeholder="中國信託" value={form.issuer}
              onChange={v => setForm(f => ({ ...f, issuer: v }))} />
            <SelectField label="繳款扣款帳戶" value={form.accountId}
              onChange={v => setForm(f => ({ ...f, accountId: v }))}>
              <option value="">-- 請選擇 --</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.bank}{account.lastFour ? ` ···${account.lastFour}` : ''} — {formatMoney(account.balance, currencyOf(account))}
                </option>
              ))}
            </SelectField>
            <TextField label="本月應繳金額" placeholder="3500" value={form.monthlyAmount} type="number" step="any"
              hint="只是預設值，實際繳款時可以修改"
              onChange={v => setForm(f => ({ ...f, monthlyAmount: v }))} />
            <div className="flex gap-3">
              <div className="flex-1">
                <TextField label="繳費日（幾號）" placeholder="15" value={form.dueDay} type="number" min="1" max="31"
                  onChange={v => setForm(f => ({ ...f, dueDay: v }))} />
              </div>
              <div className="flex-1">
                <TextField label="年費" placeholder="0" value={form.annualFee} type="number" step="any"
                  onChange={v => setForm(f => ({ ...f, annualFee: v }))} />
              </div>
            </div>
            <TextField label="備註" placeholder="海外 3% 回饋" value={form.note}
              onChange={v => setForm(f => ({ ...f, note: v }))} />
          </div>
        </Modal>
      )}

      {cards.length === 0 ? (
        <div className="text-center py-16 text-faint">
          <IconCard className="w-12 h-12 mx-auto mb-4" />
          <p className="text-sm">還沒有信用卡，點擊「新增」開始吧</p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => {
            const paid = isPaidThisMonth(card)
            const days = daysUntilDue(card.dueDay)
            const amount = monthlyAmountOf(card)
            const account = accountOf(card)
            return (
              <div key={card.id} className={`${SKINS[index % SKINS.length]} skin rounded-2xl p-4 hover:shadow-md transition group relative overflow-hidden`}>
                <div className="absolute -right-4 -bottom-4 opacity-[0.06]" aria-hidden="true">
                  <IconCard className="w-20 h-20" />
                </div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`${ICON_BG[index % ICON_BG.length]} w-8 h-8 rounded-lg flex items-center justify-center text-white`}>
                      <IconCard className="w-4 h-4" />
                    </div>
                    <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition">
                      <button onClick={() => startEdit(card)} aria-label={`編輯 ${card.name}`}
                        className="w-7 h-7 rounded-lg bg-surface/80 hover:bg-surface flex items-center justify-center text-muted hover:text-ink-3 cursor-pointer transition">
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleting(card)} aria-label={`刪除 ${card.name}`}
                        className="w-7 h-7 rounded-lg bg-surface/80 hover:bg-surface flex items-center justify-center text-muted hover:text-red-500 cursor-pointer transition">
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="font-semibold text-ink-2 text-sm">{card.name}</div>
                  {card.issuer && <div className="text-[11px] text-ink-4">{card.issuer}</div>}

                  <div className="mt-2">
                    <div className="text-[10px] text-muted">本月應繳</div>
                    <div className="text-lg font-bold text-ink-2">
                      {amount > 0 ? formatMoney(amount, currencyFor(card)) : '--'}
                    </div>
                  </div>

                  <div className="space-y-1 mt-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted">扣款</span>
                      <span className="font-medium text-ink-3 bg-surface/60 px-1.5 py-0.5 rounded-full truncate">
                        {account ? `${account.bank}${account.lastFour ? ` ···${account.lastFour}` : ''}` : '未設定'}
                      </span>
                    </div>
                    {days !== null && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted">繳費日</span>
                        <span className={`font-medium ${days === 0 ? 'text-red-500' : 'text-ink-3'}`}>
                          每月 {card.dueDay} 號{days === 0 ? '（今天）' : ` · ${days} 天後`}
                        </span>
                      </div>
                    )}
                  </div>

                  {amount > 0 && card.accountId && (
                    <div className="mt-2">
                      {paid ? (
                        <p className="flex items-center gap-1 text-[11px] tint-emerald px-2.5 py-1 rounded-lg">
                          <IconCheck className="w-3 h-3" /><span className="font-medium">本月已繳</span>
                        </p>
                      ) : (
                        <button onClick={() => onPayCard(card.id)}
                          className={`w-full text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition cursor-pointer ${days === 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-surface/70 text-ink-3 hover:bg-surface'}`}>
                          {days === 0 ? '今天到期 — 立即繳款' : '手動繳款'}
                        </button>
                      )}
                    </div>
                  )}

                  {card.note && <p className="text-muted text-[10px] mt-1.5 truncate">{card.note}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {deleting && (
        <ConfirmDialog title="刪除信用卡"
          message={`確定要刪除「${deleting.name}」嗎？`}
          detail="過去的繳款紀錄會保留在歷史中。"
          onConfirm={() => onChange(cards.filter(c => c.id !== deleting.id))}
          onClose={() => setDeleting(null)} />
      )}
    </div>
  )
}
