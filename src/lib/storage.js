/**
 * The only place that talks to localStorage. Everything read from it is
 * untrusted: it may have been written by an older build, hand-edited, or
 * restored from a backup file, so it is re-shaped before reaching the app.
 */
import { genId } from './id'
import { num, round2 } from './money'
import { emptyState, SCHEMA_VERSION } from './ledger'

const STORAGE_KEY = 'my-finance-data'

const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v))

function normalizeAccount(raw) {
  return {
    id: str(raw.id) || genId(),
    bank: str(raw.bank).trim(),
    lastFour: str(raw.lastFour).replace(/\D/g, '').slice(0, 4),
    purpose: str(raw.purpose),
    note: str(raw.note),
    currency: str(raw.currency) || 'TWD',
    balance: round2(num(raw.balance)),
  }
}

function normalizeCard(raw) {
  return {
    id: str(raw.id) || genId(),
    name: str(raw.name).trim(),
    issuer: str(raw.issuer).trim(),
    accountId: str(raw.accountId),
    dueDay: str(raw.dueDay),
    annualFee: str(raw.annualFee),
    note: str(raw.note),
    monthlyAmount: str(raw.monthlyAmount),
    lastPaidDate: raw.lastPaidDate ? str(raw.lastPaidDate) : null,
  }
}

function normalizeInvestment(raw) {
  return {
    id: str(raw.id) || genId(),
    name: str(raw.name).trim(),
    market: raw.market === 'us' ? 'us' : 'tw',
    note: str(raw.note),
    shares: round2(num(raw.shares)),
    cost: round2(num(raw.cost)),
  }
}

/** A transaction is kept only if it is undoable — i.e. it still has an id and date. */
function normalizeTransaction(raw) {
  if (!raw || typeof raw !== 'object' || !raw.type) return null
  return { ...raw, id: str(raw.id) || genId(), date: str(raw.date) || new Date().toISOString() }
}

const arr = (v) => (Array.isArray(v) ? v : [])

export function normalizeState(raw) {
  if (!raw || typeof raw !== 'object') return emptyState()
  const accounts = arr(raw.accounts).map(normalizeAccount).filter(a => a.bank)
  const accountIds = new Set(accounts.map(a => a.id))
  return {
    version: SCHEMA_VERSION,
    accounts,
    // Drop links to accounts that no longer exist rather than rendering "?" forever.
    cards: arr(raw.cards).map(normalizeCard).filter(c => c.name)
      .map(c => (c.accountId && !accountIds.has(c.accountId) ? { ...c, accountId: '' } : c)),
    investments: arr(raw.investments).map(normalizeInvestment).filter(i => i.name),
    transactions: arr(raw.transactions).map(normalizeTransaction).filter(Boolean),
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    return normalizeState(JSON.parse(raw))
  } catch (err) {
    console.error('讀取本機資料失敗，已改用空白資料', err)
    return emptyState()
  }
}

/** Returns null on success, or a user-facing message when the write failed. */
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return null
  } catch (err) {
    console.error('寫入本機資料失敗', err)
    if (err?.name === 'QuotaExceededError' || err?.code === 22) {
      return '本機儲存空間已滿，這次的變更沒有存檔。請先到設定匯出備份，再清理部分紀錄。'
    }
    return '無法寫入本機資料，這次的變更沒有存檔。若使用無痕模式，請改用一般視窗。'
  }
}

/* ---------- backup ---------- */

export function exportFilename(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `finance-backup-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}.json`
}

export function downloadBackup(state, date = new Date()) {
  const blob = new Blob([JSON.stringify({ ...state, exportedAt: date.toISOString() }, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = exportFilename(date)
  link.click()
  URL.revokeObjectURL(url)
}

export async function readBackupFile(file) {
  const text = await file.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('這不是有效的 JSON 檔案')
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.accounts)) {
    throw new Error('檔案格式不符，找不到帳戶資料')
  }
  return normalizeState(parsed)
}
