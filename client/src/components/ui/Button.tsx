import React, { type ButtonHTMLAttributes, type ReactNode } from 'react'
import './Button.css'
import { Icon } from './icons'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | string;
export type ButtonSize = 'sm' | 'md' | 'lg' | string;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  isLoading?: boolean;
  icon?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  [key: string]: unknown;
}

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
}: ButtonProps) {
  const classes = [
    'ui-btn',
    `ui-btn-${variant}`,
    `ui-btn-${size}`,
    isLoading ? 'ui-btn-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const renderIcon = (ic: any) => {
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
