import { useCallback, useMemo, useState } from 'react'
import { supplierApi } from '../../api/supplierApi.js'
import { purchaseOrderApi } from '../../api/purchaseOrderApi.js'
import { paymentApi } from '../../api/paymentApi.js'
import { productApi } from '../../api/productApi.js'
import { useResource } from '../../hooks/useResource.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Field, Input, Select, Textarea } from '../../components/ui/FormControls.jsx'
import { FormStatus } from '../../components/ui/Feedback.jsx'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx'
import { Icon } from '../../components/ui/icons.jsx'
import './SuppliersPage.css'

const PHONE_PATTERN = /^[+\d][\d\s()-]{6,}$/
const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function SupLocalIcon({ name }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    export: <><path d="M12 3v12m-4-4 4 4 4-4" /><path d="M5 17v3h14v-3" /></>,
    reconcile: <><path d="M4 7h16M4 7l3-3M4 7l3 3M20 17H4m16 0-3-3m3 3-3 3" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    refresh: <><path d="M4 12a8 8 0 0 1 13.7-5.7L20 8m0-4v4h-4M20 12a8 8 0 0 1-13.7 5.7L4 16m0 4v-4h4" /></>,
    vendor: <><path d="M4 21V9l8-5 8 5v12M4 21h16M9 21v-6h6v6" /></>,
    coin: <><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
    clipboard: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1M9 11h6M9 15h4" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3Z" /><path d="m9.3 12 2 2 3.4-4.2" /></>,
    pin: <><path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
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

const topKey = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

function Suppliers({ business, onNavigate, canNavigate }) {
  const load = useCallback(
    () =>
      Promise.all([
        supplierApi.list(),
        purchaseOrderApi.list(),
        paymentApi.list({ type: 'purchase' }),
        productApi.list(),
      ]),
    [],
  )
  const { data, loading, error, setData } = useResource(load, [], [[], [], [], []])
  const [suppliers, purchaseOrders, payments, products] = data

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [viewingSupplier, setViewingSupplier] = useState(null)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [nowTs] = useState(() => Date.now())

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

  const updateSuppliers = (updater) =>
    setData((current) => [updater(current[0]), current[1], current[2], current[3]])

  const categoryByProduct = useMemo(
    () => new Map(products.map((product) => [product.productId, product.category])),
    [products],
  )

  const meta = useMemo(() => {
    const today = startOfToday()
    const map = new Map()
    for (const supplier of suppliers) {
      const orders = purchaseOrders.filter((order) => order.supplierId === supplier.supplierId)
      const orderIds = new Set(orders.map((order) => order.purchaseOrderId))
      const total = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
      const paid = payments
        .filter((payment) => orderIds.has(payment.referenceId))
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
      const outstanding = Math.max(0, total - paid)
      const catCount = {}
      for (const order of orders) {
        for (const item of order.items || []) {
          const category = categoryByProduct.get(item.productId)
          if (category) catCount[category] = (catCount[category] || 0) + 1
        }
      }
      const category = topKey(catCount)
      const overdueOrder = orders.find(
        (order) =>
          order.paymentStatus !== 'Paid' &&
          order.expectedDeliveryDate &&
          new Date(order.expectedDeliveryDate) < today,
      )
      const overdueDays = overdueOrder
        ? Math.round((today - new Date(`${overdueOrder.expectedDeliveryDate}T00:00:00`)) / 864e5)
        : 0
      let payLabel = 'Pending'
      let payTone = 'warning'
      if (total === 0) {
        payLabel = 'No orders'
        payTone = 'neutral'
      } else if (outstanding <= 0) {
        payLabel = 'Settled'
        payTone = 'success'
      } else if (overdueDays > 0) {
        payLabel = `Overdue (${overdueDays}d)`
        payTone = 'danger'
      }
      map.set(supplier.supplierId, {
        orders: orders.length,
        total,
        paid,
        outstanding,
        category,
        payLabel,
        payTone,
        status: outstanding <= 0 && total > 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Pending',
      })
    }
    return map
  }, [suppliers, purchaseOrders, payments, categoryByProduct])

  const categories = useMemo(
    () => [...new Set([...meta.values()].map((entry) => entry.category).filter(Boolean))].sort(),
    [meta],
  )

  const stats = useMemo(() => {
    const monthAgo = nowTs - 30 * 864e5
    const active = suppliers.filter((supplier) => supplier.status === 'active')
    const newCount = suppliers.filter(
      (supplier) => new Date(supplier.createdAt).getTime() >= monthAgo,
    ).length
    const withGst = suppliers.filter((supplier) => supplier.taxNumber).length
    const outstanding = [...meta.values()].reduce((sum, entry) => sum + entry.outstanding, 0)
    const dueAccounts = active.filter(
      (supplier) => (meta.get(supplier.supplierId)?.outstanding || 0) > 0,
    ).length
    const year = new Date(nowTs).getFullYear()
    const receivedThisYear = purchaseOrders.filter(
      (order) => order.status === 'Received' && new Date(order.createdAt).getFullYear() === year,
    )
    const fulfilDays = receivedThisYear.length
      ? receivedThisYear.reduce(
          (sum, order) => sum + Math.max(0, (new Date(order.updatedAt) - new Date(order.createdAt)) / 864e5),
          0,
        ) / receivedThisYear.length
      : 0
    const onTime = receivedThisYear.filter(
      (order) =>
        !order.expectedDeliveryDate ||
        new Date(order.updatedAt) <= new Date(`${order.expectedDeliveryDate}T23:59:59`),
    )
    const slaPct = receivedThisYear.length ? (onTime.length / receivedThisYear.length) * 100 : 100

    return {
      total: suppliers.length,
      active: active.length,
      newCount,
      gstPct: suppliers.length ? Math.round((withGst / suppliers.length) * 100) : 0,
      outstanding,
      dueAccounts,
      completedPos: receivedThisYear.length,
      fulfilDays,
      slaPct,
      lateThisYear: receivedThisYear.length - onTime.length,
    }
  }, [suppliers, purchaseOrders, meta, nowTs])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return suppliers.filter((supplier) => {
      if (statusFilter !== 'all' && supplier.status !== statusFilter) return false
      if (categoryFilter !== 'all' && meta.get(supplier.supplierId)?.category !== categoryFilter)
        return false
      return `${supplier.supplierName} ${supplier.contactPerson} ${supplier.email} ${supplier.city} ${supplier.taxNumber} ${supplier.phone}`
        .toLowerCase()
        .includes(query)
    })
  }, [suppliers, statusFilter, categoryFilter, search, meta])

  const withReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    const form = event.currentTarget
    const formData = new FormData(form)
    const supplier = {
      supplierName: (formData.get('supplierName') || '').trim(),
      contactPerson: (formData.get('contactPerson') || '').trim(),
      phone: (formData.get('phone') || '').trim(),
      email: (formData.get('email') || '').trim().toLowerCase(),
      address: (formData.get('address') || '').trim(),
      city: (formData.get('city') || '').trim(),
      state: (formData.get('state') || '').trim(),
      taxNumber: (formData.get('taxNumber') || '').trim(),
      paymentTerms: formData.get('paymentTerms'),
      notes: (formData.get('notes') || '').trim(),
    }
    if (!supplier.supplierName) {
      setMessage({ type: 'error', text: 'Supplier name is required.' })
      return
    }
    if (!PHONE_PATTERN.test(supplier.phone)) {
      setMessage({ type: 'error', text: 'Enter a valid supplier phone number.' })
      return
    }
    if (supplier.email && !/^\S+@\S+\.\S+$/.test(supplier.email)) {
      setMessage({ type: 'error', text: 'Enter a valid supplier email address.' })
      return
    }

    setSaving(true)
    try {
      const saved = editingSupplier
        ? await supplierApi.update(editingSupplier.supplierId, supplier)
        : await supplierApi.create(supplier)
      updateSuppliers((list) =>
        editingSupplier
          ? list.map((item) => (item.supplierId === saved.supplierId ? saved : item))
          : [saved, ...list],
      )
      setFormOpen(false)
      setEditingSupplier(null)
      setMessage({ type: 'success', text: editingSupplier ? 'Supplier updated.' : 'Supplier added.' })
      form.reset()
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not save the supplier.' })
    } finally {
      setSaving(false)
    }
  }

  const archiveSupplier = (supplier) => {
    setArchiveTarget(supplier)
  }

  const handleConfirmArchive = async () => {
    const supplier = archiveTarget
    setArchiveTarget(null)
    if (!supplier) return
    try {
      const saved = await supplierApi.archive(supplier.supplierId)
      updateSuppliers((list) =>
        list.map((item) => (item.supplierId === saved.supplierId ? saved : item)),
      )
      setMessage({ type: 'success', text: `${supplier.supplierName} was archived.` })
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not archive the supplier.' })
    }
  }

  const openForm = (supplier = null) => {
    setEditingSupplier(supplier)
    setFormOpen(true)
    setMessage(null)
  }

  const exportCsv = () => {
    const escapeCell = (value) => {
      const text = String(value ?? '')
      const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text
      return `"${safe.replaceAll('"', '""')}"`
    }
    const rows = [
      [
        'Supplier',
        'Category',
        'Contact',
        'Phone',
        'Email',
        'City',
        'GST / Tax',
        'Payment Terms',
        'Status',
        'Total Purchased',
        'Outstanding',
      ],
      ...filtered.map((supplier) => {
        const entry = meta.get(supplier.supplierId) || {}
        return [
          supplier.supplierName,
          entry.category || '',
          supplier.contactPerson,
          supplier.phone,
          supplier.email,
          supplier.city,
          supplier.taxNumber,
          supplier.paymentTerms,
          supplier.status,
          entry.total || 0,
          entry.outstanding || 0,
        ]
      }),
    ]
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `suppliers-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const FLOW = [
    { label: 'Suppliers', blurb: 'The vendors you buy from.', nav: null },
    { label: 'Purchase Order', blurb: 'List what you want, agree a price.', nav: 'Purchase Orders' },
    { label: 'Receiving', blurb: 'Delivery arrives — you count and check it.', nav: 'Receiving' },
    { label: 'Stock', blurb: 'Checked goods are added to inventory.', nav: 'Stock' },
    { label: 'Sell', blurb: 'Items leave via POS or customer orders.', nav: 'POS / Billing' },
  ]

  const columns = useMemo(
    () => [
      {
        key: 'supplierId',
        header: 'Id',
        priority: 'high',
        render: (supplier) => (
          <span className="ledger-cell-id">
            #{String(supplier.supplierId || '').slice(-6).toUpperCase() || 'SUP'}
          </span>
        ),
      },
      {
        key: 'supplierName',
        header: 'Supplier',
        priority: 'high',
        render: (supplier) => {
          const entry = meta.get(supplier.supplierId) || {}
          return (
            <div>
              <div className="ledger-cell-primary">
                {supplier.supplierName}
                {entry.category && <span className="ord-b2b" style={{ marginLeft: '6px', fontSize: '10px' }}>{entry.category}</span>}
              </div>
              <div className="ledger-cell-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>
                {[supplier.city, supplier.state].filter(Boolean).join(', ') || 'Local'}
              </div>
            </div>
          )
        },
      },
      {
        key: 'contact',
        header: 'Contact Person',
        priority: 'medium',
        render: (supplier) => (
          <div>
            <div className="ledger-cell-primary">{supplier.contactPerson || 'Vendor'}</div>
            <div className="ledger-cell-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>
              {supplier.phone} {supplier.email ? `· ${supplier.email}` : ''}
            </div>
          </div>
        ),
      },
      {
        key: 'payment',
        header: 'Total Cost / Outstanding',
        align: 'right',
        priority: 'high',
        render: (supplier) => {
          const entry = meta.get(supplier.supplierId) || { total: 0, outstanding: 0, orders: 0 }
          return (
            <div style={{ textAlign: 'right' }}>
              <span className="ledger-cell-cost">{money(entry.total)}</span>
              {entry.outstanding > 0 ? (
                <div className="ledger-cell-secondary" style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px' }}>
                  Due: {money(entry.outstanding)}
                </div>
              ) : (
                <div className="ledger-cell-secondary" style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>
                  Settled
                </div>
              )}
            </div>
          )
        },
      },
      {
        key: 'status',
        header: 'Status',
        priority: 'high',
        align: 'center',
        render: (supplier) => {
          const entry = meta.get(supplier.supplierId) || {}
          let pillClass = 'status-delivered'
          let label = 'Active'
          if (supplier.status === 'archived') {
            pillClass = 'status-danger'
            label = 'Archived'
          } else if (entry.outstanding > 0) {
            pillClass = 'status-pending'
            label = `Due: ${money(entry.outstanding)}`
          }
          return <span className={`ledger-status-pill ${pillClass}`}>{label}</span>
        },
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        priority: 'high',
        render: (supplier) => (
          <div className="ledger-actions-group" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="ledger-action-icon action-edit"
              onClick={() => openForm(supplier)}
              title="Edit Supplier"
              aria-label="Edit Supplier"
            >
              <Icon name="edit" size={17} />
            </button>
            <button
              type="button"
              className="ledger-action-icon action-view"
              onClick={() => setViewingSupplier(supplier)}
              title="View Supplier"
              aria-label="View Supplier"
            >
              <Icon name="eye" size={17} />
            </button>
            {supplier.status === 'active' && (
              <button
                type="button"
                className="ledger-action-icon action-delete"
                onClick={() => archiveSupplier(supplier)}
                title="Archive Supplier"
                aria-label="Archive Supplier"
              >
                <Icon name="trash" size={17} />
              </button>
            )}
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meta, money],
  )

  return (
    <section className="sup-page" aria-labelledby="sup-title">
      <PageHeader
        kicker={`Manage your suppliers • ${business?.name || 'Workspace'} vendor ledger`}
        title="Suppliers"
        badge={`${stats.active} active vendors`}
        subtitle="Directory of every vendor you buy from — their contact details, agreed payment terms, and current credit balances."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<SupLocalIcon name="export" />}
              onClick={exportCsv}
              disabled={loading || !!error || !suppliers.length}
            >
              Export CSV
            </Button>
            <Button
              variant="secondary"
              icon={<SupLocalIcon name="reconcile" />}
              onClick={() => (canNavigate?.('Payments') !== false ? onNavigate?.('Payments') : null)}
            >
              Reconciliation
            </Button>
            <Button variant="primary" icon={<SupLocalIcon name="plus" />} onClick={() => openForm()}>
              Add Supplier
            </Button>
          </>
        }
      />

      {message && <FormStatus status={message.type} message={message.text} />}

      <details className="sup-flow">
        <summary>
          <span className="sup-flow-caret" aria-hidden="true" /> How goods get from a supplier onto your
          shelves — <b>Suppliers → PO → Receiving → Stock → Sell</b>
        </summary>
        <ol className="sup-flow-steps">
          {FLOW.map((step, index, all) => (
            <li key={step.label} className={step.nav ? 'link' : 'current'}>
              <button
                type="button"
                disabled={!step.nav}
                onClick={() => step.nav && onNavigate?.(step.nav)}
              >
                <span className="sup-flow-index">{index + 1}</span>
                <strong>{step.label}{step.nav ? '' : ' · you are here'}</strong>
                <small>{step.blurb}</small>
              </button>
              {index < all.length - 1 && (
                <span className="sup-flow-arrow" aria-hidden="true">
                  <SupLocalIcon name="next" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </details>

      {/* 4 Pastel KPI Summary Cards */}
      <div className="ledger-kpi-grid">
        <div
          className={`ledger-kpi-card theme-blue ${statusFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => withReset(setStatusFilter)('all')}
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="users" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Total</span>
            <span className="ledger-kpi-val">{stats.total} Invoices</span>
          </div>
        </div>

        <div
          className={`ledger-kpi-card theme-slate ${statusFilter === 'active' ? 'is-active' : ''}`}
          onClick={() => withReset(setStatusFilter)('active')}
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="user-check" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Shipped</span>
            <span className="ledger-kpi-val">{stats.active} Vendors</span>
          </div>
        </div>

        <div
          className="ledger-kpi-card theme-green"
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="check" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Delivered</span>
            <span className="ledger-kpi-val">{stats.completedPos} Orders</span>
          </div>
        </div>

        <div
          className={`ledger-kpi-card theme-amber ${stats.dueAccounts > 0 ? 'is-active' : ''}`}
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="pending" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Pending</span>
            <span className="ledger-kpi-val">{money(stats.outstanding)}</span>
          </div>
        </div>
      </div>

      {/* Pill Search & Action Toolbar */}
      <div className="ledger-toolbar">
        <div className="ledger-toolbar-left">
          <div className="ledger-search-box">
            <input
              type="text"
              className="ledger-search-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => withReset(setSearch)(e.target.value)}
            />
            <span className="ledger-search-icon">
              <Icon name="search" size={17} />
            </span>
          </div>

          <select
            className="ledger-pill-select"
            value={statusFilter}
            onChange={(e) => withReset(setStatusFilter)(e.target.value)}
          >
            <option value="active">Active Suppliers</option>
            <option value="archived">Archived Suppliers</option>
            <option value="all">All Suppliers</option>
          </select>

          <select
            className="ledger-pill-select"
            value={categoryFilter}
            onChange={(e) => withReset(setCategoryFilter)(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="ledger-toolbar-right">
          <button
            type="button"
            className="ledger-btn-secondary"
            onClick={exportCsv}
            disabled={loading || !!error || !suppliers.length}
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
            <span>+ New Supplier</span>
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
          title: 'No suppliers found',
          description: suppliers.length
            ? 'No suppliers match your active filter.'
            : 'No suppliers yet. Add your first supplier to start raising purchase orders.',
        }}
      />

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingSupplier ? `Edit ${editingSupplier.supplierName}` : 'Add a Supplier'}
        subtitle="Manage vendor contact info and payment terms"
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="supplier-form-grid">
            <Field label="Supplier Name" required>
              <Input
                id="supplier-name"
                name="supplierName"
                defaultValue={editingSupplier?.supplierName || ''}
                placeholder="e.g. Sharma Wholesale"
                required
              />
            </Field>

            <Field label="Contact Person">
              <Input
                id="supplier-contact"
                name="contactPerson"
                defaultValue={editingSupplier?.contactPerson || ''}
                placeholder="Contact name"
              />
            </Field>

            <Field label="Phone" required>
              <Input
                id="supplier-phone"
                name="phone"
                type="tel"
                defaultValue={editingSupplier?.phone || ''}
                placeholder="+91 98765 43210"
                required
              />
            </Field>

            <Field label="Email">
              <Input
                id="supplier-email"
                name="email"
                type="email"
                defaultValue={editingSupplier?.email || ''}
                placeholder="supplier@example.com"
              />
            </Field>

            <div className="field-wide">
              <Field label="Address">
                <Input
                  id="supplier-address"
                  name="address"
                  defaultValue={editingSupplier?.address || ''}
                  placeholder="Street and building name"
                />
              </Field>
            </div>

            <Field label="City">
              <Input
                id="supplier-city"
                name="city"
                defaultValue={editingSupplier?.city || ''}
                placeholder="City"
              />
            </Field>

            <Field label="State">
              <Input
                id="supplier-state"
                name="state"
                defaultValue={editingSupplier?.state || ''}
                placeholder="State"
              />
            </Field>

            <Field label="GST / Tax Number">
              <Input
                id="supplier-tax"
                name="taxNumber"
                defaultValue={editingSupplier?.taxNumber || ''}
                placeholder="GSTIN or tax ID"
              />
            </Field>

            <Field label="Payment Terms">
              <Select
                id="supplier-terms"
                name="paymentTerms"
                defaultValue={editingSupplier?.paymentTerms || 'Due on receipt'}
              >
                <option>Due on receipt</option>
                <option>Net 7</option>
                <option>Net 15</option>
                <option>Net 30</option>
                <option>Net 60</option>
              </Select>
            </Field>

            <div className="field-wide">
              <Field label="Notes">
                <Textarea
                  id="supplier-notes"
                  name="notes"
                  defaultValue={editingSupplier?.notes || ''}
                  placeholder="Add notes about this supplier"
                  rows={2}
                />
              </Field>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              {saving ? 'Saving…' : 'Save Supplier'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Supplier Details Modal */}
      <Modal
        isOpen={!!viewingSupplier}
        onClose={() => setViewingSupplier(null)}
        title={viewingSupplier?.supplierName || 'Supplier Profile'}
        subtitle="Full vendor record and account overview"
        size="md"
      >
        {viewingSupplier && (
          <div>
            <div className="supplier-detail-grid">
              <div>
                <small>Contact Person</small>
                <strong>{viewingSupplier.contactPerson || 'Not provided'}</strong>
              </div>
              <div>
                <small>Phone</small>
                <strong>{viewingSupplier.phone}</strong>
              </div>
              <div>
                <small>Email</small>
                <strong>{viewingSupplier.email || 'Not provided'}</strong>
              </div>
              <div>
                <small>Payment Terms</small>
                <strong>{viewingSupplier.paymentTerms}</strong>
              </div>
              <div>
                <small>Category</small>
                <strong>{meta.get(viewingSupplier.supplierId)?.category || 'Not established'}</strong>
              </div>
              <div>
                <small>Purchase Orders</small>
                <strong>{meta.get(viewingSupplier.supplierId)?.orders || 0}</strong>
              </div>
              <div>
                <small>Total Purchased</small>
                <strong>{money(meta.get(viewingSupplier.supplierId)?.total || 0)}</strong>
              </div>
              <div>
                <small>Outstanding</small>
                <strong>{money(meta.get(viewingSupplier.supplierId)?.outstanding || 0)}</strong>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <small>Address</small>
                <strong>
                  {[viewingSupplier.address, viewingSupplier.city, viewingSupplier.state]
                    .filter(Boolean)
                    .join(', ') || 'Not provided'}
                </strong>
              </div>
              <div>
                <small>GST / Tax Number</small>
                <strong>{viewingSupplier.taxNumber || 'Not provided'}</strong>
              </div>
            </div>
            <div className="supplier-history-empty">
              <strong>Payment Status: {meta.get(viewingSupplier.supplierId)?.status || 'Pending'}</strong>
              <span>You record payments to this supplier under Orders / Sales → Payments.</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        title="Archive Supplier"
        message={
          archiveTarget
            ? `Archive ${archiveTarget.supplierName}? Their history stays, but they won't show up when raising new purchase orders.`
            : ''
        }
        confirmText="Archive"
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </section>
  )
}

export default Suppliers
