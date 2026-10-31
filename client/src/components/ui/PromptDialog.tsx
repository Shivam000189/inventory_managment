import React, { useEffect, useRef, useState, type ReactNode } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Input } from './FormControls'

export interface PromptDialogProps {
  isOpen: boolean
  title: ReactNode
  message?: ReactNode
  defaultValue?: string
  placeholder?: string
  inputType?: string
  confirmText?: ReactNode
  cancelText?: ReactNode
  onConfirm?: (val: string) => void
  onCancel?: () => void
}

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
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
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
          onChange={(e: any) => setValue(e.target.value)}
          placeholder={placeholder}
          required
        />
      </form>
    </Modal>
  )
}
export default PromptDialog
