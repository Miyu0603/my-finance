/**
 * A local biometric gate, not a security boundary: the ledger sits in
 * localStorage in plain text, so anyone with the unlocked device can read it.
 * This only stops a casual glance at an already-open browser. WebAuthn is used
 * because it hands the prompt to the platform — no password is ever handled.
 */
const CREDENTIAL_KEY = 'faceId-credentialId'
const ENABLED_KEY = 'faceId-enabled'

export const isFaceIdAvailable = () => typeof window !== 'undefined' && !!window.PublicKeyCredential

export const isFaceIdEnabled = () => localStorage.getItem(ENABLED_KEY) === 'true'

export function removeFaceId() {
  localStorage.removeItem(CREDENTIAL_KEY)
  localStorage.removeItem(ENABLED_KEY)
}

const toBytes = (base64) => Uint8Array.from(atob(base64), c => c.charCodeAt(0))
const toBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)))

export async function setupFaceId() {
  if (!isFaceIdAvailable()) throw new Error('此裝置不支援生物辨識')
  if (!(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())) {
    throw new Error('此裝置沒有可用的生物辨識功能')
  }

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: '我的財務管家', id: location.hostname },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'user', displayName: '使用者' },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
      timeout: 60000,
    },
  })
  if (!credential) throw new Error('設定失敗，請再試一次')

  localStorage.setItem(CREDENTIAL_KEY, toBase64(credential.rawId))
  localStorage.setItem(ENABLED_KEY, 'true')
  return true
}

/** Resolves true when unlocked; throws with a readable message otherwise. */
export async function verifyFaceId() {
  const stored = localStorage.getItem(CREDENTIAL_KEY)
  if (!stored) return true // nothing registered — nothing to verify against

  let allowCredentials
  try {
    allowCredentials = [{ id: toBytes(stored), type: 'public-key', transports: ['internal'] }]
  } catch {
    removeFaceId()
    throw new Error('儲存的驗證資料已損毀，已關閉生物辨識鎖定')
  }

  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      allowCredentials,
      timeout: 60000,
      userVerification: 'required',
    },
  })
  if (!credential) throw new Error('驗證失敗，請再試一次')
  return true
}
