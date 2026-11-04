import React, { type ReactNode } from 'react'
import { Skeleton, FormStatus } from '../ui/Feedback'

export interface AsyncBoundaryProps {
  loading?: boolean;
  error?: ReactNode;
  isEmpty?: boolean;
  emptyText?: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}

/** Standard loading / error / empty presentation for API-driven screens. */
function AsyncBoundary({
  loading,
  error,
  isEmpty,
  emptyText = 'Nothing here yet.',
  fallback,
  onRetry,
  children,
}: AsyncBoundaryProps) {
  if (loading) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="async-state async-loading p-6 space-y-3" role="status" aria-busy="true">
        <span className="sr-only">Loading content...</span>
        <Skeleton width="40%" height={24} borderRadius={6} />
        <Skeleton width="75%" height={16} borderRadius={4} />
        <Skeleton width="60%" height={16} borderRadius={4} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="async-state async-error p-4" role="alert">
        <FormStatus type="error">{error}</FormStatus>
        {onRetry && (
          <button type="button" className="outline-button mt-2" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }
  if (isEmpty) return <div className="no-products">{emptyText}</div>;
  return <>{children}</>;
}

export default AsyncBoundary;
