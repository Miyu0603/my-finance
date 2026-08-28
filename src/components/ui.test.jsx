import { describe, it, expect, afterEach } from 'vitest'
import { useState } from 'react'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal, TextField } from './ui'

/**
 * Regression: every keystroke re-rendered the parent, which handed Modal a new
 * inline onClose. The focus effect depended on it, so it tore down and re-ran
 * on each character and yanked focus back to the first field — typing "ABC"
 * into the third field put "A" there and "BC" in the first one.
 */
function Harness() {
  const [open, setOpen] = useState(true)
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  if (!open) return <p>closed</p>
  return (
    <Modal title="測試表單" onClose={() => setOpen(false)}>
      <TextField label="第一欄" value={first} onChange={setFirst} />
      <TextField label="第二欄" value={second} onChange={setSecond} />
    </Modal>
  )
}

describe('Modal', () => {
  afterEach(cleanup)

  it('keeps focus in the field being typed into', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const second = screen.getByLabelText('第二欄')
    await user.click(second)
    await user.keyboard('ABC')

    expect(document.activeElement).toBe(second)
    expect(second.value).toBe('ABC')
    expect(screen.getByLabelText('第一欄').value).toBe('')
  })

  it('moves focus to the first real control rather than the close button', async () => {
    render(<Harness />)
    expect(document.activeElement).toBe(screen.getByLabelText('第一欄'))
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.keyboard('{Escape}')
    expect(screen.getByText('closed')).toBeTruthy()
  })

  it('restores page scrolling when it unmounts', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(document.body.style.overflow).toBe('hidden')
    await user.keyboard('{Escape}')
    expect(document.body.style.overflow).toBe('')
  })
})
