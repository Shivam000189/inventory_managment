import './Button.css'

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) {
  const classes = [
    'ui-btn',
    `ui-btn-${variant}`,
    `ui-btn-${size}`,
    isLoading ? 'ui-btn-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="ui-btn-spinner" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
}
export default Button
