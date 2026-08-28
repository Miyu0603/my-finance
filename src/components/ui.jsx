import { useEffect, useId, useRef } from 'react'
import { IconClose, IconWarning } from './icons'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/** Only the top-most dialog reacts to Escape, so a confirm inside a form modal
 *  closes just itself rather than tearing down both. */
const modalStack = []

/**
 * Shared dialog shell: Escape to close, focus moved in and trapped, background
 * scroll locked, and the whole thing announced as a modal to screen readers.
 * Every modal in the app goes through this so the behaviour can't drift apart.
 */
export function Modal({ title, subtitle, icon, tint = 'tint-indigo', onClose, children, footer }) {
  const panelRef = useRef(null)
  const labelledBy = useId()

  /*
   * Callers pass an inline arrow for onClose, so it is a new function on every
   * render. The focus effect below must not depend on it: it would tear down
   * and re-run on each keystroke, and its cleanup/setup pair would drag focus
   * back to the first field. Typing "ABC" into the third input used to put "A"
   * there and "BC" in the first one.
   */
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    const previouslyFocused = document.activeElement
    const panel = panelRef.current
    const token = {}
    modalStack.push(token)
    // Prefer the first real control over the close button in the header.
    const focusables = panel ? [...panel.querySelectorAll(FOCUSABLE)] : []
    const initial = focusables.find(el => !el.hasAttribute('data-modal-close')) || focusables[0]
    initial?.focus()

    const isTopMost = () => modalStack[modalStack.length - 1] === token

    const onKeyDown = (e) => {
      if (!isTopMost()) return
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter(el => !el.disabled)
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      modalStack.splice(modalStack.indexOf(token), 1)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-scrim backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={labelledBy}
        className="bg-surface rounded-card shadow-2xl p-5 md:p-6 w-full max-w-md border border-line my-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-5">
          {icon && <div className={`w-10 h-10 rounded-tile flex items-center justify-center shrink-0 ${tint}`}>{icon}</div>}
          <div className="flex-1 min-w-0">
            <h2 id={labelledBy} className="text-lg font-bold text-ink">{title}</h2>
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="關閉" data-modal-close
            className="w-8 h-8 rounded-pill flex items-center justify-center text-muted hover:text-ink-3 hover:bg-surface-3 transition cursor-pointer shrink-0">
            <IconClose className="w-4 h-4" />
          </button>
        </div>
        {children}
        {footer && <div className="flex gap-3 mt-6">{footer}</div>}
      </div>
    </div>
  )
}

export function PrimaryButton({ children, className = '', ...rest }) {
  return (
    <button {...rest}
      className={`flex-1 bg-solid text-on-solid py-3 rounded-pill text-sm font-medium hover:bg-solid-hover transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${className}`}>
      {children}
    </button>
  )
}

export function GhostButton({ children, className = '', ...rest }) {
  return (
    <button {...rest}
      className={`flex-1 bg-surface-2 text-ink-4 py-3 rounded-pill text-sm font-medium hover:bg-surface-3 transition cursor-pointer ${className}`}>
      {children}
    </button>
  )
}

export function Field({ label, hint, error, children, id }) {
  const generatedId = useId()
  const fieldId = id || generatedId
  return (
    <div>
      <label htmlFor={fieldId} className="text-sm font-medium text-ink-4 block mb-1.5">{label}</label>
      {children(fieldId)}
      {hint && !error && <p className="text-[11px] text-muted mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function TextField({ label, hint, value, onChange, ...input }) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <input id={id} className="field" value={value} onChange={e => onChange(e.target.value)} {...input} />
      )}
    </Field>
  )
}

export function SelectField({ label, hint, value, onChange, children, ...select }) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <select id={id} className="field" value={value} onChange={e => onChange(e.target.value)} {...select}>
          {children}
        </select>
      )}
    </Field>
  )
}

export function ErrorNote({ children }) {
  if (!children) return null
  return <p role="alert" className="text-sm text-red-500 tint-red px-3.5 py-2.5 rounded-tile">{children}</p>
}

/** Destructive actions all funnel through here — no more one-click deletes. */
export function ConfirmDialog({ title, message, detail, confirmLabel = '刪除', onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose} tint="tint-red" icon={<IconWarning className="w-5 h-5" />}
      footer={
        <>
          <button onClick={() => { onConfirm(); onClose() }}
            className="flex-1 bg-red-500 text-white py-3 rounded-pill text-sm font-medium hover:bg-red-600 transition cursor-pointer">
            {confirmLabel}
          </button>
          <GhostButton onClick={onClose}>取消</GhostButton>
        </>
      }>
      <p className="text-sm text-ink-3">{message}</p>
      {detail && <p className="text-xs text-muted mt-2">{detail}</p>}
    </Modal>
  )
}
