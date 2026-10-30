import React, {
  forwardRef,
  useId,
  type ReactNode,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import './FormControls.css'

export interface FieldRenderProps {
  id: string;
  'aria-describedby'?: string;
  isInvalid: boolean;
}

export interface FieldProps {
  label?: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  id?: string;
  children: ReactNode | ((props: FieldRenderProps) => ReactNode);
  className?: string;
}

export function Field({
  label,
  required = false,
  hint = null,
  error = null,
  id: explicitId,
  children,
  className = '',
}: FieldProps) {
  const generatedId = useId()
  const fieldId = explicitId || generatedId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div className={`ui-field ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="ui-field-label">
          {label}
          {required && <span className="ui-field-required" aria-hidden="true">*</span>}
        </label>
      )}
      {typeof children === 'function'
        ? children({ id: fieldId, 'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined, isInvalid: Boolean(error) })
        : children}
      {hint && (
        <span id={hintId} className="ui-field-hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} className="ui-field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  isInvalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { isInvalid = false, className = '', type = 'text', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={`ui-input ${isInvalid ? 'ui-input-invalid' : ''} ${className}`}
      aria-invalid={isInvalid ? 'true' : undefined}
      {...props}
    />
  )
})

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  isInvalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { isInvalid = false, className = '', children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={`ui-select ${isInvalid ? 'ui-select-invalid' : ''} ${className}`}
      aria-invalid={isInvalid ? 'true' : undefined}
      {...props}
    >
      {children}
    </select>
  )
})

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  isInvalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { isInvalid = false, className = '', rows = 3, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`ui-textarea ${isInvalid ? 'ui-textarea-invalid' : ''} ${className}`}
      aria-invalid={isInvalid ? 'true' : undefined}
      {...props}
    />
  )
})

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className = '', id: explicitId, ...props },
  ref
) {
  const generatedId = useId()
  const checkboxId = explicitId || generatedId

  return (
    <label htmlFor={checkboxId} className={`ui-checkbox-wrap ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        id={checkboxId}
        className="ui-checkbox invoice-checkbox"
        {...props}
      />
      {label && <span>{label}</span>}
    </label>
  )
})
