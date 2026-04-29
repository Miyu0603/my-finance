import { useState, useEffect, useCallback } from 'react'
import './index.css'
import Dashboard from './components/Dashboard'
import AccountManager from './components/AccountManager'
import CardManager from './components/CardManager'
import TransferModal from './components/TransferModal'
import LockScreen, { setupFaceId, removeFaceId, isFaceIdEnabled, isFaceIdAvailable } from './components/LockScreen'

const STORAGE_KEY = 'my-finance-data'

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { accounts: [], cards: [], transactions: [] }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const IconHome = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" /></svg>
const IconBank = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21V12m0-9L3 8v1h18V8l-9-5zM3 21h18M5 12v9m14-9v9M9 12v9m6-9v9" /></svg>
const IconCard = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
const IconSettings = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
const IconMenu = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
const IconChevronLeft = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
const IconWallet = ({ className }) => <svg className={className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5zm-4 1a1 1 0 100-2 1 1 0 000 2z" /></svg>
const IconFaceId = ({ className }) => <svg className={className || "w-5 h-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M7 3H5a2 2 0 00-2 2v2m0 10v2a2 2 0 002 2h2m10 0h2a2 2 0 002-2v-2m0-10V5a2 2 0 00-2-2h-2" /><circle cx="9" cy="10" r="0.5" fill="currentColor" /><circle cx="15" cy="10" r="0.5" fill="currentColor" /><path d="M9.5 15a3.5 3.5 0 005 0" /><line x1="12" y1="10" x2="12" y2="13.5" /></svg>
const IconShield = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
const IconTrash = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
const IconClose = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>

const NAV_ITEMS = [
  { id: 'dashboard', label: '總覽', Icon: IconHome },
  { id: 'accounts', label: '銀行帳戶', Icon: IconBank },
  { id: 'cards', label: '信用卡', Icon: IconCard },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [data, setData] = useState(loadData)
  const [collapsed, setCollapsed] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)
  const [transferFromId, setTransferFromId] = useState(null)
  const [locked, setLocked] = useState(() => isFaceIdEnabled())
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('dark-mode') === 'true')

  useEffect(() => { saveData(data) }, [data])
  useEffect(() => {
    localStorage.setItem('dark-mode', darkMode)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', darkMode ? '#0f172a' : '#6366f1')
  }, [darkMode])

  const updateAccounts = useCallback((accounts) => {
    setData(prev => ({ ...prev, accounts }))
  }, [])

  const updateCards = useCallback((cards) => {
    setData(prev => ({ ...prev, cards }))
  }, [])

  const handleTransfer = useCallback((fromId, toId, amount) => {
    setData(prev => {
      const accounts = prev.accounts.map(a => {
        if (a.id === fromId) return { ...a, balance: (Number(a.balance) || 0) - amount }
        if (a.id === toId) return { ...a, balance: (Number(a.balance) || 0) + amount }
        return a
      })
      const tx = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        type: 'transfer', fromId, toId, amount, date: new Date().toISOString(),
      }
      return { ...prev, accounts, transactions: [...(prev.transactions || []), tx] }
    })
  }, [])

  const handlePayCard = useCallback((cardId) => {
    setData(prev => {
      const card = prev.cards.find(c => c.id === cardId)
      if (!card || !card.accountId || !card.monthlyAmount) return prev
      const amt = Number(card.monthlyAmount) || 0
      if (amt <= 0) return prev
      const accounts = prev.accounts.map(a => {
        if (a.id === card.accountId) return { ...a, balance: (Number(a.balance) || 0) - amt }
        return a
      })
      const cards = prev.cards.map(c => {
        if (c.id === cardId) return { ...c, lastPaidDate: new Date().toISOString() }
        return c
      })
      const tx = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        type: 'card-payment', cardId, accountId: card.accountId, amount: amt, date: new Date().toISOString(),
      }
      return { ...prev, accounts, cards, transactions: [...(prev.transactions || []), tx] }
    })
  }, [])

  const switchTab = (id) => { setTab(id); setMobileNav(false) }

  if (locked) return <LockScreen onUnlock={() => setLocked(false)} darkMode={darkMode} />

  return (
    <div className={`flex min-h-screen bg-[#f8f9fb] font-['Inter',system-ui,sans-serif] overflow-x-hidden ${darkMode ? 'dark' : ''}`}>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex ${collapsed ? 'w-[68px]' : 'w-48'} bg-white border-r border-gray-100 flex-col shrink-0 sticky top-0 h-screen transition-all duration-300`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 h-14 border-b border-gray-100 shrink-0`}>
          <button onClick={() => setCollapsed(c => !c)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition cursor-pointer shrink-0">
            {collapsed ? <IconMenu className="w-4 h-4" /> : <IconChevronLeft className="w-4 h-4" />}
          </button>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                <IconWallet className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-gray-800 text-sm truncate">財務管家</span>
            </div>
          )}
        </div>
        <nav className={`flex-1 ${collapsed ? 'px-2' : 'px-3'} pt-4`}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} title={collapsed ? item.label : undefined}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-0 py-2.5' : 'px-3 py-2.5'} rounded-xl text-sm font-medium mb-1 transition-all cursor-pointer ${tab === item.id ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
              <item.Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className={`${collapsed ? 'px-2' : 'px-3'} pb-4`}>
          <button onClick={() => setTab('settings')} title={collapsed ? '設定' : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-0 py-2.5' : 'px-3 py-2.5'} rounded-xl text-sm font-medium transition-all cursor-pointer ${tab === 'settings' ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
            <IconSettings className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>設定</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 flex safe-area-pb">
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => switchTab(item.id)}
            className={`flex-1 flex flex-col items-center py-2 pt-2.5 gap-0.5 text-[10px] font-medium cursor-pointer transition ${tab === item.id ? 'text-indigo-600' : 'text-gray-400'}`}>
            <item.Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
        <button onClick={() => switchTab('settings')}
          className={`flex-1 flex flex-col items-center py-2 pt-2.5 gap-0.5 text-[10px] font-medium cursor-pointer transition ${tab === 'settings' ? 'text-indigo-600' : 'text-gray-400'}`}>
          <IconSettings className="w-5 h-5" />
          <span>設定</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-5 md:px-8 md:py-8 safe-area-pt">
          {tab === 'dashboard' && <Dashboard accounts={data.accounts} cards={data.cards} transactions={data.transactions} onPayCard={handlePayCard} onTransfer={(accId) => setTransferFromId(accId)} />}
          {tab === 'accounts' && <AccountManager accounts={data.accounts} onChange={updateAccounts} onTransfer={(accId) => setTransferFromId(accId)} />}
          {tab === 'cards' && <CardManager cards={data.cards} accounts={data.accounts} onChange={updateCards} onPayCard={handlePayCard} />}
          {tab === 'settings' && <SettingsPage data={data} setData={setData} darkMode={darkMode} setDarkMode={setDarkMode} />}
        </div>
      </main>

      {transferFromId !== null && (
        <TransferModal accounts={data.accounts} defaultFromId={transferFromId} onTransfer={handleTransfer} onClose={() => setTransferFromId(null)} />
      )}
    </div>
  )
}

const IconMoon = ({ className }) => <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>

function SettingsPage({ data, setData, darkMode, setDarkMode }) {
  const [faceIdOn, setFaceIdOn] = useState(isFaceIdEnabled())
  const [faceIdSupported, setFaceIdSupported] = useState(false)
  const [setupMsg, setSetupMsg] = useState('')

  useEffect(() => {
    if (isFaceIdAvailable()) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(ok => setFaceIdSupported(ok))
    }
  }, [])

  const toggleFaceId = async () => {
    if (faceIdOn) { removeFaceId(); setFaceIdOn(false); setSetupMsg('已關閉生物辨識鎖定') }
    else {
      try { setSetupMsg('設定中...'); await setupFaceId(); setFaceIdOn(true); setSetupMsg('已啟用生物辨識鎖定') }
      catch (err) { setSetupMsg(err.message || '設定失敗') }
    }
    setTimeout(() => setSetupMsg(''), 3000)
  }

  const clearAllData = () => {
    if (confirm('確定要清除所有資料嗎？此操作無法復原。')) {
      setData({ accounts: [], cards: [], transactions: [] })
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">設定</h1>
        <p className="text-gray-400 text-sm mt-1">管理你的應用程式設定</p>
      </div>
      <div className="space-y-3 max-w-lg">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><IconFaceId className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 text-sm">生物辨識鎖定</div>
              <div className="text-xs text-gray-400">開啟 APP 時需要 Face ID / 指紋驗證</div>
            </div>
            {faceIdSupported ? (
              <button onClick={toggleFaceId} className={`w-12 h-7 rounded-full transition-colors cursor-pointer relative shrink-0 ${faceIdOn ? 'bg-indigo-500' : 'bg-gray-200'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-all ${faceIdOn ? 'left-6' : 'left-1'}`} />
              </button>
            ) : <span className="text-xs text-gray-400 shrink-0">不支援</span>}
          </div>
          {setupMsg && <p className="text-xs text-indigo-500 mt-2 ml-13">{setupMsg}</p>}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0"><IconMoon className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 text-sm">暗色模式</div>
              <div className="text-xs text-gray-400">切換深色介面，保護眼睛</div>
            </div>
            <button onClick={() => setDarkMode(d => !d)} className={`w-12 h-7 rounded-full transition-colors cursor-pointer relative shrink-0 ${darkMode ? 'bg-violet-500' : 'bg-gray-200'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-all ${darkMode ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><IconShield className="w-5 h-5" /></div>
            <div className="flex-1"><div className="font-medium text-gray-800 text-sm">資料儲存</div><div className="text-xs text-gray-400">所有資料存於本機，不會上傳到任何伺服器</div></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
          <div className="text-sm font-medium text-gray-800 mb-3">資料統計</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 rounded-xl py-2.5"><div className="text-lg font-bold text-gray-800">{data.accounts.length}</div><div className="text-xs text-gray-400">帳戶</div></div>
            <div className="bg-gray-50 rounded-xl py-2.5"><div className="text-lg font-bold text-gray-800">{data.cards.length}</div><div className="text-xs text-gray-400">信用卡</div></div>
            <div className="bg-gray-50 rounded-xl py-2.5"><div className="text-lg font-bold text-gray-800">{(data.transactions || []).length}</div><div className="text-xs text-gray-400">交易紀錄</div></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0"><IconTrash className="w-5 h-5" /></div>
            <div className="flex-1"><div className="font-medium text-gray-800 text-sm">清除所有資料</div><div className="text-xs text-gray-400">刪除所有帳戶、信用卡及交易紀錄</div></div>
            <button onClick={clearAllData} className="text-xs text-red-500 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer shrink-0">清除</button>
          </div>
        </div>
      </div>
    </div>
  )
}
