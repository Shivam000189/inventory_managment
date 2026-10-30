import { Fragment, useCallback, useMemo } from 'react'
import { Icon } from './icons.jsx'
import { Button } from './Button.jsx'
import './DataTable.css'

export function DataTable({
  columns = [],
  data = [],
  keyField = null,
  loading = false,
  error = null,
  onRetry = null,
  emptyText = 'No items found.',
  emptyAction = null,
  selectable = false,
  selectedKeys = [],
  onSelectKey = null,
  onSelectAll = null,
  expandedKeys = [],
  onToggleExpand = null,
  renderExpanded = null,
  sortKey = null,
  sortDirection = 'asc',
  onSort = null,
  pagination = null,
  className = '',
}) {
  const getRowKey = useCallback(
    (row, index) => {
      if (keyField && row[keyField] !== undefined) return row[keyField]
      return (
        row.productId ||
        row.purchaseOrderId ||
        row.orderId ||
        row.supplierId ||
        row.customerId ||
        row.userId ||
        row.id ||
        row.key ||
        row._id ||
        String(index)
      )
    },
    [keyField]
  )

  const allSelected = useMemo(() => {
    if (!data.length) return false
    return data.every((row, i) => selectedKeys.includes(getRowKey(row, i)))
  }, [data, selectedKeys, getRowKey])

  const handleSelectAll = (e) => {
    if (!onSelectAll) return
    onSelectAll(e.target.checked)
  }

  // Loading State
  if (loading) {
    return (
      <div className={`ui-data-table-container ${className}`}>
        <div className="ui-data-table-wrap invoice-table-wrap" aria-busy="true">
          <div className="ui-table-skeleton-row">
            <div className="ui-skeleton-pulse" style={{ width: '40px' }} />
            <div className="ui-skeleton-pulse" style={{ width: '25%' }} />
            <div className="ui-skeleton-pulse" style={{ width: '20%' }} />
            <div className="ui-skeleton-pulse" style={{ width: '15%' }} />
            <div className="ui-skeleton-pulse" style={{ width: '20%' }} />
          </div>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="ui-table-skeleton-row">
              <div className="ui-skeleton-pulse" style={{ width: '40px' }} />
              <div className="ui-skeleton-pulse" style={{ width: '30%' }} />
              <div className="ui-skeleton-pulse" style={{ width: '25%' }} />
              <div className="ui-skeleton-pulse" style={{ width: '18%' }} />
              <div className="ui-skeleton-pulse" style={{ width: '15%' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className={`ui-data-table-container ${className}`}>
        <div
          className="ui-card"
          style={{
            padding: '32px',
            textAlign: 'center',
            borderColor: 'var(--danger)',
            backgroundColor: 'var(--danger-soft)',
          }}
          role="alert"
        >
          <div style={{ color: 'var(--danger)', marginBottom: '12px' }}>
            <Icon name="warning" size={32} />
          </div>
          <h3 style={{ color: 'var(--danger)', marginBottom: '8px' }}>
            Could not load data
          </h3>
          <p style={{ color: 'var(--text-soft)', marginBottom: '16px' }}>
            {error.message || String(error)}
          </p>
          {onRetry && (
            <Button variant="primary" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Empty State
  if (!data.length) {
    return (
      <div className={`ui-data-table-container ${className}`}>
        <div
          className="ui-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
            }}
          >
            <Icon name="package" size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
            No records found
          </h3>
          <p style={{ color: 'var(--text-soft)', maxWidth: '420px', fontSize: '14px' }}>
            {emptyText}
          </p>
          {emptyAction}
        </div>
      </div>
    )
  }

  return (
    <div className={`ui-data-table-container ${className}`}>
      {/* 1. Desktop & Tablet Real Table */}
      <div className="ui-data-table-wrap invoice-table-wrap">
        <table className="ui-data-table invoice-table">
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: '44px' }}>
                  <input
                    type="checkbox"
                    className="invoice-checkbox ui-checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all rows on this page"
                  />
                </th>
              )}
              {renderExpanded && <th style={{ width: '40px' }} />}
              {columns.map((col) => {
                const isSortable = Boolean(col.sortable && onSort)
                const isSorted = sortKey === col.key
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={[
                      isSortable ? 'sortable' : '',
                      col.align === 'right' ? 'ui-cell-right' : '',
                      col.align === 'center' ? 'ui-cell-center' : '',
                    ].filter(Boolean).join(' ')}
                    style={col.width ? { width: col.width } : undefined}
                    aria-sort={
                      isSorted
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                    onClick={() => isSortable && onSort(col.key)}
                  >
                    <span>{col.header}</span>
                    {isSortable && isSorted && (
                      <span className="sort-icon" aria-hidden="true">
                        <Icon
                          name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                          size={14}
                        />
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const rowKey = getRowKey(row, index)
              const isSelected = selectedKeys.includes(rowKey)
              const isExpanded = expandedKeys.includes(rowKey)

              return (
                <Fragment key={rowKey}>
                  <tr className={isSelected ? 'selected' : ''}>
                    {selectable && (
                      <td>
                        <input
                          type="checkbox"
                          className="invoice-checkbox ui-checkbox"
                          checked={isSelected}
                          onChange={() => onSelectKey && onSelectKey(rowKey, row)}
                          aria-label={`Select row ${rowKey}`}
                        />
                      </td>
                    )}
                    {renderExpanded && (
                      <td>
                        <button
                          type="button"
                          className={`ui-expand-btn ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => onToggleExpand && onToggleExpand(rowKey, row)}
                          aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                        >
                          <Icon name="chevron-down" size={16} />
                        </button>
                      </td>
                    )}
                    {columns.map((col) => {
                      const content = col.render
                        ? col.render(row, index)
                        : row[col.key]

                      return (
                        <td
                          key={col.key}
                          className={[
                            col.align === 'right' ? 'ui-cell-right' : '',
                            col.align === 'center' ? 'ui-cell-center' : '',
                          ].filter(Boolean).join(' ')}
                        >
                          {content}
                        </td>
                      )
                    })}
                  </tr>
                  {renderExpanded && isExpanded && (
                    <tr className="ui-table-expanded-row">
                      <td colSpan={columns.length + (selectable ? 1 : 0) + 1}>
                        {renderExpanded(row)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Pagination Footer (Dashboard Overview Pill Buttons) */}
      {pagination && (
        <div className="ui-data-table-pagination invoice-pagination">
          <span className="ui-page-info">
            Showing Page <strong className="invoice-page-num">{pagination.page}</strong> of{' '}
            <strong className="invoice-page-num">{pagination.pages || 1}</strong>
            {pagination.total !== undefined && ` (${pagination.total.toLocaleString()} records)`}
          </span>
          <div className="ui-page-buttons invoice-page-buttons">
            <button
              type="button"
              className="invoice-page-btn"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </button>
            <span className="invoice-page-num" style={{ margin: '0 4px', fontSize: '12px' }}>
              {pagination.page} / {pagination.pages || 1}
            </span>
            <button
              type="button"
              className="invoice-page-btn"
              disabled={pagination.page >= (pagination.pages || 1)}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
export default DataTable
