import { useState } from 'react'
import { genId } from '../lib/id'
import { num, round2 } from '../lib/money'
import { CURRENCIES, currencyOf, sumByCurrency } from '../lib/currency'
import { useMoneyFormat } from '../lib/moneyDisplay'
import { Modal, ConfirmDialog, TextField, SelectField, PrimaryButton, GhostButton } from './ui'
import { IconBank, IconEdit, IconTrash, IconTransfer, IconReceipt, IconExchange, IconPlus, IconDots } from './icons'

const ICON_BG = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']

const emptyAccount = { bank: '', lastFour: '', purpose: '', note: '', balance: '', currency: 'TWD' }

export default function AccountManager({ accounts, onSave, onRemove, onTransfer, onTransaction, onExchange }) {
  const formatMoney = useMoneyFormat()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyAccount)
  const [deleting, setDeleting] = useState(null)
  const [actionsFor, setActionsFor] = useState(null)

  const startAdd = () => { setForm(emptyAccount); setEditing('new') }
  const startEdit = (account) => {
    setForm({
      bank: account.bank, lastFour: account.lastFour, purpose: account.purpose,
      note: account.note || '', balance: String(account.balance ?? ''), currency: currencyOf(account),
    })
    setEditing(account.id)
  }

  const save = () => {
    const bank = form.bank.trim()
    if (!bank) return
    // Bank name is the grouping key, so it is trimmed before it ever reaches state.
    onSave({ ...form, bank, balance: round2(num(form.balance)), id: editing === 'new' ? genId() : editing }, editing)
    setEditing(null)
  }

  const groups = []
  const byBank = new Map()
  accounts.forEach(account => {
    if (!byBank.has(account.bank)) { byBank.set(account.bank, []); groups.push(account.bank) }
    byBank.get(account.bank).push(account)
  })

  const totals = sumByCurrency(accounts, currencyOf, a => a.balance)

  // Exchange needs a same-bank account in a *different* currency to land in.
  const exchangeTargets = (account) =>
    accounts.filter(a => a.bank === account.bank && a.id !== account.id && currencyOf(a) !== currencyOf(account))

  /** One definition of what you can do to an account, rendered two ways. */
  const actionsFor_ = (account) => {
    const currency = currencyOf(account)
    const list = [
      { id: 'record', label: '記帳', hover: 'hover:text-emerald-500', tint: 'tint-emerald',
        icon: <IconReceipt className="w-4 h-4" />, run: () => onTransaction(account) },
    ]
    if (exchangeTargets(account).length > 0) {
      list.push({ id: 'exchange', label: '換匯', hover: 'hover:text-amber-500', tint: 'tint-amber',
        icon: <IconExchange className="w-4 h-4" />, run: () => onExchange(account) })
    }
    if (accounts.some(a => a.id !== account.id && currencyOf(a) === currency)) {
      list.push({ id: 'transfer', label: '轉帳', hover: 'hover:text-indigo-500', tint: 'tint-indigo',
        icon: <IconTransfer className="w-4 h-4" />, run: () => onTransfer(account.id) })
    }
    list.push({ id: 'edit', label: '編輯', hover: 'hover:text-ink-3', tint: 'tint-neutral',
      icon: <IconEdit className="w-4 h-4" />, run: () => startEdit(account) })
    list.push({ id: 'delete', label: '刪除', hover: 'hover:text-red-500', tint: 'tint-red',
      icon: <IconTrash className="w-4 h-4" />, run: () => setDeleting(account) })
    return list
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-ink">銀行帳戶</h1>
          <p className="text-muted text-sm mt-1">管理你的所有銀行帳戶</p>
          {totals.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {totals.map(({ currency, total }) => (
                <span key={currency} className="text-xs text-ink-4">
                  <span className="text-muted">{currency}</span>{' '}
                  <span className="font-semibold text-ink-2">{formatMoney(total, currency)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <button onClick={startAdd}
          className="bg-solid text-on-solid w-11 h-11 md:w-auto md:h-auto md:px-5 md:py-3 rounded-pill text-sm font-medium hover:bg-solid-hover transition shadow-card cursor-pointer shrink-0 inline-flex items-center justify-center">
          <IconPlus className="w-5 h-5 md:hidden" />
          <span className="hidden md:inline">+ 新增</span>
          <span className="sr-only md:hidden">新增帳戶</span>
        </button>
      </div>

      {editing !== null && (
        <Modal title={editing === 'new' ? '新增銀行帳戶' : '編輯銀行帳戶'} onClose={() => setEditing(null)}
          tint="tint-blue" icon={<IconBank className="w-5 h-5" />}
          footer={<><PrimaryButton onClick={save} disabled={!form.bank.trim()}>儲存</PrimaryButton><GhostButton onClick={() => setEditing(null)}>取消</GhostButton></>}>
          <div className="space-y-3">
            <TextField label="銀行名稱 *" placeholder="例：中國信託" value={form.bank}
              onChange={v => setForm(f => ({ ...f, bank: v }))} />
            <SelectField label="幣別" value={form.currency} onChange={v => setForm(f => ({ ...f, currency: v }))}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </SelectField>
            <TextField label="帳號末四碼" placeholder="1234" value={form.lastFour} inputMode="numeric"
              onChange={v => setForm(f => ({ ...f, lastFour: v.replace(/\D/g, '').slice(0, 4) }))} />
            <TextField label="帳戶餘額" placeholder="50000" value={form.balance} type="number" step="any"
              hint={editing === 'new' ? undefined : '直接修改餘額會留下一筆「餘額校正」紀錄'}
              onChange={v => setForm(f => ({ ...f, balance: v }))} />
            <TextField label="用途" placeholder="薪轉戶、儲蓄" value={form.purpose}
              onChange={v => setForm(f => ({ ...f, purpose: v }))} />
            <TextField label="備註" placeholder="任何補充" value={form.note}
              onChange={v => setForm(f => ({ ...f, note: v }))} />
          </div>
        </Modal>
      )}

      {accounts.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <IconBank className="w-12 h-12 mx-auto mb-4" />
          <p className="text-sm">還沒有帳戶，點擊上方「新增」開始吧</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((bankName, groupIndex) => (
            <section key={bankName} className="brick brick-plain rounded-card overflow-hidden">
              <h2 className="flex items-center gap-2.5 px-4 py-3 border-b border-line">
                <span className={`${ICON_BG[groupIndex % ICON_BG.length]} w-8 h-8 rounded-pill flex items-center justify-center text-white`}>
                  <IconBank className="w-4 h-4" />
                </span>
                <span className="font-semibold text-ink-2 text-sm">{bankName}</span>
                <span className="text-xs text-muted font-normal">{byBank.get(bankName).length} 個帳戶</span>
              </h2>
              <div>
                {byBank.get(bankName).map(account => {
                  const currency = currencyOf(account)
                  const label = `${bankName} ${currency}${account.lastFour ? ` ···${account.lastFour}` : ''}`
                  return (
                    <div key={account.id} className="flex items-center px-4 py-3 border-t border-line-soft first:border-t-0 hover:bg-surface-2 transition group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${currency === 'TWD' ? 'tint-blue' : 'tint-amber'}`}>{currency}</span>
                          <span className="text-sm font-medium text-ink-3 truncate">
                            {account.lastFour && <span className="text-muted font-mono text-xs mr-1.5">···{account.lastFour}</span>}
                            {account.purpose || (currency === 'TWD' ? '台幣帳戶' : '外幣帳戶')}
                          </span>
                        </div>
                        {account.note && <p className="text-muted text-[11px] mt-0.5 truncate pl-0.5">{account.note}</p>}
                      </div>
                      <div className="text-right mr-2 text-sm font-bold text-ink-2">
                        {formatMoney(account.balance, currency)}
                      </div>
                      {/* Five 28px buttons left the account name 14px wide on a
                          phone, so they collapse into one sheet below md. */}
                      <div className="hidden md:flex gap-1 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition shrink-0">
                        {actionsFor_(account).map(action => (
                          <IconAction key={action.id} label={`${action.label} ${label}`} onClick={action.run} hover={action.hover}>
                            {action.icon}
                          </IconAction>
                        ))}
                      </div>
                      <button onClick={() => setActionsFor(account)} aria-label={`${label} 的操作`}
                        className="md:hidden w-9 h-9 rounded-pill bg-surface-3 hover:bg-surface-4 flex items-center justify-center text-ink-4 cursor-pointer transition shrink-0">
                        <IconDots className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {actionsFor && (
        <Modal title={`${actionsFor.bank}${actionsFor.lastFour ? ` ···${actionsFor.lastFour}` : ''}`}
          subtitle={`${currencyOf(actionsFor)} · ${formatMoney(actionsFor.balance, currencyOf(actionsFor))}`}
          onClose={() => setActionsFor(null)} tint="tint-blue" icon={<IconBank className="w-5 h-5" />}>
          <div className="space-y-2">
            {actionsFor_(actionsFor).map(action => (
              <button key={action.id} onClick={() => { setActionsFor(null); action.run() }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-tile bg-surface-2 hover:bg-surface-3 transition cursor-pointer text-left">
                <span className={`w-9 h-9 rounded-pill flex items-center justify-center shrink-0 ${action.tint}`}>
                  {action.icon}
                </span>
                <span className="text-sm font-medium text-ink-2">{action.label}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog title="刪除帳戶"
          message={`確定要刪除「${deleting.bank}${deleting.lastFour ? ` ···${deleting.lastFour}` : ''}」嗎？餘額 ${formatMoney(deleting.balance, currencyOf(deleting))} 會一併消失。`}
          detail="綁定這個帳戶的信用卡會變回未綁定，過去的交易紀錄會保留。"
          onConfirm={() => onRemove(deleting.id)}
          onClose={() => setDeleting(null)} />
      )}
    </div>
  )
}

function IconAction({ label, onClick, hover, children }) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      className={`w-7 h-7 rounded-pill bg-surface-3 hover:bg-surface-4 flex items-center justify-center text-muted cursor-pointer transition ${hover}`}>
      {children}
    </button>
  )
}
