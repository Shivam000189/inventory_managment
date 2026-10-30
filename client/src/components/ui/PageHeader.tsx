import React, { type ReactNode, type HTMLAttributes } from 'react'
import { Button } from './Button'
import './PageHeader.css'

export interface PageHeaderAction {
  key?: string;
  label?: ReactNode;
  variant?: any;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  size?: any;
}

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  kicker?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  scope?: ReactNode;
  actions?: ReactNode | (ReactNode | PageHeaderAction)[];
  className?: string;
  [key: string]: unknown;
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
      return actions.map((action: any, idx: number) => {
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
          {badge && <span className="ui-page-header-badge">{badge}</span>}
        </div>
        {desc && <p className="ui-page-header-desc">{desc}</p>}
      </div>
      {actions && (
        <div className="ui-page-header-actions">{renderActions()}</div>
      )}
    </header>
  )
}
export default PageHeader
