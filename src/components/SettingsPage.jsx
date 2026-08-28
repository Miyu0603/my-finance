import { useState, useEffect, useRef } from 'react'
import { downloadBackup, readBackupFile } from '../lib/storage'
import { emptyState } from '../lib/ledger'
import { setupFaceId, removeFaceId, isFaceIdEnabled, isFaceIdAvailable } from '../lib/faceId'
import { ConfirmDialog } from './ui'
import { IconFaceId, IconMoon, IconShield, IconTrash, IconDownload, IconUpload } from './icons'

function Row({ tint, icon, title, description, children }) {
  return (
    <div className="bg-surface rounded-card border border-line p-4 md:p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-tile flex items-center justify-center shrink-0 ${tint}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-ink-2 text-sm">{title}</div>
          <div className="text-xs text-muted">{description}</div>
        </div>
        {children}
      </div>
    </div>
  )
}

function Toggle({ on, onClick, label, accent }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on} aria-label={label}
      className={`w-12 h-7 rounded-full transition-colors cursor-pointer relative shrink-0 ${on ? accent : 'bg-surface-4'}`}>
      <span className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-all ${on ? 'left-6' : 'left-1'}`} />
    </button>
  )
}

export default function SettingsPage({ state, onReplaceState, darkMode, setDarkMode, onNotify }) {
  const [faceIdOn, setFaceIdOn] = useState(isFaceIdEnabled())
  const [faceIdSupported, setFaceIdSupported] = useState(false)
  const [confirming, setConfirming] = useState(null)
  const [pendingImport, setPendingImport] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!isFaceIdAvailable()) return
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then(setFaceIdSupported)
      .catch(() => setFaceIdSupported(false))
  }, [])

  const toggleFaceId = async () => {
    if (faceIdOn) {
      removeFaceId()
      setFaceIdOn(false)
      onNotify({ kind: 'ok', text: '已關閉生物辨識鎖定' })
      return
    }
    try {
      await setupFaceId()
      setFaceIdOn(true)
      onNotify({ kind: 'ok', text: '已啟用生物辨識鎖定' })
    } catch (err) {
      onNotify({ kind: 'error', text: err?.message || '設定失敗' })
    }
  }

  const handleExport = () => {
    try {
      downloadBackup(state)
      onNotify({ kind: 'ok', text: '備份檔已下載' })
    } catch (err) {
      onNotify({ kind: 'error', text: err?.message || '匯出失敗' })
    }
  }

  const handleFilePicked = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = '' // let the same file be picked again after a cancel
    if (!file) return
    try {
      const imported = await readBackupFile(file)
      setPendingImport(imported)
    } catch (err) {
      onNotify({ kind: 'error', text: err?.message || '無法讀取這個檔案' })
    }
  }

  const counts = {
    accounts: state.accounts.length,
    investments: state.investments.length,
    cards: state.cards.length,
    transactions: state.transactions.length,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-ink">設定</h1>
        <p className="text-muted text-sm mt-1">管理你的應用程式設定</p>
      </div>

      <div className="space-y-3 max-w-lg">
        <Row tint="tint-indigo" icon={<IconFaceId className="w-5 h-5" />}
          title="生物辨識鎖定" description="開啟 APP 時需要 Face ID / 指紋驗證">
          {faceIdSupported
            ? <Toggle on={faceIdOn} onClick={toggleFaceId} label="生物辨識鎖定" accent="bg-indigo-500" />
            : <span className="text-xs text-muted shrink-0">不支援</span>}
        </Row>

        <Row tint="tint-violet" icon={<IconMoon className="w-5 h-5" />}
          title="暗色模式" description="切換深色介面，保護眼睛">
          <Toggle on={darkMode} onClick={() => setDarkMode(d => !d)} label="暗色模式" accent="bg-violet-500" />
        </Row>

        <div className="bg-surface rounded-card border border-line p-4 md:p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-tile flex items-center justify-center shrink-0 tint-emerald">
              <IconDownload className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-ink-2 text-sm">備份與還原</div>
              <div className="text-xs text-muted">資料只存在這台裝置，清除瀏覽器資料就會消失</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport}
              className="flex-1 flex items-center justify-center gap-1.5 bg-solid text-on-solid py-2.5 rounded-tile text-sm font-medium hover:bg-solid-hover transition cursor-pointer">
              <IconDownload className="w-4 h-4" /> 匯出備份
            </button>
            <button onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 bg-surface-2 text-ink-3 py-2.5 rounded-tile text-sm font-medium hover:bg-surface-3 transition cursor-pointer">
              <IconUpload className="w-4 h-4" /> 匯入備份
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="application/json,.json" className="sr-only"
            aria-label="選擇備份檔" onChange={handleFilePicked} />
          <p className="text-[11px] text-muted mt-2">建議每次大量記帳後匯出一次，檔案存到雲端硬碟或傳給自己。</p>
        </div>

        <Row tint="tint-blue" icon={<IconShield className="w-5 h-5" />}
          title="資料儲存" description="全部存在本機瀏覽器，不會上傳到任何伺服器" />

        <div className="bg-surface rounded-card border border-line p-4 md:p-5">
          <div className="text-sm font-medium text-ink-2 mb-3">資料統計</div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[['帳戶', counts.accounts], ['投資', counts.investments], ['信用卡', counts.cards], ['紀錄', counts.transactions]].map(([label, value]) => (
              <div key={label} className="bg-surface-2 rounded-tile py-2.5">
                <div className="text-lg font-bold text-ink-2">{value}</div>
                <div className="text-xs text-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <Row tint="tint-red" icon={<IconTrash className="w-5 h-5" />}
          title="清除所有資料" description="刪除所有帳戶、信用卡、投資及紀錄">
          <button onClick={() => setConfirming('clear')}
            className="text-xs text-red-500 hover:text-red-600 font-medium px-3.5 py-1.5 rounded-pill hover:bg-red-500/10 transition cursor-pointer shrink-0">
            清除
          </button>
        </Row>
      </div>

      {confirming === 'clear' && (
        <ConfirmDialog title="清除所有資料"
          message="這會刪除全部帳戶、信用卡、投資與交易紀錄，而且無法復原。"
          detail="建議先按「匯出備份」存一份再清除。"
          confirmLabel="全部清除"
          onConfirm={() => { onReplaceState(emptyState()); onNotify({ kind: 'ok', text: '資料已清除' }) }}
          onClose={() => setConfirming(null)} />
      )}

      {pendingImport && (
        <ConfirmDialog title="匯入備份"
          message={`備份檔含 ${pendingImport.accounts.length} 個帳戶、${pendingImport.cards.length} 張信用卡、${pendingImport.investments.length} 檔持股、${pendingImport.transactions.length} 筆紀錄。`}
          detail="匯入會覆蓋目前裝置上的所有資料。"
          confirmLabel="覆蓋並匯入"
          onConfirm={() => { onReplaceState(pendingImport); onNotify({ kind: 'ok', text: '備份已匯入' }) }}
          onClose={() => setPendingImport(null)} />
      )}
    </div>
  )
}
