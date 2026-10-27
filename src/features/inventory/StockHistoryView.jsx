import { useEffect, useMemo, useRef, useState } from 'react'
import {
  PageHeader,
  Button,
  Badge,
  StatGrid,
  StatCard,
  Toolbar,
  DataTable,
  Select,
} from '../../components/ui/index.js'
import './InventoryOperations.css'

const INCREASE_TYPES = new Set(['stock_in', 'sales_return'])
const DECREASE_TYPES = new Set(['stock_out', 'purchase_return'])

const EVENT_META = {
  stock_in: { label: 'Stock In', tone: 'success', group: 'in' },
  sales_return: { label: 'Sales Return', tone: 'success', group: 'in' },
  stock_out: { label: 'Stock Out', tone: 'danger', group: 'out' },
  purchase_return: { label: 'Purchase Return', tone: 'danger', group: 'out' },
  adjustment: { label: 'Adjustment', tone: 'warning', group: 'flex' },
  non_sellable_return: { label: 'Damaged Return', tone: 'warning', group: 'flex' },
}

const metaFor = (type) =>
  EVENT_META[type] || {
    label: (type || 'movement').replace(/_/g, ' '),
    tone: 'neutral',
    group: 'flex',
  }

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
  const [pageSize, setPageSize] = useState(10)

  const searchRef = useRef(null)

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

    return {
      total: dateFiltered.length,
      received,
      dispatched,
      net: received - dispatched,
    }
  }, [dateFiltered])

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

  const columns = useMemo(() => {
    return [
      {
        key: 'timestamp',
        header: 'Timestamp',
        mobileLabel: 'Time',
        render: (item) => {
          const d = new Date(item.createdAt)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <strong style={{ fontSize: '12px' }}>{d.toLocaleDateString()}</strong>
              <small style={{ color: 'var(--text-soft)', fontSize: '11px' }}>
                {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </small>
            </div>
          )
        },
      },
      {
        key: 'type',
        header: 'Event Type',
        mobileLabel: 'Type',
        render: (item) => {
          const meta = metaFor(item.type)
          return <Badge tone={meta.tone}>{meta.label}</Badge>
        },
      },
      {
        key: 'product',
        header: 'Product',
        mobileLabel: 'Product',
        render: (item) => {
          const product = productById.get(item.productId)
          return (
            <div className="inventory-prod-cell">
              <span className="inventory-prod-avatar">
                {product?.name?.[0]?.toUpperCase() || 'P'}
              </span>
              <div className="inventory-prod-info">
                <span className="inventory-prod-name">{product?.name || item.productId}</span>
                <span className="inventory-prod-meta">{item.variantSku || product?.sku}</span>
              </div>
            </div>
          )
        },
      },
      {
        key: 'quantity',
        header: 'Quantity',
        mobileLabel: 'Quantity',
        render: (item) => {
          const meta = metaFor(item.type)
          const sign = meta.group === 'out' ? '-' : meta.group === 'in' ? '+' : '±'
          return (
            <strong
              style={{
                fontSize: '13px',
                color:
                  meta.group === 'in'
                    ? 'var(--success)'
                    : meta.group === 'out'
                    ? 'var(--danger)'
                    : 'var(--warning)',
              }}
            >
              {sign}
              {item.quantity}
            </strong>
          )
        },
      },
      {
        key: 'balance',
        header: 'Stock Delta',
        mobileLabel: 'Delta',
        render: (item) => (
          <div style={{ fontSize: '12px' }}>
            <span>{item.previousStock ?? '—'}</span>
            <span style={{ margin: '0 4px', color: 'var(--text-soft)' }}>→</span>
            <strong>{item.newStock ?? '—'}</strong>
          </div>
        ),
      },
      {
        key: 'reason',
        header: 'Reason & Source',
        mobileLabel: 'Reason',
        render: (item) => {
          const meta = metaFor(item.type)
          const { label, detail, source } = describeEntry(item, meta)
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '12px' }}>{label}</span>
              <small style={{ color: 'var(--text-soft)', fontSize: '11px' }}>
                {detail ? `${detail} · ` : ''}By {source}
              </small>
            </div>
          )
        },
      },
    ]
  }, [productById])

  return (
    <div className="inventory-page">
      <PageHeader
        kicker="Inventory"
        title="Stock Movement History & Audit Log"
        description={`Verified ledger of all inward receipts, POS sales, dispatches, and adjustments for ${business.name}`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={exportAudit}
              disabled={loading || !!error || !visible.length}
              icon="download"
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              onClick={() => onNavigate?.('Stock')}
              icon="eye"
            >
              View Stock Ledger
            </Button>
          </>
        }
      />

      {!loading && !error && (
        <StatGrid>
          <StatCard
            label="Transactions in Range"
            value={stats.total}
            helpText="Events matching selected dates"
            icon="clock"
            tone="blue"
          />
          <StatCard
            label="Total Units In"
            value={`+${stats.received.toLocaleString('en-IN')}`}
            helpText="Receipts & sales returns"
            icon="trending-up"
            tone="success"
          />
          <StatCard
            label="Total Units Out"
            value={`-${stats.dispatched.toLocaleString('en-IN')}`}
            helpText="POS sales & dispatches"
            icon="arrow"
            tone="danger"
          />
          <StatCard
            label="Net Inventory Delta"
            value={`${stats.net >= 0 ? '+' : ''}${stats.net.toLocaleString('en-IN')}`}
            helpText="Overall quantity change"
            icon="box"
            tone={stats.net >= 0 ? 'success' : 'warning'}
          />
        </StatGrid>
      )}

      <Toolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        placeholder="Search product, SKU, user, reason, receipt ID…"
        filters={
          <>
            <Select
              aria-label="Filter movement direction"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">All event types ({dateFiltered.length})</option>
              <option value="in">Inward (+ In, Returns)</option>
              <option value="out">Outward (- Out, POS)</option>
              <option value="flex">Adjustments / Variances</option>
            </Select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value)
                  setPage(1)
                }}
                style={{
                  height: 'var(--control-h)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--line)',
                  background: 'var(--surface-soft)',
                  color: 'var(--ink)',
                  padding: '0 10px',
                  fontSize: '12px',
                }}
                aria-label="From date"
              />
              <span style={{ color: 'var(--text-soft)', fontSize: '12px' }}>to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value)
                  setPage(1)
                }}
                style={{
                  height: 'var(--control-h)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--line)',
                  background: 'var(--surface-soft)',
                  color: 'var(--ink)',
                  padding: '0 10px',
                  fontSize: '12px',
                }}
                aria-label="To date"
              />
            </div>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={visible}
        keyField="id"
        page={page}
        pageSize={pageSize}
        total={visible.length}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize)
          setPage(1)
        }}
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyText={
          transactions.length
            ? 'No transactions found matching your criteria.'
            : 'No stock transactions recorded yet.'
        }
      />
    </div>
  )
}
