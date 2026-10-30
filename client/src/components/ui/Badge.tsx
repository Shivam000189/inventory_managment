import React, { type HTMLAttributes, type ReactNode } from 'react'
import './Badge.css'

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'green' | 'yellow' | 'amber' | 'red' | 'rose' | 'blue' | string;
export type BadgeVariant = 'solid' | 'soft' | string;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
  tone?: BadgeTone;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
  [key: string]: unknown;
}

export function Badge({
  children,
  tone = 'neutral',
  variant = 'solid',
  dot = false,
  className = '',
  ...props
}: BadgeProps) {
  const normalizedTone =
    tone === 'green'
      ? 'success'
      : tone === 'yellow' || tone === 'amber'
      ? 'warning'
      : tone === 'red' || tone === 'rose'
      ? 'danger'
      : tone === 'blue'
      ? 'info'
      : tone

  const classes = [
    'ui-badge',
    `ui-badge-${normalizedTone}`,
    variant === 'soft' ? 'variant-soft' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} {...props}>
      {dot && <span className="ui-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  )
}

export const StatusPill = Badge
export default Badge
