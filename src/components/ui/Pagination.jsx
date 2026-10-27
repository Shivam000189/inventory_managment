import { Button } from './Button.jsx'
import './Pagination.css'

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems = null,
  className = '',
}) {
  const pages = Math.max(1, totalPages || 1)
  const page = Math.min(Math.max(1, currentPage), pages)

  return (
    <div className={`ui-pagination overview-pagination ${className}`}>
      <div className="ui-pagination-info">
        <span>
          Page <strong>{page}</strong> of <strong>{pages}</strong>
        </span>
        {totalItems !== null && (
          <small>({totalItems.toLocaleString()} total items)</small>
        )}
      </div>
      <div className="ui-pagination-controls">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Go to previous page"
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Go to next page"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
export default Pagination
