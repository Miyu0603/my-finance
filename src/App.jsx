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
import { loadState, saveState, readPref, writePref } from './lib/storage'
import { MoneyFormatContext, maskedMoney, visibleMoney } from './lib/moneyDisplay'
import {
  applyTransfer, applyCashTx, applyExchange, applyInvestTx,
  applyCardPayment, applyBalanceAdjustment, revertTransaction, deleteAccount,
} from './lib/ledger'
import { IconHome, IconBank, IconCard, IconSettings, IconTrendUp, IconCheck, IconWarning, IconMoon } from './components/icons'

const NAV_ITEMS = [
  { id: 'dashboard', label: '總覽', Icon: IconHome },
  { id: 'accounts', label: '銀行帳戶', Icon: IconBank },
  { id: 'investments', label: '投資', Icon: IconTrendUp },
  { id: 'cards', label: '信用卡', Icon: IconCard },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [state, setState] = useState(loadState)
  const [toast, setToast] = useState(null)
  const [transferFromId, setTransferFromId] = useState(null)
  const [transactionAccount, setTransactionAccount] = useState(null)
  const [exchangeAccount, setExchangeAccount] = useState(null)
  const [payingCardId, setPayingCardId] = useState(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [locked, setLocked] = useState(() => isFaceIdEnabled())
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('dark-mode') === 'true')
  const [amountsHidden, setAmountsHidden] = useState(() => readPref('hide-amounts', false))

  useEffect(() => {
    localStorage.setItem('dark-mode', darkMode)
    document.documentElement.classList.toggle('dark', darkMode)
    // Match the page ground so the status bar blends into the app.
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', darkMode ? '#0d0d0d' : '#faf7f2')
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
  const handleCardPayment = (cardId, input) => runLedger(
    s => applyCardPayment(s, { cardId, ...input }), '繳款已記錄')
  const handleRevert = (txId) => runLedger(s => revertTransaction(s, txId), '已復原這筆紀錄')

  const toggleAmounts = () => setAmountsHidden(prev => {
    writePref('hide-amounts', !prev)
    return !prev
  })

  const payingCard = state.cards.find(c => c.id === payingCardId) || null

  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />

  return (
    <MoneyFormatContext.Provider value={amountsHidden ? maskedMoney : visibleMoney}>
      <div className="flex min-h-screen app-frame overflow-x-hidden md:gap-3 md:p-3">
      {/* Icon-only rail sitting directly on the dark frame — no panel of its
          own, the cream canvas beside it provides the contrast. */}
      <aside className="hidden md:flex w-16 shrink-0 flex-col items-center gap-2.5 py-3.5 sticky top-3 h-[calc(100vh-1.5rem)]">
        <img src={`${import.meta.env.BASE_URL}apple-touch-icon.png`} alt=""
          className="w-11 h-11 rounded-tile mb-1" />
        <nav aria-label="主選單" className="flex flex-col items-center gap-2.5">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} title={item.label} aria-label={item.label}
              aria-current={tab === item.id ? 'page' : undefined}
              className="frame-item w-11 h-11 flex items-center justify-center transition cursor-pointer hover:text-white">
              <item.Icon className="w-[21px] h-[21px]" />
            </button>
          ))}
        </nav>
        <div className="mt-auto flex flex-col items-center gap-2.5">
          <button onClick={() => setTab('settings')} title="設定" aria-label="設定"
            aria-current={tab === 'settings' ? 'page' : undefined}
            className="frame-item w-11 h-11 flex items-center justify-center transition cursor-pointer hover:text-white">
            <IconSettings className="w-[21px] h-[21px]" />
          </button>
          <button onClick={() => setDarkMode(d => !d)} aria-pressed={darkMode}
            title={darkMode ? '切換淺色' : '切換暗色'} aria-label={darkMode ? '切換淺色' : '切換暗色'}
            className="frame-item w-11 h-11 flex items-center justify-center transition cursor-pointer hover:text-white">
            <IconMoon className="w-[21px] h-[21px]" />
          </button>
        </div>
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

      <main className="flex-1 min-w-0 overflow-y-auto pb-28 md:pb-0 safe-area-pt bg-app md:rounded-card">
        <div className="max-w-5xl mx-auto px-4 pt-7 pb-6 md:px-7 md:pt-7 md:pb-9">
          {tab === 'dashboard' && (
            <Dashboard state={state} onPayCard={setPayingCardId} onOpenHistory={() => setHistoryOpen(true)}
              onRecord={() => setTransactionAccount('any')} onTransfer={() => setTransferFromId('')}
              onNavigate={setTab} amountsHidden={amountsHidden} onToggleAmounts={toggleAmounts} />
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
            <CardManager cards={state.cards} accounts={state.accounts} transactions={state.transactions}
              onChange={updateCards} onPayCard={setPayingCardId} />
          )}
          {tab === 'settings' && (
            <SettingsPage state={state} onReplaceState={commit} darkMode={darkMode} setDarkMode={setDarkMode}
              amountsHidden={amountsHidden} onToggleAmounts={toggleAmounts} onNotify={setToast} />
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
        <CardPaymentModal card={payingCard} accounts={state.accounts} transactions={state.transactions}
          onSubmit={handleCardPayment} onClose={() => setPayingCardId(null)} />
      )}
      {historyOpen && (
        <HistoryModal state={state} onRevert={handleRevert} onClose={() => setHistoryOpen(false)} />
      )}

        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    </MoneyFormatContext.Provider>
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
