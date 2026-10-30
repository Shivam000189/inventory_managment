import React, { type HTMLAttributes, type ReactNode, type ElementType } from 'react'
import { Icon } from './icons'
import './Card.css'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  className?: string;
  as?: ElementType;
  interactive?: boolean;
  [key: string]: unknown;
}

export function Card({
  children,
  className = '',
  as: Component = 'div',
  interactive = false,
  ...props
}: CardProps) {
  const classes = [
    'ui-card',
    'modern-panel-card',
    interactive ? 'ui-card-interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  )
}

export const Panel = Card

export interface StatGridProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
}

export function StatGrid({ children, className = '', ...props }: StatGridProps) {
  const classes = ['ui-stat-grid', 'modern-kpi-row', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export interface StatCardProps extends Omit<HTMLAttributes<HTMLElement>, "title" | "onClick"> {
  title?: ReactNode;
  label?: ReactNode;
  value?: ReactNode;
  subtitle?: ReactNode;
  helpText?: ReactNode;
  subtext?: ReactNode;
  delta?: ReactNode;
  deltaType?: string | null;
  icon?: ReactNode;
  tone?: string;
  onClick?: any;
  href?: string | null;
  className?: string;
  [key: string]: unknown;
}

export function StatCard({
  title,
  label,
  value,
  subtitle = null,
  helpText = null,
  subtext = null,
  delta = null,
  deltaType = null,
  icon = null,
  tone = 'blue',
  onClick = null,
  href = null,
  className = '',
  ...props
}: StatCardProps) {
  const isClickable = Boolean(onClick || href)
  const Component = href ? 'a' : isClickable ? 'button' : 'div'
  const componentProps = href ? { href } : isClickable ? { type: 'button', onClick } : {}

  const displayTitle = title || label
  const displaySubtitle = subtitle || helpText || subtext

  const normalizedTone =
    tone === 'info'
      ? 'blue'
      : tone === 'success'
      ? 'green'
      : tone === 'warning' || tone === 'amber'
      ? 'yellow'
      : tone === 'danger' || tone === 'red'
      ? 'rose'
      : tone

  const classes = [
    'ui-stat-card',
    'modern-kpi-card',
    `tone-${normalizedTone}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const bubbleClass = `ui-stat-bubble modern-kpi-icon-bubble bubble-${normalizedTone}`

  return (
    <Component className={classes} {...(componentProps as any)} {...props}>
      <div className="ui-stat-texts modern-kpi-texts">
        <span className="ui-stat-title modern-kpi-title">{displayTitle}</span>
        <span className="ui-stat-value modern-kpi-value">
          {value}
          {delta && (
            <span className={`ui-stat-delta delta-${deltaType || 'neutral'}`}>
              {delta}
            </span>
          )}
        </span>
        {displaySubtitle && <span className="ui-stat-subtitle">{displaySubtitle}</span>}
      </div>
      {icon && (
        <div className={bubbleClass} aria-hidden="true">
          {typeof icon === 'string' ? <Icon name={icon} /> : icon}
        </div>
      )}
    </Component>
  )
}

export default Card
