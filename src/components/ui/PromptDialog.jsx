import { useEffect, useRef, useState } from 'react'

function PromptDialogContent({
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
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCancel?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm?.(value)
  }

  return (
    <div
      className="supplier-modal-backdrop ui-dialog-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.()
      }}
    >
      <div
        className="supplier-modal ui-dialog-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ui-prompt-dialog-title"
        aria-describedby="ui-prompt-dialog-desc"
      >
        <form onSubmit={handleSubmit}>
          <div className="product-form-heading">
            <div>
              <p className="dashboard-kicker">Prompt</p>
              <h3 id="ui-prompt-dialog-title">{title}</h3>
            </div>
            <button
              type="button"
              className="close-button"
              onClick={onCancel}
              aria-label="Close dialog"
            >
              ×
            </button>
          </div>

          {message && (
            <p id="ui-prompt-dialog-desc" className="ui-dialog-message">
              {message}
            </p>
          )}

          <div style={{ marginTop: '12px' }}>
            <input
              ref={inputRef}
              type={inputType}
              className="text-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              required
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div className="product-form-actions ui-dialog-actions" style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="outline-button"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              type="submit"
              className="submit-button"
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function PromptDialog({ isOpen, ...props }) {
  if (!isOpen) return null
  return <PromptDialogContent {...props} />
}
