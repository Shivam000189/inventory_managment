import { useEffect, useMemo, useRef, useState } from 'react'
import AsyncBoundary from '../../components/feedback/AsyncBoundary.jsx'
import '../../styles/stock-history.css'
import '../../styles/inventory-dashboard.css'

function AuditIcon({ name, ...props }) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    export: <><path d="M12 3v12m-4-4 4 4 4-4" /><path d="M5 17v3h14v-3" /></>,
    adjust: <><path d="M4 8h11M4 8a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm16 8H9m11 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3Z" /><path d="m9.3 12 2 2 3.4-4.2" /></>,
    inward: <path d="M12 5v14M19 12l-7 7-7-7" />,
    outward: <path d="M12 19V5M5 12l7-7 7 7" />,
    money: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
    box: <><path d="m12 3 9 5v9l-9 5-9-5V8l9-5Zm0 9 9-4M3 8l9 4v10M7.5 5.5l9 5" /></>,
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  )
}

const INCREASE_TYPES = new Set(['stock_in', 'sales_return'])
const DECREASE_TYPES = new Set(['stock_out', 'purchase_return'])

const EVENT_META = {
  stock_in: { label: 'Stock In', tone: 'in', group: 'in' },
  sales_return: { label: 'Sales Return', tone: 'in', group: 'in' },
  stock_out: { label: 'Stock Out', tone: 'out', group: 'out' },
  purchase_return: { label: 'Purchase Return', tone: 'out', group: 'out' },
  adjustment: { label: 'Adjustment', tone: 'flex', group: 'flex' },
  non_sellable_return: { label: 'Damaged Return', tone: 'flex', group: 'flex' },
}

const metaFor = (type) =>
  EVENT_META[type] || { label: (type || 'movement').replace(/_/g, ' '), tone: 'flex', group: 'flex' }

const toDateValue = (date) => {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function describeEntry(item, meta) {
  const reason = (item.reason || '').trim()
  const ref = (item.referenceId || '').trim()
  let label = reason || meta.label
  let detail = ''
  const colon = reason.indexOf(': ')
  if (colon > -1) {
    label = reason.slice(0, colon)
    detail = reason.slice(colon + 2)
  } else if (ref) {
    detail = /^[a-f0-9]{24}$/i.test(ref) ? `#${ref.slice(-8).toUpperCase()}` : ref
  }
  const source =
    (item.createdBy || '').trim() ||
    (meta.group === 'out' ? 'POS Terminal' : meta.group === 'in' ? 'Receiving Dock' : 'System Terminal')
  return { label, detail, source }
}

export default function StockHistoryView({
  transactions = [],
  products = [],
  business = {},
  loading,
  error,
  refetch,
  onNavigate,
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [from, setFrom] = useState(() => toDateValue(Date.now() - 30 * 864e5))
  const [to, setTo] = useState(() => toDateValue(Date.now()))
  const [page, setPage] = useState(1)
  const [tableOpen, setTableOpen] = useState(true)
  const pageSize = 12

  const searchRef = useRef(null)

  const currency = business.currency || 'INR'
  const money = (value, dp = 2) => {
    const amount = Number(value || 0)
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: dp, maximumFractionDigits: dp }).format(amount)
    } catch {
      return `${currency} ${amount.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`
    }
  }

  const productById = useMemo(
    () => new Map(products.map((product) => [product.productId, product])),
    [products]
  )

  const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity
  const toTime = to ? new Date(`${to}T23:59:59.999`).getTime() : Infinity

  const dateFiltered = useMemo(
    () =>
      transactions.filter((item) => {
        const at = new Date(item.createdAt).getTime()
        return at >= fromTime && at <= toTime
      }),
    [transactions, fromTime, toTime]
  )

  const stats = useMemo(() => {
    const received = dateFiltered
      .filter((item) => INCREASE_TYPES.has(item.type))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const dispatched = dateFiltered
      .filter((item) => DECREASE_TYPES.has(item.type))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const valuation = dateFiltered.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(productById.get(item.productId)?.purchasePrice || 0),
      0
    )

    return {
      total: dateFiltered.length,
      received,
      dispatched,
      net: received - dispatched,
      valuation,
    }
  }, [dateFiltered, productById])

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return dateFiltered.filter((item) => {
      const meta = metaFor(item.type)
      if (filter !== 'all' && meta.group !== filter) return false
      if (!query) return true
      const product = productById.get(item.productId)
      return [
        meta.label,
        product?.name,
        item.variantSku || product?.sku,
        item.variantColor || product?.color,
        item.variantSize || product?.size,
        item.reason,
        item.referenceId,
        item.createdBy,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [dateFiltered, filter, search, productById])

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const currentItems = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const exportAudit = () => {
    const escapeCell = (value) => {
      const text = String(value ?? '')
      const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text
      return `"${safe.replaceAll('"', '""')}"`
    }
    const rows = [
      [
        'Date',
        'Time',
        'Event Type',
        'Product',
        'SKU',
        'Quantity',
        'Previous Stock',
        'New Stock',
        'Reason',
        'Reference',
        'Source',
      ],
      ...visible.map((item) => {
        const meta = metaFor(item.type)
        const product = productById.get(item.productId)
        const when = new Date(item.createdAt)
        const { label, detail, source } = describeEntry(item, meta)
        return [
          when.toLocaleDateString('en-GB'),
          when.toLocaleTimeString('en-GB', { hour12: false }),
          meta.label,
          product?.name || item.productId,
          item.variantSku || product?.sku || '',
          item.quantity,
          item.previousStock,
          item.newStock,
          detail ? `${label} • ${detail}` : label,
          item.referenceId || '',
          source,
        ]
      }),
    ]
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `stock-movement-audit-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="modern-dashboard-content inventory-dashboard-page" aria-busy={loading}>
      {/* 1. Header Toolbar */}
      <header className="inventory-page-header">
        <div className="inventory-header-left">
          <div className="inventory-header-title-row">
            <h1>Movement Audit &amp; Transaction Ledger</h1>
            <span className={`inventory-live-badge ${error ? 'is-error' : ''}`}>
              <i /> Live Stream
            </span>
          </div>
          <p className="inventory-header-sub">
            Verified ledger of all inward receipts, POS sales, dispatches, and adjustments for <strong>{business.name}</strong>.
          </p>
        </div>

        <div className="inventory-header-actions">
          <button
            type="button"
            onClick={exportAudit}
            disabled={loading || !!error || !visible.length}
          >
            <AuditIcon name="export" /> Export CSV ({visible.length})
          </button>
          <button type="button" onClick={() => onNavigate?.('Adjustments')}>
            <AuditIcon name="adjust" /> Reconciliation
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => onNavigate?.('Stock In')}
          >
            + Inward Stock
          </button>
        </div>
      </header>

      {/* 2. Top Metric KPI 4 Cards */}
      <div className="modern-kpi-row">
        {/* KPI 1: Total Movements */}
        <div className="modern-kpi-card" tabIndex={0} role="region" aria-label="Total movements">
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Verified Transactions</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : stats.total}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 500 }}>
              Events in selected date range
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-blue" aria-hidden="true">
            <AuditIcon name="shield" />
          </div>
        </div>

        {/* KPI 2: Received */}
        <div
          className="modern-kpi-card"
          tabIndex={0}
          role="button"
          onClick={() => {
            setFilter('in')
            setPage(1)
          }}
          aria-label="Filter inward receipts"
        >
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Inward Received</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : stats.received.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--success)', fontWeight: 600 }}>
              + Inward receipts &amp; returns
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-green" aria-hidden="true">
            <AuditIcon name="inward" />
          </div>
        </div>

        {/* KPI 3: Dispatched */}
        <div
          className="modern-kpi-card"
          tabIndex={0}
          role="button"
          onClick={() => {
            setFilter('out')
            setPage(1)
          }}
          aria-label="Filter dispatches"
        >
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Outward Dispatched</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : stats.dispatched.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--danger)', fontWeight: 600 }}>
              − POS sales &amp; transfers
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-rose" aria-hidden="true">
            <AuditIcon name="outward" />
          </div>
        </div>

        {/* KPI 4: Movement Valuation */}
        <div className="modern-kpi-card" tabIndex={0} role="region" aria-label="Movement volume valuation">
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Volume Valuation</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : money(stats.valuation, 0)}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 500 }}>
              Combined transaction cost
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-purple" aria-hidden="true">
            <AuditIcon name="money" />
          </div>
        </div>
      </div>

      {/* 3. The Movement Audit Table (Dashboard invoice-style-panel) */}
      <section className="modern-panel-card invoice-style-panel">
        <div className="section-heading" style={{ marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
              <span
                className="inventory-heading-icon"
                aria-hidden="true"
                style={{
                  fontSize: '32px',
                  lineHeight: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                📜
              </span>
              <span>Movement Audit Ledger &amp; Event Stream</span>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="outline-button"
              type="button"
              onClick={() => setTableOpen(!tableOpen)}
            >
              {tableOpen ? 'Hide Table' : 'Show Table'}
            </button>
          </div>
        </div>

        {tableOpen && (
          <>
            {/* Controls Row: Search + Event Type + Date Range + Action */}
            <div className="invoice-controls-row">
              <div className="invoice-controls-left">
                <div className="invoice-search-wrap">
                  <input
                    ref={searchRef}
                    type="text"
                    className="invoice-search-input"
                    aria-label="Search audit events"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value)
                      setPage(1)
                    }}
                    placeholder="Search event, product, SKU, user, ref…"
                  />
                  <span className="invoice-search-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </span>
                </div>

                <select
                  className="invoice-select"
                  aria-label="Filter event type"
                  value={filter}
                  onChange={(event) => {
                    setFilter(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">All Events</option>
                  <option value="in">Stock In (Inward Receipts)</option>
                  <option value="out">Stock Out (POS Sales)</option>
                  <option value="flex">Adjustments &amp; Reconciliation</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label htmlFor="audit-from" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>
                    From:
                  </label>
                  <input
                    id="audit-from"
                    type="date"
                    className="invoice-select"
                    style={{ width: 'auto', padding: '0 8px' }}
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label htmlFor="audit-to" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>
                    To:
                  </label>
                  <input
                    id="audit-to"
                    type="date"
                    className="invoice-select"
                    style={{ width: 'auto', padding: '0 8px' }}
                    value={to}
                    onChange={(e) => {
                      setTo(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="invoice-primary-btn"
                onClick={exportAudit}
                disabled={!visible.length}
              >
                Export CSV
              </button>
            </div>

            {/* The Table */}
            <AsyncBoundary
              loading={loading}
              error={error}
              onRetry={refetch}
              isEmpty={!visible.length}
              emptyText={
                transactions.length
                  ? 'No movements match your search and date filters.'
                  : 'No transaction history recorded yet.'
              }
            >
              <div className="invoice-table-wrap">
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th style={{ width: '130px' }}>Date &amp; Time</th>
                      <th style={{ width: '120px' }}>Event Type</th>
                      <th>Product &amp; SKU</th>
                      <th>Quantity</th>
                      <th>Stock Shift</th>
                      <th>Reason / Note</th>
                      <th>Operator / Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => {
                      const meta = metaFor(item.type)
                      const product = productById.get(item.productId)
                      const when = new Date(item.createdAt)
                      const { label, detail, source } = describeEntry(item, meta)
                      const isIncrease = INCREASE_TYPES.has(item.type)
                      const isDecrease = DECREASE_TYPES.has(item.type)

                      const pillClass = isIncrease
                        ? 'pill-delivered'
                        : isDecrease
                        ? 'pill-out'
                        : 'pill-pending'

                      return (
                        <tr key={item._id || item.id || `${item.productId}-${item.createdAt}`}>
                          <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                            <strong style={{ display: 'block', color: 'var(--ink)' }}>
                              {when.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </strong>
                            <small style={{ color: 'var(--muted)', fontSize: '11px' }}>
                              {when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </small>
                          </td>
                          <td>
                            <span className={`invoice-pill ${pillClass}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="invoice-cell-name">
                            <span className="invoice-product-title">{product?.name || item.productId}</span>
                            <small className="invoice-product-sub">
                              {[item.variantSku || product?.sku, item.variantColor || product?.color, item.variantSize || product?.size]
                                .filter(Boolean)
                                .join(' · ')}
                            </small>
                          </td>
                          <td className="invoice-cell-cost">
                            <strong
                              style={{
                                color: isIncrease ? '#16a34a' : isDecrease ? '#dc2626' : 'var(--ink)',
                              }}
                            >
                              {isIncrease ? '+' : isDecrease ? '−' : ''}
                              {Math.abs(Number(item.quantity || 0))}
                            </strong>{' '}
                            <small style={{ color: 'var(--muted)' }}>
                              {product?.unit || 'units'}
                            </small>
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            <span style={{ color: 'var(--muted)' }}>{item.previousStock}</span>
                            {' → '}
                            <strong style={{ color: 'var(--ink)' }}>{item.newStock}</strong>
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{label}</span>
                            {detail && (
                              <small style={{ display: 'block', color: 'var(--muted)', fontSize: '11px' }}>
                                {detail}
                              </small>
                            )}
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'var(--surface-muted)', fontSize: '11px', fontWeight: 600, color: 'var(--muted)' }}>
                              {source}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <footer className="overview-pagination invoice-pagination">
                <span>
                  Showing {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, visible.length)} of {visible.length} entries
                </span>
                <div className="invoice-page-buttons">
                  <button
                    type="button"
                    className="invoice-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  <span className="invoice-page-num">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="invoice-page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </footer>
            </AsyncBoundary>
          </>
        )}
      </section>
    </div>
  )
}
