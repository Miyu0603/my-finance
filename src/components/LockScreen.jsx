import { useState, useEffect } from 'react'

const IconLock = ({ className }) => <svg className={className || "w-16 h-16"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
const IconFaceId = ({ className }) => <svg className={className || "w-8 h-8"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M7 3H5a2 2 0 00-2 2v2m0 10v2a2 2 0 002 2h2m10 0h2a2 2 0 002-2v-2m0-10V5a2 2 0 00-2-2h-2" /><circle cx="9" cy="10" r="0.5" fill="currentColor" /><circle cx="15" cy="10" r="0.5" fill="currentColor" /><path d="M9.5 15a3.5 3.5 0 005 0" /><line x1="12" y1="10" x2="12" y2="13.5" /></svg>
const IconWallet = ({ className }) => <svg className={className || "w-8 h-8"} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5zm-4 1a1 1 0 100-2 1 1 0 000 2z" /></svg>

export default function LockScreen({ onUnlock, darkMode }) {
    const [error, setError] = useState('')
    const [attempting, setAttempting] = useState(false)

    useEffect(() => {
        // Auto-trigger Face ID on mount
        const timer = setTimeout(() => authenticate(), 300)
        return () => clearTimeout(timer)
    }, [])

    const authenticate = async () => {
        if (attempting) return
        setAttempting(true)
        setError('')
        try {
            const credId = localStorage.getItem('faceId-credentialId')
            if (!credId) {
                onUnlock()
                return
            }

            const challenge = crypto.getRandomValues(new Uint8Array(32))
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge,
                    allowCredentials: [{
                        id: Uint8Array.from(atob(credId), c => c.charCodeAt(0)),
                        type: 'public-key',
                        transports: ['internal'],
                    }],
                    timeout: 60000,
                    userVerification: 'required',
                }
            })

            if (credential) {
                onUnlock()
            }
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                setError('驗證已取消')
            } else {
                setError('驗證失敗，請再試一次')
            }
        } finally {
            setAttempting(false)
        }
    }

    return (
        <div className={`fixed inset-0 ${darkMode ? 'bg-[#0f172a]' : 'bg-white'} flex flex-col items-center justify-center select-none lock-screen`}>
            <div className="relative flex flex-col items-center">
                {/* App icon */}
                <img src={`${import.meta.env.BASE_URL}apple-touch-icon.png`} alt="財務管家" className="w-24 h-24 rounded-3xl shadow-lg mb-6" />

                <h1 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>財務管家</h1>
                <p className={`text-sm mb-10 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>請驗證身分以繼續使用</p>

                {/* Face ID button */}
                <button
                    onClick={authenticate}
                    disabled={attempting}
                    className={`w-20 h-20 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center mb-4 hover:opacity-80 transition active:scale-95 cursor-pointer disabled:opacity-50 lock-faceid-btn`}
                >
                    {attempting ? (
                        <div className={`w-8 h-8 border-2 ${darkMode ? 'border-gray-600 border-t-indigo-400' : 'border-gray-300 border-t-indigo-500'} rounded-full animate-spin`} />
                    ) : (
                        <IconFaceId className="w-10 h-10 text-indigo-500" />
                    )}
                </button>

                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {attempting ? '驗證中...' : '點擊使用 Face ID 解鎖'}
                </p>

                {error && (
                    <div className="mt-4 bg-red-50 text-red-500 rounded-xl px-4 py-2 text-sm">
                        {error}
                    </div>
                )}

                {/* Skip button for development */}
                <button
                    onClick={onUnlock}
                    className={`mt-8 text-xs transition cursor-pointer ${darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-300 hover:text-gray-500'}`}
                >
                    略過驗證
                </button>
            </div>
        </div>
    )
}

// Helper: Setup Face ID credential
export async function setupFaceId() {
    if (!window.PublicKeyCredential) {
        throw new Error('此裝置不支援生物辨識')
    }

    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    if (!available) {
        throw new Error('此裝置沒有可用的生物辨識功能')
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const credential = await navigator.credentials.create({
        publicKey: {
            challenge,
            rp: { name: '我的財務管家', id: location.hostname },
            user: {
                id: crypto.getRandomValues(new Uint8Array(16)),
                name: 'user',
                displayName: '使用者',
            },
            pubKeyCredParams: [
                { type: 'public-key', alg: -7 },
                { type: 'public-key', alg: -257 },
            ],
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required',
                residentKey: 'preferred',
            },
            timeout: 60000,
        }
    })

    const credIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
    localStorage.setItem('faceId-credentialId', credIdBase64)
    localStorage.setItem('faceId-enabled', 'true')
    return true
}

export function removeFaceId() {
    localStorage.removeItem('faceId-credentialId')
    localStorage.removeItem('faceId-enabled')
}

export function isFaceIdEnabled() {
    return localStorage.getItem('faceId-enabled') === 'true'
}

export function isFaceIdAvailable() {
    return !!window.PublicKeyCredential
}
