import type { ReactNode } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import type { PlatformMeta } from './platformApi'

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="platform-title-row">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`platform-status platform-status-${status}`}>{status}</span>
}

export function InlineError({ message }: { message: string }) {
  return (
    <div className="platform-table-error" role="alert">
      <AlertCircle size={16} aria-hidden="true" /> {message}
    </div>
  )
}

export function TableState({
  loading,
  error,
  empty,
  columns,
}: {
  loading: boolean
  error: string
  empty: boolean
  columns: number
}) {
  if (loading) {
    return (
      <tr>
        <td colSpan={columns} className="platform-state" role="status" aria-busy="true">
          Loading records…
        </td>
      </tr>
    )
  }
  if (error) {
    return (
      <tr>
        <td colSpan={columns}><InlineError message={error} /></td>
      </tr>
    )
  }
  if (empty) {
    return (
      <tr>
        <td colSpan={columns} className="platform-state">No matching records found.</td>
      </tr>
    )
  }
  return null
}

export function Pagination({
  meta,
  loading,
  onPageChange,
}: {
  meta: PlatformMeta
  loading: boolean
  onPageChange: (page: number) => void
}) {
  const pages = Math.max(meta.pages, 1)
  const first = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1
  const last = Math.min(meta.page * meta.limit, meta.total)

  return (
    <div className="platform-pagination">
      <span>{first}–{last} of {meta.total}</span>
      <div className="platform-pagination-actions">
        <button
          className="platform-button"
          type="button"
          disabled={loading || meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft size={15} aria-hidden="true" /> Previous
        </button>
        <span aria-live="polite">Page {meta.page} of {pages}</span>
        <button
          className="platform-button"
          type="button"
          disabled={loading || meta.page >= pages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next <ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
