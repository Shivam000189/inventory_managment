import './Button.css'
import { Icon } from './icons.jsx'

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  isLoading = loading,
  icon = null,
  leftIcon = icon,
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

  const renderIcon = (ic) => {
    if (!ic) return null
    if (typeof ic === 'string') {
      return <Icon name={ic} size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
    }
    return ic
  }

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
        renderIcon(leftIcon)
      )}
      {children}
      {!isLoading && renderIcon(rightIcon)}
    </button>
  )
}
export default Button
