import { useState, useEffect } from 'react'
import './index.css'
import Dashboard from './components/Dashboard'
import AccountManager from './components/AccountManager'
import CardManager from './components/CardManager'
import InvestmentManager from './components/InvestmentManager'
import SettingsPage from './components/SettingsPage'
import TransferModal from './components/TransferModal'
import TransactionModal from './components/TransactionModal'
import ExchangeModal from './components/ExchangeModal'
import CardPaymentModal from './components/CardPaymentModal'
import HistoryModal from './components/HistoryModal'
import LockScreen from './components/LockScreen'
import { isFaceIdEnabled } from './lib/faceId'
import { loadState, saveState } from './lib/storage'
import {
  applyTransfer, applyCashTx, applyExchange, applyInvestTx,
  applyCardPayment, applyBalanceAdjustment, revertTransaction, deleteAccount,
} from './lib/ledger'
import { IconHome, IconBank, IconCard, IconSettings, IconChevronLeft, IconTrendUp, IconCheck, IconWarning } from './components/icons'

const NAV_ITEMS = [
  { id: 'dashboard', label: '總覽', Icon: IconHome },
  { id: 'accounts', label: '銀行帳戶', Icon: IconBank },
  { id: 'investments', label: '投資', Icon: IconTrendUp },
  { id: 'cards', label: '信用卡', Icon: IconCard },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [state, setState] = useState(loadState)
  const [collapsed, setCollapsed] = useState(true)
  const [toast, setToast] = useState(null)
  const [transferFromId, setTransferFromId] = useState(null)
  const [transactionAccount, setTransactionAccount] = useState(null)
  const [exchangeAccount, setExchangeAccount] = useState(null)
  const [payingCardId, setPayingCardId] = useState(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [locked, setLocked] = useState(() => isFaceIdEnabled())
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('dark-mode') === 'true')

  useEffect(() => {
    localStorage.setItem('dark-mode', darkMode)
    document.documentElement.classList.toggle('dark', darkMode)
    // Match the page ground so the status bar blends into the app.
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', darkMode ? '#100d1a' : '#f6f4fc')
  }, [darkMode])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), toast.kind === 'error' ? 6000 : 3000)
    return () => clearTimeout(timer)
  }, [toast])

  /**
   * Persisting happens here rather than in an effect, so a failed write is
   * reported as part of the action that caused it instead of one render later.
   */
  const commit = (next) => {
    setState(next)
    const failure = saveState(next)
    if (failure) setToast({ kind: 'error', text: failure })
  }

  /**
   * Single funnel for every money-moving action: ledger rules throw a
   * LedgerError with a human message, which becomes a toast instead of a crash.
   * Returns whether the action went through, so modals know when to close.
   */
  const runLedger = (mutate, successText) => {
    try {
      commit(mutate(state))
      if (successText) setToast({ kind: 'ok', text: successText })
      return true
    } catch (err) {
      setToast({ kind: 'error', text: err?.message || '操作失敗，請再試一次' })
      return false
    }
  }

  const now = () => new Date().toISOString()

  const updateCards = (cards) => commit({ ...state, cards })
  const updateInvestments = (investments) => commit({ ...state, investments })

  const saveAccount = (account, editingId) => {
    if (editingId === 'new') {
      commit({ ...state, accounts: [...state.accounts, account] })
      return
    }
    // A hand-edited balance is a ledger event, not a silent overwrite.
    const { balance, ...rest } = account
    runLedger(s => applyBalanceAdjustment(
      { ...s, accounts: s.accounts.map(a => (a.id === editingId ? { ...a, ...rest } : a)) },
      { accountId: editingId, newBalance: balance, date: now() },
    ))
  }

  const removeAccount = (id) => commit(deleteAccount(state, id))

  const handleTransfer = (input) => runLedger(s => applyTransfer(s, { ...input, date: now() }), '轉帳完成')
  const handleTransaction = (input) => runLedger(s => applyCashTx(s, input), '已記錄')
  const handleExchange = (input) => runLedger(s => applyExchange(s, { ...input, date: now() }), '換匯完成')
  const handleInvestTx = (input) => runLedger(
    s => applyInvestTx(s, { ...input, date: now() }),
    input.type === 'buy' ? '買進已記錄' : '賣出已記錄')
  const handleCardPayment = (cardId, amount) => runLedger(
    s => applyCardPayment(s, { cardId, amount, date: now() }), '繳款已記錄')
  const handleRevert = (txId) => runLedger(s => revertTransaction(s, txId), '已復原這筆紀錄')

  const payingCard = state.cards.find(c => c.id === payingCardId) || null

  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />

  return (
    <div className="flex min-h-screen bg-app font-['Inter',system-ui,sans-serif] overflow-x-hidden">
      <aside className={`hidden md:flex ${collapsed ? 'w-[76px]' : 'w-52'} bg-surface border-r border-line flex-col shrink-0 sticky top-0 h-screen transition-all duration-300`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 h-14 border-b border-line shrink-0`}>
          <button onClick={() => setCollapsed(c => !c)} aria-label={collapsed ? '展開側欄' : '收合側欄'} aria-expanded={!collapsed}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink-3 hover:bg-surface-2 transition cursor-pointer shrink-0">
            {collapsed ? <img src={`${import.meta.env.BASE_URL}apple-touch-icon.png`} alt="" className="w-7 h-7 rounded-lg" /> : <IconChevronLeft className="w-4 h-4" />}
          </button>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <img src={`${import.meta.env.BASE_URL}apple-touch-icon.png`} alt="" className="w-7 h-7 rounded-lg shrink-0" />
              <span className="font-semibold text-ink-2 text-sm truncate">財務管家</span>
            </div>
          )}
        </div>
        <nav aria-label="主選單" className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} pt-4`}>
          {[...NAV_ITEMS, { id: 'settings', label: '設定', Icon: IconSettings }].map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} title={collapsed ? item.label : undefined}
              aria-current={tab === item.id ? 'page' : undefined}
              className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'px-3.5'} gap-3 py-3 rounded-pill text-sm font-medium mb-1.5 transition-all cursor-pointer ${tab === item.id ? 'bg-solid text-on-solid shadow-card' : 'text-ink-4 hover:bg-surface-3 hover:text-ink-2'}`}>
              <item.Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      {/* Floating pill nav: the active tab expands to show its label, the rest
          stay icon-only, which is what keeps five items on a 375px screen. */}
      <nav aria-label="主選單" className="md:hidden fixed bottom-4 left-3 right-3 z-40 safe-area-mb">
        <div className="nav-pill flex items-center justify-between p-1.5">
          {[...NAV_ITEMS, { id: 'settings', label: '設定', Icon: IconSettings }].map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} aria-label={item.label}
              aria-current={tab === item.id ? 'page' : undefined}
              className="nav-item flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium cursor-pointer transition-all">
              <item.Icon className="w-[18px] h-[18px] shrink-0" />
              {tab === item.id && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 min-w-0 overflow-y-auto pb-28 md:pb-0 safe-area-pt">
        <div className="max-w-5xl mx-auto px-4 pt-7 pb-6 md:px-8 md:pt-10 md:pb-10">
          {tab === 'dashboard' && (
            <Dashboard state={state} onPayCard={setPayingCardId} onOpenHistory={() => setHistoryOpen(true)}
              onRecord={() => setTransactionAccount('any')} onTransfer={() => setTransferFromId('')}
              onNavigate={setTab} />
          )}
          {tab === 'accounts' && (
            <AccountManager accounts={state.accounts} onSave={saveAccount} onRemove={removeAccount}
              onTransfer={setTransferFromId} onTransaction={setTransactionAccount} onExchange={setExchangeAccount} />
          )}
          {tab === 'investments' && (
            <InvestmentManager investments={state.investments} accounts={state.accounts}
              onChange={updateInvestments} onInvestTx={handleInvestTx} />
          )}
          {tab === 'cards' && (
            <CardManager cards={state.cards} accounts={state.accounts} onChange={updateCards} onPayCard={setPayingCardId} />
          )}
          {tab === 'settings' && (
            <SettingsPage state={state} onReplaceState={commit} darkMode={darkMode} setDarkMode={setDarkMode}
              onNotify={setToast} />
          )}
        </div>
      </main>

      {transferFromId !== null && (
        <TransferModal accounts={state.accounts} defaultFromId={transferFromId}
          onTransfer={handleTransfer} onClose={() => setTransferFromId(null)} />
      )}
      {transactionAccount && (
        <TransactionModal account={transactionAccount === 'any' ? null : transactionAccount}
          accounts={state.accounts} onSubmit={handleTransaction} onClose={() => setTransactionAccount(null)} />
      )}
      {exchangeAccount && (
        <ExchangeModal account={exchangeAccount} accounts={state.accounts}
          onExchange={handleExchange} onClose={() => setExchangeAccount(null)} />
      )}
      {payingCard && (
        <CardPaymentModal card={payingCard} accounts={state.accounts}
          onSubmit={handleCardPayment} onClose={() => setPayingCardId(null)} />
      )}
      {historyOpen && (
        <HistoryModal state={state} onRevert={handleRevert} onClose={() => setHistoryOpen(false)} />
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

function Toast({ toast, onDismiss }) {
  if (!toast) return null
  const isError = toast.kind === 'error'
  return (
    <div role="status" aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-8 z-[60] w-[min(28rem,calc(100%-2rem))]">
      <button onClick={onDismiss}
        className={`w-full flex items-start gap-2.5 text-left rounded-xl px-4 py-3 shadow-lg text-sm cursor-pointer ${isError ? 'bg-red-500 text-white' : 'bg-solid text-on-solid'}`}>
        {isError ? <IconWarning className="w-4 h-4 mt-0.5 shrink-0" /> : <IconCheck className="w-4 h-4 mt-0.5 shrink-0" />}
        <span className="flex-1">{toast.text}</span>
      </button>
    </div>
  )
}
