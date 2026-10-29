import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { purchaseOrderApi } from '../../api/purchaseOrderApi.js'
import { productApi } from '../../api/productApi.js'
import { supplierApi } from '../../api/supplierApi.js'
import { useResource } from '../../hooks/useResource.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Field, Input, Select, Textarea } from '../../components/ui/FormControls.jsx'
import { FormStatus } from '../../components/ui/Feedback.jsx'
import { Icon } from '../../components/ui/icons.jsx'
import './PurchaseOrdersPage.css'

let nextLineId = 1
const emptyLine = () => ({ _lineKey: 'line-' + (nextLineId++), productId: '', quantity: 1, purchasePrice: '', discount: 0, tax: 0 })

function PoLocalIcon({ name }) {
  const paths = {
    export: <><path d="M12 3v12m-4-4 4 4 4-4" /><path d="M5 17v3h14v-3" /></>,
    recur: <><path d="M4 12a8 8 0 0 1 13.7-5.7L20 8m0-4v4h-4M20 12a8 8 0 0 1-13.7 5.7L4 16m0 4v-4h4" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></>,
    truck: <><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.4 2.4 4.6-5" /></>,
    alert: <><path d="M12 4 2 20h20L12 4Z" /><path d="M12 10v5M12 18h.01" /></>,
    next: <path d="M5 12h13m-5-5 5 5-5 5" />,
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 16, height: 16 }}
    >
      {paths[name]}
    </svg>
  )
}

const TABS = [
  { id: 'all', label: 'All Orders', match: () => true },
  { id: 'drafts', label: 'Drafts', match: (o) => o.status === 'Draft' },
  { id: 'pending', label: 'Pending Approval', match: (o) => o.status === 'Pending' || o.status === 'Approved' },
  { id: 'transit', label: 'In Transit / Due', match: (o) => o.status === 'Ordered' || o.status === 'Partially Received' },
  { id: 'closed', label: 'Received & Closed', match: (o) => o.status === 'Received' || o.status === 'Cancelled' },
]


const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function PurchaseOrders({ business, onNavigate }) {
  const load = useCallback(
    () => Promise.all([purchaseOrderApi.list(), productApi.list(), supplierApi.list({ status: 'active' })]),
    [],
  )
  const { data, loading, error, setData } = useResource(load, [], [[], [], []])
  const [orders, products, suppliers] = data

  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [menu, setMenu] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [lineItems, setLineItems] = useState([emptyLine()])
  const [nowTs] = useState(() => Date.now())
  const searchRef = useRef(null)

  const currency = business?.currency || 'INR'
  const money = useCallback(
    (value, dp = 2) => {
      const amount = Number(value || 0)
      try {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency,
          minimumFractionDigits: dp,
          maximumFractionDigits: dp,
        }).format(amount)
      } catch {
        return `${currency} ${amount.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`
      }
    },
    [currency],
  )

  const supplierById = useMemo(() => new Map(suppliers.map((supplier) => [supplier.supplierId, supplier])), [suppliers])

  const setOrders = (updater) => setData((current) => [updater(current[0]), current[1], current[2]])
  const calculateItemTotal = (item) => {
    const base = Number(item.quantity || 0) * Number(item.purchasePrice || 0)
    return Math.max(0, base - Number(item.discount || 0) + Number(item.tax || 0))
  }

  const updateLineItem = (index, field, value) => {
    setLineItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
              ...(field === 'productId'
                ? { purchasePrice: products.find((product) => product.productId === value)?.purchasePrice ?? '' }
                : {}),
            }
          : item,
      ),
    )
  }

  const openForm = useCallback((order = null) => {
    setEditingOrder(order)
    setLineItems(
      order
        ? order.items.map((item) => ({
            _lineKey: item._id || ('line-' + (nextLineId++)),
            productId: item.productId,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            discount: item.discount,
            tax: item.tax,
          }))
        : [emptyLine()],
    )
    setFormOpen(true)
    setMessage(null)
    setMenu(null)
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    const form = event.currentTarget
    const formData = new FormData(form)
    if (!suppliers.length) {
      setMessage({ type: 'error', text: 'Add an active supplier before creating a purchase order.' })
      return
    }
    const validItems = lineItems.filter(
      (item) => item.productId && Number(item.quantity) > 0 && Number(item.purchasePrice) >= 0,
    )
    if (!validItems.length) {
      setMessage({ type: 'error', text: 'Add at least one product with a valid quantity and price.' })
      return
    }
    const payload = {
      supplierId: formData.get('supplierId'),
      expectedDeliveryDate: formData.get('expectedDeliveryDate'),
      shippingCharges: Number(formData.get('shippingCharges')) || 0,
      notes: (formData.get('notes') || '').trim(),
      items: validItems.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        purchasePrice: Number(item.purchasePrice),
        discount: Number(item.discount || 0),
        tax: Number(item.tax || 0),
      })),
    }
    setSaving(true)
    try {
      const saved =
        editingOrder && editingOrder.purchaseOrderId
          ? await purchaseOrderApi.update(editingOrder.purchaseOrderId, payload)
          : await purchaseOrderApi.create(payload)
      setOrders((list) =>
        editingOrder && editingOrder.purchaseOrderId
          ? list.map((item) => (item.purchaseOrderId === saved.purchaseOrderId ? saved : item))
          : [saved, ...list],
      )
      setFormOpen(false)
      setEditingOrder(null)
      setMessage({ type: 'success', text: `${saved.orderNumber} saved successfully.` })
      form.reset()
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not save the purchase order.' })
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (order, status) => {
    setMenu(null)
    try {
      const saved = await purchaseOrderApi.setStatus(order.purchaseOrderId, status)
      setOrders((list) => list.map((item) => (item.purchaseOrderId === saved.purchaseOrderId ? saved : item)))
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not update the order.' })
    }
  }

  const duplicateOrder = useCallback(
    (order) => {
      openForm({
        ...order,
        purchaseOrderId: null,
        orderNumber: null,
        status: 'Draft',
        paymentStatus: 'Unpaid',
      })
    },
    [openForm],
  )


  const stats = useMemo(() => {
    const today = startOfToday()
    const weekAgo = nowTs - 7 * 864e5
    const active = orders.filter((order) => order.status !== 'Cancelled')
    const awaiting = orders.filter((order) => ['Approved', 'Ordered', 'Partially Received'].includes(order.status))
    const overdue = awaiting.filter((order) => order.expectedDeliveryDate && new Date(order.expectedDeliveryDate) < today)
    const received = orders.filter((order) => order.status === 'Received')
    const onTime = received.filter(
      (order) =>
        !order.expectedDeliveryDate ||
        new Date(order.updatedAt) <= new Date(`${order.expectedDeliveryDate}T23:59:59`),
    )
    const avgLead = received.length
      ? received.reduce(
          (sum, order) => sum + Math.max(0, (new Date(order.updatedAt) - new Date(order.createdAt)) / 864e5),
          0,
        ) / received.length
      : 0
    const cycleMs = 30 * 864e5
    const thisCycle = active
      .filter((order) => nowTs - new Date(order.createdAt).getTime() <= cycleMs)
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
    const prevCycle = active
      .filter((order) => {
        const age = nowTs - new Date(order.createdAt).getTime()
        return age > cycleMs && age <= cycleMs * 2
      })
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)

    return {
      total: orders.length,
      newThisWeek: orders.filter((order) => new Date(order.createdAt).getTime() >= weekAgo).length,
      inTransit: orders.filter((order) => ['Ordered', 'Partially Received'].includes(order.status)).length,
      pendingApproval: orders.filter((order) => ['Draft', 'Pending'].includes(order.status)).length,
      delivered: received.length,
      committedValue: active.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
      supplierCount: new Set(active.map((order) => order.supplierId)).size,
      cycleDelta: prevCycle ? Math.round(((thisCycle - prevCycle) / prevCycle) * 100) : null,
      awaiting: awaiting.length,
      overdue: overdue.length,
      slaPct: received.length ? Math.round((onTime.length / received.length) * 100) : 100,
      avgLead,
    }
  }, [orders, nowTs])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matchTab = TABS.find((option) => option.id === tab)?.match || (() => true)
    return orders.filter((order) => {
      if (!matchTab(order)) return false
      if (supplierFilter !== 'all' && order.supplierId !== supplierFilter) return false
      if (paymentFilter !== 'all' && order.paymentStatus !== paymentFilter) return false

      if (
        query &&
        !`${order.orderNumber} ${order.supplierName} ${order.status} ${order.items.map((item) => item.productName).join(' ')}`
          .toLowerCase()
          .includes(query)
      )
        return false
      return true
    })
  }, [orders, tab, supplierFilter, paymentFilter, search])

  const resetTo = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  useEffect(() => {
    const handler = (event) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      } else if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        openForm()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openForm])

  useEffect(() => {
    if (!menu) return undefined
    const close = () => setMenu(null)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [menu])

  const etaInfo = (order) => {
    if (order.status === 'Received') return { text: 'Delivered', tone: 'green' }
    if (order.status === 'Cancelled') return { text: 'Cancelled', tone: 'dim' }
    const raw = order.expectedDeliveryDate
    if (!raw) return { text: 'No ETA set', tone: 'dim' }
    const target = new Date(`${raw}T00:00:00`)
    if (Number.isNaN(target.getTime())) return { text: 'No ETA set', tone: 'dim' }
    const diff = Math.round((target - startOfToday()) / 864e5)
    if (diff < 0) return { text: `Overdue ${Math.abs(diff)}d`, tone: 'rose' }
    if (diff === 0) return { text: 'ETA today', tone: 'amber' }
    if (diff === 1) return { text: 'ETA tomorrow', tone: 'amber' }
    return {
      text: `ETA ${target.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
      tone: 'muted',
    }
  }


  const exportCsv = () => {
    const escapeCell = (value) => {
      const text = String(value ?? '')
      const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text
      return `"${safe.replaceAll('"', '""')}"`
    }
    const rows = [
      ['PO Number', 'Supplier', 'Status', 'Payment', 'Ordered', 'ETA', 'SKUs', 'Units', 'Committed Value', 'GST'],
      ...filtered.map((order) => [
        order.orderNumber,
        order.supplierName,
        order.status,
        order.paymentStatus,
        new Date(order.createdAt).toLocaleDateString('en-GB'),
        order.expectedDeliveryDate || '',
        order.items.length,
        order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        order.totalAmount,
        order.items.reduce((sum, item) => sum + Number(item.tax || 0), 0),
      ]),
    ]
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `purchase-orders-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const columns = useMemo(
    () => [
      {
        key: 'orderNumber',
        header: 'Id',
        priority: 'high',
        render: (order) => (
          <span className="ledger-cell-id">
            #{order.orderNumber}
          </span>
        ),
      },
      {
        key: 'supplierName',
        header: 'Supplier',
        priority: 'high',
        render: (order) => {
          const supplier = supplierById.get(order.supplierId)
          return (
            <div>
              <div className="ledger-cell-primary">{order.supplierName}</div>
              <div className="ledger-cell-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>
                {[supplier?.contactPerson, supplier?.phone].filter(Boolean).join(' · ') || 'Vendor'}
              </div>
            </div>
          )
        },
      },
      {
        key: 'timeline',
        header: 'Date & ETA',
        priority: 'medium',
        render: (order) => {
          const eta = etaInfo(order)
          return (
            <div>
              <div className="ledger-cell-secondary">
                {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div className="ledger-cell-secondary" style={{ fontSize: '11px', marginTop: '2px', color: eta.tone === 'rose' ? '#ef4444' : '#0084ff', fontWeight: 600 }}>
                {eta.text}
              </div>
            </div>
          )
        },
      },
      {
        key: 'items',
        header: 'Items',
        priority: 'medium',
        render: (order) => {
          const units = order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
          return (
            <span className="ledger-cell-secondary">
              {order.items.length} items ({units} units)
            </span>
          )
        },
      },
      {
        key: 'totalAmount',
        header: 'Total Cost',
        align: 'right',
        priority: 'high',
        render: (order) => (
          <div style={{ textAlign: 'right' }}>
            <span className="ledger-cell-cost">{money(order.totalAmount)}</span>
            {order.paymentStatus !== 'Paid' && (
              <div className="ledger-cell-secondary" style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px' }}>
                {order.paymentStatus || 'Unpaid'}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        priority: 'high',
        align: 'center',
        render: (order) => {
          let pillClass = 'status-pending'
          let label = order.status || 'Pending'
          if (order.status === 'Received') {
            pillClass = 'status-delivered'
            label = 'Delivered'
          } else if (order.status === 'Ordered' || order.status === 'Partially Received') {
            pillClass = 'status-shipped'
            label = 'Shipped'
          } else if (order.status === 'Cancelled') {
            pillClass = 'status-danger'
            label = 'Cancelled'
          } else {
            pillClass = 'status-pending'
            label = 'Pending'
          }
          return <span className={`ledger-status-pill ${pillClass}`}>{label}</span>
        },
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        priority: 'high',
        render: (order) => (
          <div className="ledger-actions-group" onClick={(e) => e.stopPropagation()}>
            {order.status !== 'Received' && order.status !== 'Cancelled' && (
              <button
                type="button"
                className="ledger-action-icon action-edit"
                onClick={() => openForm(order)}
                title="Edit Order"
                aria-label="Edit Order"
              >
                <Icon name="edit" size={17} />
              </button>
            )}
            <button
              type="button"
              className="ledger-action-icon action-view"
              onClick={() => (setViewingOrder ? setViewingOrder(order) : openForm(order))}
              title="View PO Details"
              aria-label="View PO Details"
            >
              <Icon name="eye" size={17} />
            </button>
            {order.status !== 'Received' && order.status !== 'Cancelled' && (
              <button
                type="button"
                className="ledger-action-icon action-delete"
                onClick={() => updateStatus(order, 'Cancelled')}
                title="Cancel PO"
                aria-label="Cancel PO"
              >
                <Icon name="close" size={17} />
              </button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supplierById, money],
  )


  return (
    <section className="po-page" aria-labelledby="po-title">
      <PageHeader
        kicker="Manage your purchase orders • Procurement & receiving"
        title="Purchase Orders"
        subtitle={
          <span>
            Track vendor commitments, lead times, inward shipments, and invoice settlements for{' '}
            <strong>{business?.name}</strong>.
          </span>
        }
        actions={
          <>
            <Button
              variant="secondary"
              icon={<PoLocalIcon name="export" />}
              onClick={exportCsv}
              disabled={loading || !!error || !orders.length}
            >
              Export POs (CSV)
            </Button>
            <Button
              variant="secondary"
              icon={<PoLocalIcon name="recur" />}
              onClick={() => (orders.length ? duplicateOrder(orders[0]) : openForm())}
            >
              Generate Recurring PO
            </Button>
            <Button variant="primary" icon={<PoLocalIcon name="plus" />} onClick={() => openForm()}>
              Create Purchase Order
            </Button>
          </>
        }
      />

      {message && <FormStatus status={message.type} message={message.text} />}

      <div className="po-flow" aria-label="How buying works">
        <p className="po-flow-title">How goods get from a supplier onto your shelves</p>
        <ol className="po-flow-steps">
          {[
            { label: 'Suppliers', blurb: 'The vendors you buy from.', nav: 'Suppliers' },
            { label: 'Purchase Order', blurb: 'You list what you want and agree a price.', nav: null },
            { label: 'Receiving', blurb: 'The delivery arrives — you count and check it.', nav: 'Receiving' },
            { label: 'Stock', blurb: 'Checked goods are added to inventory automatically.', nav: 'Stock' },
            { label: 'Sell', blurb: 'Items leave through POS or customer orders.', nav: 'POS / Billing' },
          ].map((step, index, all) => (
            <li key={step.label} className={step.nav ? 'link' : 'current'}>
              <button
                type="button"
                disabled={!step.nav}
                onClick={() => step.nav && onNavigate?.(step.nav)}
              >
                <span className="po-flow-index">{index + 1}</span>
                <strong>{step.label}{step.nav ? '' : ' · you are here'}</strong>
                <small>{step.blurb}</small>
              </button>
              {index < all.length - 1 && (
                <span className="po-flow-arrow" aria-hidden="true">
                  <PoLocalIcon name="next" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* 4 Pastel KPI Summary Cards */}
      <div className="ledger-kpi-grid">
        <div
          className={`ledger-kpi-card theme-blue ${tab === 'all' ? 'is-active' : ''}`}
          onClick={() => resetTo(setTab)('all')}
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="list" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Total</span>
            <span className="ledger-kpi-val">{stats.total} Invoices</span>
          </div>
        </div>

        <div
          className={`ledger-kpi-card theme-slate ${tab === 'transit' ? 'is-active' : ''}`}
          onClick={() => resetTo(setTab)('transit')}
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="truck" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Shipped</span>
            <span className="ledger-kpi-val">{stats.inTransit} Invoices</span>
          </div>
        </div>

        <div
          className={`ledger-kpi-card theme-green ${tab === 'closed' ? 'is-active' : ''}`}
          onClick={() => resetTo(setTab)('closed')}
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="dollar" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Delivered</span>
            <span className="ledger-kpi-val">{money(stats.committedValue)}</span>
          </div>
        </div>

        <div
          className={`ledger-kpi-card theme-amber ${tab === 'pending' ? 'is-active' : ''}`}
          onClick={() => resetTo(setTab)('pending')}
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="pending" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Pending</span>
            <span className="ledger-kpi-val">{stats.pendingApproval + stats.awaiting} Invoices</span>
          </div>
        </div>
      </div>

      {/* Pill Search & Action Toolbar */}
      <div className="ledger-toolbar">
        <div className="ledger-toolbar-left">
          <div className="ledger-search-box">
            <input
              ref={searchRef}
              type="text"
              className="ledger-search-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => resetTo(setSearch)(e.target.value)}
            />
            <span className="ledger-search-icon">
              <Icon name="search" size={17} />
            </span>
          </div>

          <select
            className="ledger-pill-select"
            value={supplierFilter}
            onChange={(e) => resetTo(setSupplierFilter)(e.target.value)}
          >
            <option value="all">All Suppliers ({suppliers.length})</option>
            {suppliers.map((s) => (
              <option key={s.supplierId} value={s.supplierId}>
                {s.supplierName}
              </option>
            ))}
          </select>

          <select
            className="ledger-pill-select"
            value={paymentFilter}
            onChange={(e) => resetTo(setPaymentFilter)(e.target.value)}
          >
            <option value="all">All Payment Statuses</option>
            {['Unpaid', 'Partially Paid', 'Paid'].map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="ledger-toolbar-right">
          <button
            type="button"
            className="ledger-btn-secondary"
            onClick={exportCsv}
            disabled={loading || !!error || !orders.length}
          >
            <Icon name="download" size={15} />
            <span>Export</span>
          </button>
          <button
            type="button"
            className="ledger-btn-primary"
            onClick={() => openForm()}
          >
            <Icon name="plus" size={16} />
            <span>+ New Order</span>
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={loading}
        pagination={{
          page,
          pageSize,
          total: filtered.length,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size)
            setPage(1)
          },
        }}
        emptyState={{
          title: 'No purchase orders found',
          description: orders.length
            ? 'No purchase orders match the selected filters.'
            : 'No purchase orders yet. Create one to start tracking vendor commitments.',
        }}
      />

      {/* Action Menu Popover */}
      {menu && (
        <>
          <div className="po-menu-backdrop" role="presentation" onClick={() => setMenu(null)} />
          <div
            className="po-menu"
            role="menu"
            style={{ top: menu.y, left: menu.x, transform: 'translateX(-100%)' }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setViewingOrder(menu.order)
                setMenu(null)
              }}
            >
              View details
            </button>
            <button type="button" role="menuitem" onClick={() => openForm(menu.order)}>
              Edit order
            </button>
            <button type="button" role="menuitem" onClick={() => duplicateOrder(menu.order)}>
              Duplicate
            </button>
            {!['Received', 'Cancelled'].includes(menu.order.status) && (
              <button
                type="button"
                role="menuitem"
                className="danger"
                onClick={() => updateStatus(menu.order, 'Cancelled')}
              >
                Cancel order
              </button>
            )}
          </div>
        </>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingOrder?.purchaseOrderId ? `Edit ${editingOrder.orderNumber}` : 'Create Purchase Order'}
        subtitle="Specify vendor, delivery requirements, and line items"
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="purchase-order-fields">
            <Field label="Supplier" required>
              <Select id="po-supplier" name="supplierId" defaultValue={editingOrder?.supplierId || ''} required>
                <option value="" disabled>
                  Select supplier
                </option>
                {suppliers.map((supplier) => (
                  <option key={supplier.supplierId} value={supplier.supplierId}>
                    {supplier.supplierName}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Expected Delivery">
              <Input
                id="po-delivery"
                name="expectedDeliveryDate"
                type="date"
                defaultValue={editingOrder?.expectedDeliveryDate || ''}
              />
            </Field>

            <Field label="Shipping / Charges">
              <Input
                id="po-shipping"
                name="shippingCharges"
                type="number"
                min="0"
                step="0.01"
                defaultValue={editingOrder?.shippingCharges || 0}
              />
            </Field>
          </div>

          <div className="order-items-heading">
            <h4>Order items</h4>
            <Button
              size="sm"
              variant="secondary"
              icon={<Icon name="plus" />}
              onClick={() => setLineItems([...lineItems, emptyLine()])}
            >
              Add Item
            </Button>
          </div>

          <div className="order-items">
            {lineItems.map((item, index) => (
              <div className="order-item-row" key={item._lineKey || item.productId}>
                <Select
                  aria-label="Select product"
                  value={item.productId}
                  onChange={(event) => updateLineItem(index, 'productId', event.target.value)}
                  required
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </Select>
                <Input
                  aria-label="Quantity"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => updateLineItem(index, 'quantity', event.target.value)}
                  placeholder="Qty"
                  required
                />
                <Input
                  aria-label="Purchase price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.purchasePrice}
                  onChange={(event) => updateLineItem(index, 'purchasePrice', event.target.value)}
                  placeholder="Price"
                  required
                />
                <Input
                  aria-label="Discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.discount}
                  onChange={(event) => updateLineItem(index, 'discount', event.target.value)}
                  placeholder="Discount"
                />
                <Input
                  aria-label="Tax"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.tax}
                  onChange={(event) => updateLineItem(index, 'tax', event.target.value)}
                  placeholder="Tax"
                />
                <strong>{money(calculateItemTotal(item))}</strong>
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    className="remove-item"
                    onClick={() => setLineItems(lineItems.filter((_, itemIndex) => itemIndex !== index))}
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <Field label="Notes">
            <Textarea
              id="po-notes"
              name="notes"
              defaultValue={editingOrder?.notes || ''}
              placeholder="Delivery or order notes"
              rows={3}
            />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              {saving ? 'Saving…' : 'Save Order'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        title={viewingOrder?.orderNumber || 'Purchase Order'}
        subtitle="Order details and item summary"
        size="md"
      >
        {viewingOrder && (
          <div>
            <div className="po-detail-grid">
              <div>
                <small>Supplier</small>
                <strong>{viewingOrder.supplierName}</strong>
              </div>
              <div>
                <small>Status</small>
                <strong>
                  {viewingOrder.status} · {viewingOrder.paymentStatus}
                </strong>
              </div>
              <div>
                <small>Expected delivery</small>
                <strong>{viewingOrder.expectedDeliveryDate || 'Not set'}</strong>
              </div>
              <div>
                <small>Total</small>
                <strong>{money(viewingOrder.totalAmount)}</strong>
              </div>
            </div>
            <div className="po-detail-items">
              {viewingOrder.items.map((item) => (
                <div key={item._id || item.productId || item.productName}>
                  <span>
                    {item.productName} × {item.quantity}
                  </span>
                  <strong>{money(item.total || (item.quantity * item.purchasePrice))}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

export default PurchaseOrders
