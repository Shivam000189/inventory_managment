import React, { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './icons'
import './Drawer.css'

export interface DrawerProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: ReactNode;
  position?: 'left' | 'right';
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title = null,
  position = 'left',
  children,
  footer = null,
  className = '',
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return undefined

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const prevActive = document.activeElement as HTMLElement | null

    const handleKeyDown = (e: KeyboardEvent) => {
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
      <div
        ref={drawerRef}
        className={`ui-drawer ui-drawer-${position} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        <div className="ui-drawer-header">
          {title && (
            <h2 id={titleId} className="ui-drawer-title">
              {title}
            </h2>
          )}
          <button
            type="button"
            className="ui-drawer-close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="ui-drawer-body">{children}</div>
        {footer && <div className="ui-drawer-footer">{footer}</div>}
      </div>
    </>
  )

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : content
}
export default Drawer
