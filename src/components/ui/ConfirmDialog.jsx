import { useEffect, useRef } from 'react'

export function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmTone = 'danger',
  onConfirm,
  onCancel,
}) {
  const confirmBtnRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCancel?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    confirmBtnRef.current?.focus()
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

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
        aria-labelledby="ui-confirm-dialog-title"
        aria-describedby="ui-confirm-dialog-desc"
      >
        <div className="product-form-heading">
          <div>
            <p className="dashboard-kicker">Confirmation</p>
            <h3 id="ui-confirm-dialog-title">{title}</h3>
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

        <p id="ui-confirm-dialog-desc" className="ui-dialog-message">
          {message}
        </p>

        <div className="product-form-actions ui-dialog-actions">
          <button
            type="button"
            className="outline-button"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className={`submit-button ${confirmTone === 'danger' ? 'danger-button' : ''}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
