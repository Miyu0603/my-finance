import { useState, useEffect, useCallback, useRef } from 'react'
import { verifyFaceId } from '../lib/faceId'
import { IconFaceId } from './icons'

export default function LockScreen({ onUnlock }) {
  const [error, setError] = useState('')
  const [attempting, setAttempting] = useState(false)
  const [hasAttempted, setHasAttempted] = useState(false)
  const busyRef = useRef(false)

  const authenticate = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    setAttempting(true)
    setError('')
    try {
      await verifyFaceId()
      onUnlock()
    } catch (err) {
      setError(err?.name === 'NotAllowedError' ? '驗證已取消' : err?.message || '驗證失敗，請再試一次')
    } finally {
      busyRef.current = false
      setAttempting(false)
      setHasAttempted(true)
    }
  }, [onUnlock])

  useEffect(() => {
    const timer = setTimeout(authenticate, 300)
    return () => clearTimeout(timer)
  }, [authenticate])

  return (
    <div className="fixed inset-0 bg-app flex flex-col items-center justify-center select-none">
      <div className="flex flex-col items-center px-6 text-center">
        <img src={`${import.meta.env.BASE_URL}apple-touch-icon.png`} alt="" className="w-24 h-24 rounded-card shadow-lg mb-6" />
        <h1 className="text-2xl font-bold mb-1 text-ink">財務管家</h1>
        <p className="text-sm mb-10 text-muted">請驗證身分以繼續使用</p>

        <button onClick={authenticate} disabled={attempting} aria-label="使用生物辨識解鎖"
          className="w-20 h-20 rounded-full bg-surface-3 flex items-center justify-center mb-4 hover:opacity-80 transition active:scale-95 cursor-pointer disabled:opacity-50">
          {attempting
            ? <span className="w-8 h-8 border-2 border-surface-4 border-t-indigo-500 rounded-full animate-spin" />
            : <IconFaceId className="w-10 h-10 text-indigo-500" />}
        </button>

        <p className="text-sm text-ink-4" role="status">{attempting ? '驗證中…' : '點擊使用 Face ID 解鎖'}</p>

        {error && <p role="alert" className="mt-4 tint-red rounded-tile px-4 py-2 text-sm">{error}</p>}

        {/*
          Kept as a recovery path: biometrics can break (new device, reset
          Face ID) and there is no server or password to fall back on, so
          removing this would mean permanently losing the ledger. The label says
          plainly what the lock is worth.
        */}
        {hasAttempted && (
          <button onClick={onUnlock} className="mt-8 text-xs text-faint hover:text-ink-4 transition cursor-pointer">
            略過驗證（本機資料未加密，此鎖僅防他人隨手翻看）
          </button>
        )}
      </div>
    </div>
  )
}
