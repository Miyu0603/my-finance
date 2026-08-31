import { describeTransaction } from './transactionView'
import { useMoneyFormat } from '../lib/moneyDisplay'
import { IconUndo } from './icons'

const shortDate = (iso) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '--' : `${date.getMonth() + 1}/${date.getDate()}`
}

export default function TransactionRow({ tx, state, onRevert, showDetail = false }) {
  const formatMoney = useMoneyFormat()
  const view = describeTransaction(tx, state, formatMoney)
  return (
    <div className="flex items-center px-3 md:px-4 py-2.5 text-xs">
      <div className={`w-7 h-7 rounded-pill flex items-center justify-center shrink-0 ${view.tint}`}>{view.icon}</div>
      <div className="ml-2 flex-1 min-w-0">
        <div className="text-ink-3 truncate">{view.title}</div>
        {showDetail && view.detail && <div className="text-muted text-[11px] truncate">{view.detail}</div>}
      </div>
      <span className="text-muted mx-2 shrink-0">{shortDate(tx.date)}</span>
      <span className={`font-medium shrink-0 ${view.amountClass}`}>{view.amount}</span>
      {onRevert && (
        <button onClick={() => onRevert(tx)} aria-label={`復原：${view.title}`} title="復原這筆紀錄"
          className="ml-2 w-7 h-7 rounded-pill bg-surface-3 hover:bg-surface-4 flex items-center justify-center text-muted hover:text-red-500 cursor-pointer transition shrink-0">
          <IconUndo className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
