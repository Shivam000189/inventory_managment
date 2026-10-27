import { useEffect, useRef, useState } from 'react'
import { Modal } from './Modal.jsx'
import { Button } from './Button.jsx'
import { Input } from './FormControls.jsx'

export function PromptDialog({
  isOpen,
  title,
  message,
  defaultValue = '',
  placeholder = '',
  inputType = 'text',
  confirmText = 'Submit',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm?.(value)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      kicker="Prompt"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant="primary" type="submit" onClick={handleSubmit}>
            {confirmText}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {message && (
          <p style={{ margin: 0, color: 'var(--text)', fontSize: 'var(--fs-md)', lineHeight: 'var(--lh)' }}>
            {message}
          </p>
        )}
        <Input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          required
        />
      </form>
    </Modal>
  )
}
export default PromptDialog
