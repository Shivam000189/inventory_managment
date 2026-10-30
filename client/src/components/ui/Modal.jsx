import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './icons.jsx'
import './Modal.css'

export function Modal({
  isOpen,
  onClose,
  title = null,
  kicker = null,
  size = 'md',
  children,
  footer = null,
  className = '',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  'aria-describedby': ariaDescribedBy,
}) {
  const dialogRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return undefined

    // Scroll lock on body
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus inside modal
    const prevFocusedElement = document.activeElement
    const focusable = dialogRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable && focusable.length > 0) {
      focusable[0].focus()
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.stopPropagation()
        onClose?.()
      }
      // Focus trap
      if (event.key === 'Tab' && focusable && focusable.length > 0) {
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
      if (prevFocusedElement && prevFocusedElement.focus) {
        prevFocusedElement.focus()
      }
    }
  }, [isOpen, closeOnEscape, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose?.()
    }
  }

  const dialogContent = (
    <div
      className="ui-modal-backdrop supplier-modal-backdrop"
      role="presentation"
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className={`ui-modal-dialog supplier-modal ui-modal-dialog-${size} ${className}`}
      >
        {title && (
          <div className="ui-modal-header product-form-heading">
            <div>
              {kicker && <p className="dashboard-kicker">{kicker}</p>}
              <h2 id={titleId} className="ui-modal-title">
                {title}
              </h2>
            </div>
            {onClose && (
              <button
                type="button"
                className="ui-modal-close-btn close-button"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <Icon name="close" size={18} />
              </button>
            )}
          </div>
        )}
        <div className="ui-modal-body">{children}</div>
        {footer && (
          <div className="ui-modal-footer product-form-actions">{footer}</div>
        )}
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(dialogContent, document.body)
    : dialogContent
}

export default Modal
