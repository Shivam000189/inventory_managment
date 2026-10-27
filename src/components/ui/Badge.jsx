import './Badge.css'

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  className = '',
  ...props
}) {
  const classes = ['ui-badge', `ui-badge-${tone}`, className]
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
