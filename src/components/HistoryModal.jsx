import { useState, useMemo } from 'react'
import { Modal, ConfirmDialog, GhostButton } from './ui'
import TransactionRow from './TransactionRow'
import { describeTransaction } from './transactionView'
import { useMoneyFormat } from '../lib/moneyDisplay'
import { IconHistory } from './icons'

const FILTERS = [
  { id: 'all', label: '全部', match: () => true },
  { id: 'cash', label: '收支', match: t => t.type === 'income' || t.type === 'expense' },
  { id: 'move', label: '轉帳換匯', match: t => t.type === 'transfer' || t.type === 'exchange' },
  { id: 'invest', label: '投資', match: t => t.type === 'invest-buy' || t.type === 'invest-sell' },
  { id: 'card', label: '信用卡', match: t => t.type === 'card-payment' },
]

const dayKey = (iso) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '未知日期'
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

export default function HistoryModal({ state, onRevert, onClose }) {
  const formatMoney = useMoneyFormat()
  const [filter, setFilter] = useState('all')
  const [reverting, setReverting] = useState(null)

  const grouped = useMemo(() => {
    const match = FILTERS.find(f => f.id === filter).match
    const rows = state.transactions.filter(match).slice().sort((a, b) => new Date(b.date) - new Date(a.date))
    const days = []
    const byDay = new Map()
    rows.forEach(tx => {
      const key = dayKey(tx.date)
      if (!byDay.has(key)) { byDay.set(key, []); days.push(key) }
      byDay.get(key).push(tx)
    })
    return days.map(day => [day, byDay.get(day)])
  }, [state.transactions, filter])

  return (
    <Modal title="全部紀錄" subtitle={`共 ${state.transactions.length} 筆 · 復原會同時回沖餘額`}
      onClose={onClose} tint="tint-neutral" icon={<IconHistory className="w-5 h-5" />}
      footer={<GhostButton onClick={onClose}>關閉</GhostButton>}>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {FILTERS.map(item => (
          <button key={item.id} onClick={() => setFilter(item.id)} aria-pressed={filter === item.id}
            className={`px-3 py-1.5 rounded-pill text-xs font-medium transition cursor-pointer ${
              filter === item.id ? 'bg-solid text-on-solid' : 'bg-surface-3 text-ink-4 hover:bg-surface-4'}`}>
            {item.label}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <p className="text-center text-muted text-sm py-10">沒有符合的紀錄</p>
      ) : (
        <div className="max-h-[55vh] overflow-y-auto -mx-1 px-1">
          {grouped.map(([day, rows]) => (
            <section key={day} className="mb-3">
              <h3 className="text-[11px] font-medium text-muted px-3 md:px-4 mb-1">{day}</h3>
              <div className="bg-surface-2 rounded-tile overflow-hidden">
                {rows.map(tx => (
                  <TransactionRow key={tx.id} tx={tx} state={state} showDetail onRevert={setReverting} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {reverting && (
        <ConfirmDialog title="復原這筆紀錄"
          message={`「${describeTransaction(reverting, state, formatMoney).title}」會被刪除，相關帳戶餘額與持股會回到這筆紀錄之前的狀態。`}
          detail="如果之後還有其他紀錄動到同一個帳戶，餘額會以差額方式回沖。"
          confirmLabel="復原"
          onConfirm={() => onRevert(reverting.id)}
          onClose={() => setReverting(null)} />
      )}
    </Modal>
  )
}
