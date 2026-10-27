import { Fragment, useCallback, useMemo, useState } from 'react'
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
  const [mobileExpanded, setMobileExpanded] = useState([])

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

  const toggleMobileCardExpand = (key) => {
    setMobileExpanded((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
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

  const primaryCol = columns[0]
  const actionCol = columns.find((c) => c.key === 'actions' || c.key === 'action')
  const detailCols = columns.filter((c) => c !== actionCol)

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

      {/* 2. Mobile Stacked Cards (<= 640px) */}
      <div className="ui-data-table-cards">
        {data.map((row, index) => {
          const rowKey = getRowKey(row, index)
          const isSelected = selectedKeys.includes(rowKey)
          const isCardExpanded = mobileExpanded.includes(rowKey)

          return (
            <article
              key={rowKey}
              className={`ui-table-card ${isSelected ? 'selected' : ''} ${isCardExpanded ? 'expanded' : ''}`}
            >
              {/* Card Head */}
              <div className="ui-table-card-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  {selectable && (
                    <input
                      type="checkbox"
                      className="invoice-checkbox ui-checkbox"
                      checked={isSelected}
                      onChange={() => onSelectKey && onSelectKey(rowKey, row)}
                      aria-label={`Select item ${rowKey}`}
                    />
                  )}
                  <span className="ui-table-card-title">
                    {primaryCol?.render
                      ? primaryCol.render(row, index)
                      : row[primaryCol?.key]}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="ui-table-card-body">
                {detailCols.slice(1).map((col) => {
                  const isLowPriority = col.priority === 'low' || col.priority >= 2
                  const content = col.render ? col.render(row, index) : row[col.key]

                  return (
                    <div
                      key={col.key}
                      className={`ui-table-card-row ${isLowPriority ? 'ui-table-card-low-priority' : ''}`}
                    >
                      <span className="ui-table-card-label">
                        {col.mobileLabel || col.header}
                      </span>
                      <span className="ui-table-card-value">{content}</span>
                    </div>
                  )
                })}
              </div>

              {/* Expand details toggle if low-priority columns exist */}
              {detailCols.some((c) => c.priority === 'low' || c.priority >= 2) && (
                <button
                  type="button"
                  className="ui-table-card-toggle-btn"
                  onClick={() => toggleMobileCardExpand(rowKey)}
                >
                  {isCardExpanded ? '↑ Hide extra details' : '↓ Show extra details'}
                </button>
              )}

              {/* Actions Footer */}
              {actionCol && (
                <div className="ui-table-card-actions">
                  {actionCol.render ? actionCol.render(row, index) : row[actionCol.key]}
                </div>
              )}
            </article>
          )
        })}
      </div>

      {/* 3. Pagination Footer */}
      {pagination && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px var(--space-4)',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)' }}>
            Page {pagination.page} of {pagination.pages || 1}
            {pagination.total !== undefined && ` (${pagination.total} items)`}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              size="sm"
              variant="secondary"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pagination.page >= (pagination.pages || 1)}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
export default DataTable
