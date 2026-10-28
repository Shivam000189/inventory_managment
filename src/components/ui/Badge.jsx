import './Badge.css'

export function Badge({
  children,
  tone = 'neutral',
  variant = 'solid',
  dot = false,
  className = '',
  ...props
}) {
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
