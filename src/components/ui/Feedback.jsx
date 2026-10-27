import { Icon } from './icons.jsx'
import './Feedback.css'

export function EmptyState({
  title = 'No items found',
  description = null,
  icon = 'package',
  action = null,
  className = '',
}) {
  return (
    <div className={`ui-empty-state ${className}`}>
      <div className="ui-empty-icon" aria-hidden="true">
        {typeof icon === 'string' ? <Icon name={icon} size={28} /> : icon}
      </div>
      <h3 className="ui-empty-title">{title}</h3>
      {description && <p className="ui-empty-desc">{description}</p>}
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  )
}

export function Spinner({ size = 24, className = '', ...props }) {
  return (
    <span
      className={`ui-spinner ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      role="status"
      aria-label="Loading"
      {...props}
    />
  )
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 'var(--radius-xs)', className = '', style = {} }) {
  return (
    <div
      className={`ui-skeleton-pulse ${className}`}
      style={{ width, height, borderRadius, ...style }}
      aria-hidden="true"
    />
  )
}

export function FormStatus({ type = 'success', variant = type, message, children, onClose = null, className = '' }) {
  const content = message || children
  if (!content) return null
  const statusType = variant || type
  return (
    <div
      className={`ui-form-status ui-form-status-${statusType} form-status ${statusType === 'error' ? 'error' : ''} ${className}`}
      role={statusType === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <Icon name={statusType === 'error' ? 'alert-circle' : statusType === 'warning' ? 'warning' : 'check'} size={18} />
      <span style={{ flex: '1 1 auto' }}>{content}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
          aria-label="Dismiss message"
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  )
}

export const Toast = FormStatus
export const Alert = FormStatus
