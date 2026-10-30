import React, { type ReactNode } from 'react'

export interface AsyncBoundaryProps {
  loading?: boolean;
  error?: ReactNode;
  isEmpty?: boolean;
  emptyText?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}

/** Standard loading / error / empty presentation for API-driven screens. */
function AsyncBoundary({
  loading,
  error,
  isEmpty,
  emptyText = 'Nothing here yet.',
  onRetry,
  children,
}: AsyncBoundaryProps) {
  if (loading) return <div className="async-state async-loading" role="status" aria-live="polite"><span className="loading-spinner" aria-hidden="true" />Loading…</div>
  if (error) {
    return (
      <div className="async-state async-error">
        <p>{error}</p>
        {onRetry && (
          <button type="button" className="outline-button" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    )
  }
  if (isEmpty) return <div className="no-products">{emptyText}</div>
  return children
}

export default AsyncBoundary
