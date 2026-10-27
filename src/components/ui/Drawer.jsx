import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './icons.jsx'
import './Drawer.css'

export function Drawer({
  isOpen,
  onClose,
  title = null,
  position = 'left', // 'left' | 'right'
  children,
  footer = null,
  className = '',
}) {
  const drawerRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return undefined

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const prevActive = document.activeElement

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
      if (prevActive && prevActive.focus) {
        prevActive.focus()
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const content = (
    <>
      <div
        className="ui-drawer-backdrop"
        role="presentation"
        onClick={onClose}
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`ui-drawer ui-drawer-${position} ${className}`}
      >
        {title && (
          <div className="ui-drawer-header">
            <h2 id={titleId} className="ui-drawer-title">
              {title}
            </h2>
            <button
              type="button"
              className="ui-modal-close-btn close-button"
              onClick={onClose}
              aria-label="Close drawer"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        )}
        <div className="ui-drawer-body">{children}</div>
        {footer && <div className="ui-drawer-footer">{footer}</div>}
      </aside>
    </>
  )

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : content
}
export default Drawer
