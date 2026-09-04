import { useState } from 'react'
import { genId } from '../lib/id'
import { num, round2 } from '../lib/money'
import { currencyOf } from '../lib/currency'
import { marketCurrency } from '../lib/ledger'
import { useMoneyFormat } from '../lib/moneyDisplay'
import { Modal, ConfirmDialog, TextField, SelectField, PrimaryButton, GhostButton, ErrorNote } from './ui'
import { IconTrendUp, IconEdit, IconTrash, IconPlus, IconMinus } from './icons'

const SKINS = {
  tw: ['brick-purple', 'brick-blue', 'brick-green', 'brick-yellow', 'brick-peach', 'brick-plain'],
  us: ['brick-blue', 'brick-green', 'brick-yellow', 'brick-purple', 'brick-peach', 'brick-plain'],
}
const ICON_BG = {
  tw: ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-fuchsia-500'],
  us: ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-cyan-500'],
}

const emptyStock = { name: '', market: 'tw', shares: '', cost: '', note: '' }
const marketLabel = (market) => (market === 'us' ? '美股' : '台股')

export default function InvestmentManager({ investments, accounts, onChange, onInvestTx }) {
  const formatMoney = useMoneyFormat()
  const [market, setMarket] = useState('tw')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyStock)
  const [txModal, setTxModal] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const holdings = investments.filter(inv => inv.market === market)
  const currency = marketCurrency(market)
  const totalCost = holdings.reduce((sum, inv) => sum + num(inv.cost), 0)

  const startAdd = () => { setForm({ ...emptyStock, market }); setEditing('new') }
  const startEdit = (inv) => {
    setForm({ name: inv.name, market: inv.market, shares: String(inv.shares ?? ''), cost: String(inv.cost ?? ''), note: inv.note || '' })
    setEditing(inv.id)
  }

  const save = () => {
    const name = form.name.trim()
    if (!name) return
    const next = { ...form, name, shares: round2(num(form.shares)), cost: round2(num(form.cost)) }
    onChange(editing === 'new'
      ? [...investments, { ...next, id: genId() }]
      : investments.map(inv => (inv.id === editing ? { ...inv, ...next } : inv)))
    setEditing(null)
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-ink">投資</h1>
          <p className="text-muted text-sm mt-1">{marketLabel(market)}持倉</p>
          {holdings.length > 0 && (
            <p className="text-xs text-ink-4 mt-2">
              <span className="text-muted">總成本 {currency}</span>{' '}
              <span className="font-semibold text-ink-2">{formatMoney(totalCost, currency)}</span>
            </p>
          )}
        </div>
        <button onClick={startAdd}
          className="inline-flex items-center justify-center gap-1.5 bg-solid text-on-solid w-11 h-11 md:w-auto md:h-auto md:px-5 md:py-3 rounded-pill text-sm font-medium hover:bg-solid-hover transition cursor-pointer shadow-card shrink-0">
          <IconPlus className="w-5 h-5 md:w-4 md:h-4" />
          <span className="hidden md:inline">新增</span>
          <span className="sr-only md:hidden">新增持股</span>
        </button>
      </div>

      <div role="tablist" aria-label="市場" className="flex bg-surface-3 rounded-pill p-1 mb-5">
        {['tw', 'us'].map(value => (
          <button key={value} role="tab" aria-selected={market === value} onClick={() => setMarket(value)}
            className={`flex-1 py-2 rounded-pill text-sm font-medium transition cursor-pointer ${
              market === value
                ? `bg-surface shadow-sm ${value === 'tw' ? 'text-violet-500' : 'text-blue-500'}`
                : 'text-ink-4'}`}>
            {marketLabel(value)}
          </button>
        ))}
      </div>

      {holdings.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 tint-violet rounded-card flex items-center justify-center mx-auto mb-4">
            <IconTrendUp className="w-8 h-8" />
          </div>
          <p className="text-muted text-sm">尚未新增{marketLabel(market)}持股</p>
          <p className="text-faint text-xs mt-1">點擊右上角「新增」開始追蹤</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holdings.map((inv, index) => (
            <div key={inv.id} className={`brick ${SKINS[market][index % 6]} rounded-card p-5 relative group overflow-hidden`}>
              <div className="absolute -bottom-4 -right-4 opacity-[0.06]" aria-hidden="true">
                <IconTrendUp className="w-24 h-24" />
              </div>
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`${ICON_BG[market][index % 6]} w-9 h-9 rounded-tile flex items-center justify-center text-white shadow-sm text-xs font-bold`}>
                    {market === 'tw' ? '台' : 'US'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-ink-2 text-sm truncate">{inv.name}</div>
                    {inv.note && <div className="text-[11px] text-ink-4 truncate">{inv.note}</div>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <div className="text-lg font-bold text-ink-2">
                      {num(inv.shares).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </div>
                    <div className="text-[10px] text-muted">總股數</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-ink-2">{formatMoney(inv.cost, currency)}</div>
                    <div className="text-[10px] text-muted">總成本</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity">
                  <CardAction onClick={() => setTxModal({ stock: inv, type: 'buy' })} className="text-emerald-600"><IconPlus className="w-3.5 h-3.5" /> 買進</CardAction>
                  <CardAction onClick={() => setTxModal({ stock: inv, type: 'sell' })} className="text-red-500"><IconMinus className="w-3.5 h-3.5" /> 賣出</CardAction>
                  <CardAction onClick={() => startEdit(inv)} className="text-ink-4"><IconEdit className="w-3.5 h-3.5" /> 編輯</CardAction>
                  <CardAction onClick={() => setDeleting(inv)} className="text-red-500"><IconTrash className="w-3.5 h-3.5" /> 刪除</CardAction>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <Modal title={editing === 'new' ? '新增持股' : '編輯持股'} onClose={() => setEditing(null)}
          tint="tint-violet" icon={<IconTrendUp className="w-5 h-5" />}
          subtitle="手動調整不會動到銀行帳戶餘額"
          footer={<><PrimaryButton onClick={save} disabled={!form.name.trim()}>儲存</PrimaryButton><GhostButton onClick={() => setEditing(null)}>取消</GhostButton></>}>
          <div className="space-y-3">
            <TextField label="股票 / ETF 名稱 *" placeholder="例：0050、AAPL" value={form.name}
              onChange={v => setForm(f => ({ ...f, name: v }))} />
            <SelectField label="市場" value={form.market} onChange={v => setForm(f => ({ ...f, market: v }))}>
              <option value="tw">台股（TWD）</option>
              <option value="us">美股（USD）</option>
            </SelectField>
            <TextField label="總股數" placeholder="1000" type="number" step="any" value={form.shares}
              onChange={v => setForm(f => ({ ...f, shares: v }))} />
            <TextField label="總成本" placeholder="50000" type="number" step="any" value={form.cost}
              onChange={v => setForm(f => ({ ...f, cost: v }))} />
            <TextField label="備註（選填）" placeholder="長期持有" value={form.note}
              onChange={v => setForm(f => ({ ...f, note: v }))} />
          </div>
        </Modal>
      )}

      {txModal && (
        <InvestTxModal stock={txModal.stock} type={txModal.type} accounts={accounts}
          onSubmit={(data) => { if (onInvestTx(data)) setTxModal(null) }}
          onClose={() => setTxModal(null)} />
      )}

      {deleting && (
        <ConfirmDialog title="刪除持股"
          message={`確定要刪除「${deleting.name}」嗎？`}
          detail="過去的買賣紀錄會保留，但這檔持股的股數與成本會消失。"
          onConfirm={() => onChange(investments.filter(inv => inv.id !== deleting.id))}
          onClose={() => setDeleting(null)} />
      )}
    </div>
  )
}

function CardAction({ onClick, className, children }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-pill veil transition cursor-pointer ${className}`}>
      {children}
    </button>
  )
}

function InvestTxModal({ stock, type, accounts, onSubmit, onClose }) {
  const formatMoney = useMoneyFormat()
  const [accountId, setAccountId] = useState('')
  const [shares, setShares] = useState('')
  const [amount, setAmount] = useState('')
  const [fee, setFee] = useState('')
  const [error, setError] = useState('')

  const isBuy = type === 'buy'
  const currency = marketCurrency(stock.market)
  // 台股 settles in TWD, 美股 in USD — anything else would silently mix currencies.
  const eligible = accounts.filter(a => currencyOf(a) === currency)

  const submit = () => {
    setError('')
    const shareCount = num(shares)
    const value = num(amount)
    const feeValue = num(fee)
    if (!(shareCount > 0)) return setError('請輸入有效股數')
    if (!(value > 0)) return setError('請輸入有效金額')
    if (!accountId) return setError('請選擇帳戶')
    if (feeValue < 0) return setError('手續費不可為負數')
    onSubmit({ type, stockId: stock.id, accountId, shares: shareCount, amount: value, fee: feeValue })
  }

  const netAmount = isBuy ? num(amount) + num(fee) : num(amount) - num(fee)

  return (
    <Modal title={`${isBuy ? '買進' : '賣出'} ${stock.name}`}
      subtitle={`目前持有 ${num(stock.shares).toLocaleString(undefined, { maximumFractionDigits: 4 })} 股`}
      onClose={onClose} tint={isBuy ? 'tint-emerald' : 'tint-red'}
      icon={isBuy ? <IconPlus className="w-5 h-5" /> : <IconMinus className="w-5 h-5" />}
      footer={
        <>
          <button onClick={submit} disabled={eligible.length === 0}
            className={`flex-1 py-3 rounded-pill text-sm font-medium transition cursor-pointer text-white disabled:opacity-40 disabled:cursor-not-allowed ${isBuy ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
            確認{isBuy ? '買進' : '賣出'}
          </button>
          <GhostButton onClick={onClose}>取消</GhostButton>
        </>
      }>
      <div className="space-y-4">
        <SelectField label={`${isBuy ? '扣款' : '入帳'}帳戶（${currency}）`} value={accountId} onChange={setAccountId}
          hint={eligible.length === 0 ? `尚無 ${currency} 帳戶，請先到「銀行帳戶」新增` : undefined}>
          <option value="">-- 請選擇 --</option>
          {eligible.map(account => (
            <option key={account.id} value={account.id}>
              {account.bank}{account.lastFour ? ` ···${account.lastFour}` : ''} — {formatMoney(account.balance, currency)}
            </option>
          ))}
        </SelectField>

        <TextField label="股數" type="number" step="any" min="0" placeholder="輸入股數" value={shares} onChange={setShares} />

        <TextField label={isBuy ? '成交金額' : '成交金額（含損益）'} type="number" step="any" min="0"
          placeholder={isBuy ? '不含手續費' : '不含手續費'} value={amount} onChange={setAmount}
          hint={isBuy ? undefined : '賣出金額可自行填寫，反映實際損益'} />

        <TextField label="手續費" type="number" step="any" min="0" placeholder="0" value={fee} onChange={setFee}
          hint={num(amount) > 0 && num(fee) > 0
            ? `實際${isBuy ? '扣款' : '入帳'}：${formatMoney(netAmount, currency)}`
            : undefined} />

        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  )
}
