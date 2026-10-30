import React, { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './icons'
import './Modal.css'

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: ReactNode;
  kicker?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  'aria-describedby'?: string;
}

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
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return undefined

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const prevFocusedElement = document.activeElement as HTMLElement | null
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable && focusable.length > 0) {
      focusable[0].focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.stopPropagation()
        onClose?.()
      }
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose?.()
    }
  }

  const content = (
    <div
      className="ui-modal-overlay"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className={`ui-modal ui-modal-${size} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
      >
        <div className="ui-modal-header">
          <div>
            {kicker && <div className="ui-modal-kicker">{kicker}</div>}
            {title && (
              <h2 id={titleId} className="ui-modal-title">
                {title}
              </h2>
            )}
          </div>
          <button
            type="button"
            className="ui-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="ui-modal-body">{children}</div>

        {footer && <div className="ui-modal-footer">{footer}</div>}
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : content
}

export default Modal
