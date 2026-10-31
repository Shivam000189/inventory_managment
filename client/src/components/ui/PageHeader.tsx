import React, { type HTMLAttributes, type ReactNode } from 'react'
import { Button } from './Button'
import './PageHeader.css'

export interface PageHeaderAction {
  key?: string | number
  label?: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | string
  onClick?: () => void
  disabled?: boolean
  icon?: string | ReactNode
  loading?: boolean
  size?: 'sm' | 'md' | 'lg' | string
}

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  kicker?: ReactNode
  title: ReactNode
  description?: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  scope?: ReactNode
  actions?: ReactNode | (ReactNode | PageHeaderAction)[]
  className?: string
}

export function PageHeader({
  kicker = null,
  title,
  description = null,
  subtitle = null,
  badge = null,
  scope = null,
  actions = null,
  className = '',
  ...props
}: PageHeaderProps) {
  const desc = description || subtitle

  const renderActions = () => {
    if (!actions) return null
    if (Array.isArray(actions)) {
      return actions.map((action: any, idx) => {
        if (React.isValidElement(action)) return action
        if (typeof action === 'object' && action !== null) {
          return (
            <Button
              key={action.key || action.label || idx}
              variant={action.variant || 'secondary'}
              onClick={action.onClick}
              disabled={action.disabled}
              icon={action.icon}
              loading={action.loading}
              size={action.size || 'md'}
            >
              {action.label}
            </Button>
          )
        }
        return action
      })
    }
    return actions
  }

  return (
    <header className={`ui-page-header ${className}`} {...props}>
      <div className="ui-page-header-content">
        <div className="ui-page-header-meta">
          {kicker && <p className="ui-page-header-kicker">{kicker}</p>}
          {scope && <span className="ui-page-header-scope">{scope}</span>}
        </div>
        <div className="ui-page-header-title-row">
          <h1 className="ui-page-header-title">{title}</h1>
          {badge}
        </div>
        {desc && <p className="ui-page-header-desc">{desc}</p>}
      </div>
      {actions && <div className="ui-page-header-actions">{renderActions()}</div>}
    </header>
  )
}

export default PageHeader
