import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { salesOrderApi } from '../../api/salesOrderApi.js'
import { productApi } from '../../api/productApi.js'
import { customerApi } from '../../api/customerApi.js'
import { useResource } from '../../hooks/useResource.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Field, Input, Select } from '../../components/ui/FormControls.jsx'
import CreditSalesList from './CreditSalesPage.jsx'
import OrderDetails from './OrderDetailsModal.jsx'
import { Icon } from '../../components/ui/icons.jsx'
import './SalesOrdersPage.css'

const emptyItem = () => ({
  id: Math.random().toString(36).slice(2, 9),
  productId: '',
  quantity: 1,
  sellingPrice: '',
  discount: 0,
  tax: 0,
})

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const TABS = [
  { id: 'all', label: 'All Orders', match: () => true },
  {
    id: 'processing',
    label: 'Processing',
    match: (o) =>
      o.status !== 'Completed' &&
      o.status !== 'Cancelled' &&
      o.paymentStatus === 'Paid',
  },
  {
    id: 'pending',
    label: 'Pending Payment',
    match: (o) =>
      o.status !== 'Completed' &&
      o.status !== 'Cancelled' &&
      o.paymentStatus !== 'Paid',
  },
  { id: 'completed', label: 'Completed', match: (o) => o.status === 'Completed' },
  {
    id: 'cancelled',
    label: 'Cancelled / Returns',
    match: (o) => o.status === 'Cancelled',
  },
]


function SalesOrders({ business = {}, creditSales = false, section = 'Credit Sales' }) {
  const load = useCallback(
    () => Promise.all([salesOrderApi.list(), productApi.list(), customerApi.list()]),
    []
  )
  const { data, loading, error, refetch, setData } = useResource(load, [], [[], [], []])
  const [orders, products, customers] = data

  const [formOpen, setFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [items, setItems] = useState([emptyItem()])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const searchRef = useRef(null)

  const currency = business?.currency || 'INR'
  const money = (value, dp = 2) => {
    const amount = Number(value || 0)
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: dp,
        maximumFractionDigits: dp,
      }).format(amount)
    } catch {
      return `${currency} ${amount.toLocaleString('en-IN', {
        minimumFractionDigits: dp,
        maximumFractionDigits: dp,
      })}`
    }
  }

  const customerById = useMemo(
    () => new Map(customers.map((customer) => [customer.customerId, customer])),
    [customers]
  )

  const setOrders = (updater) =>
    setData((current) => [updater(current[0]), current[1], current[2]])

  const itemTotal = (item) =>
    Math.max(
      0,
      Number(item.quantity || 0) * Number(item.sellingPrice || 0) -
        Number(item.discount || 0) +
        Number(item.tax || 0)
    )

  const totals = items.reduce(
    (result, item) => ({ totalAmount: result.totalAmount + itemTotal(item) }),
    { totalAmount: 0 }
  )

  const updateItem = (index, field, value) =>
    setItems(
      items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
              ...(field === 'productId'
                ? {
                    sellingPrice:
                      products.find((p) => p.productId === value)?.sellingPrice ?? '',
                  }
                : {}),
            }
          : item
      )
    )

  const openForm = (order = null) => {
    setEditingOrder(order)
    setItems(
      order
        ? order.items.map((item) => ({
            id: item.productId || Math.random().toString(36).slice(2, 9),
            productId: item.productId,
            quantity: item.quantity,
            sellingPrice: item.sellingPrice,
            discount: item.discount,
            tax: item.tax,
          }))
        : [emptyItem()]
    )
    setFormOpen(true)
    setMessage(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    if (!customers.length) {
      setMessage({ type: 'error', text: 'Add a customer before creating an order.' })
      return
    }
    const formData = new FormData(event.currentTarget)
    const validItems = items.filter(
      (item) =>
        item.productId &&
        Number(item.quantity) > 0 &&
        Number(item.sellingPrice) >= 0
    )
    if (!validItems.length) {
      setMessage({
        type: 'error',
        text: 'Add at least one product with a valid quantity and price.',
      })
      return
    }
    const payload = {
      customerId: formData.get('customerId'),
      notes: (formData.get('notes') || '').trim(),
      items: validItems.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        sellingPrice: Number(item.sellingPrice),
        discount: Number(item.discount || 0),
        tax: Number(item.tax || 0),
      })),
    }
    setSaving(true)
    try {
      const saved = editingOrder
        ? await salesOrderApi.update(editingOrder.orderId, payload)
        : await salesOrderApi.create(payload)
      setOrders((list) =>
        editingOrder
          ? list.map((item) => (item.orderId === saved.orderId ? saved : item))
          : [saved, ...list]
      )
      setFormOpen(false)
      setEditingOrder(null)
      setMessage({
        type: 'success',
        text: `${saved.orderNumber} saved successfully.`,
      })
    } catch (caught) {
      setMessage({
        type: 'error',
        text: caught.message || 'Could not save the order.',
      })
    } finally {
      setSaving(false)
    }
  }

  const completeOrder = async (order) => {
    if (order.status === 'Completed') return
    try {
      const saved = await salesOrderApi.complete(order.orderId)
      const freshProducts = await productApi.list()
      setData((current) => [
        current[0].map((item) => (item.orderId === saved.orderId ? saved : item)),
        freshProducts,
        current[2],
      ])
      setMessage({
        type: 'success',
        text: `${order.orderNumber} completed. Inventory was reduced.`,
      })
    } catch (caught) {
      setMessage({
        type: 'error',
        text: caught.message || 'Could not complete the order.',
      })
    }
  }

  const cancelOrder = async (order) => {
    if (order.status === 'Completed') return
    try {
      const saved = await salesOrderApi.cancel(order.orderId)
      setOrders((list) =>
        list.map((item) => (item.orderId === saved.orderId ? saved : item))
      )
    } catch (caught) {
      setMessage({
        type: 'error',
        text: caught.message || 'Could not cancel the order.',
      })
    }
  }

  useEffect(() => {
    if (creditSales) return undefined
    const handler = (event) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.key === '0') {
        event.preventDefault()
        openForm()
      } else if (
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [creditSales])

  const stats = useMemo(() => {
    const today = startOfToday()
    const yesterday = new Date(today.getTime() - 864e5)
    const active = orders.filter((order) => order.status !== 'Cancelled')
    const todays = active.filter((order) => new Date(order.createdAt) >= today)
    const yestSales = active
      .filter((order) => {
        const at = new Date(order.createdAt)
        return at >= yesterday && at < today
      })
      .reduce((sumVal, order) => sumVal + Number(order.totalAmount || 0), 0)
    const todaySales = todays.reduce(
      (sumVal, order) => sumVal + Number(order.totalAmount || 0),
      0
    )
    const inFulfilment = orders.filter(
      (order) => order.status === 'Pending' && order.paymentStatus === 'Paid'
    )
    const fulfilUnits = inFulfilment.reduce(
      (sumVal, order) =>
        sumVal +
        (order.items || []).reduce(
          (n, item) => n + Number(item.quantity || 0),
          0
        ),
      0
    )
    const awaiting = orders.filter(
      (order) => order.status !== 'Cancelled' && Number(order.balanceDue || 0) > 0
    )
    const awaitingAmount = awaiting.reduce(
      (sumVal, order) => sumVal + Number(order.balanceDue || 0),
      0
    )
    const completed = orders.filter((order) => order.status === 'Completed').length
    const closeable = orders.filter((order) => order.status !== 'Cancelled').length
    return {
      todaySales,
      todayCount: todays.length,
      avgOrder: todays.length ? todaySales / todays.length : 0,
      salesDelta: yestSales
        ? Math.round(((todaySales - yestSales) / yestSales) * 100)
        : null,
      inFulfilment: inFulfilment.length,
      fulfilUnits,
      awaitingAmount,
      awaitingCount: awaiting.length,
      completed,
      fulfilRate: closeable ? Math.round((completed / closeable) * 100) : 100,
    }
  }, [orders])



  const channels = [
    { id: 'all', label: 'All channels' },
    { id: 'pos', label: 'Retail POS counter' },
    { id: 'wholesale', label: 'Wholesale orders' },
    { id: 'order', label: 'Retail sales desk' },
  ]
  const channelOf = (order) =>
    order.channel === 'POS'
      ? 'pos'
      : order.billingType === 'wholesale'
        ? 'wholesale'
        : 'order'

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matchTab = TABS.find((option) => option.id === tab)?.match || (() => true)
    return orders.filter((order) => {
      if (!matchTab(order)) return false
      if (channelFilter !== 'all' && channelOf(order) !== channelFilter) return false
      if (statusFilter !== 'all' && order.status !== statusFilter) return false
      if (
        query &&
        !`${order.orderNumber} ${order.invoiceNumber || ''} ${order.customerName || ''} ${order.status} ${(order.items || []).map((item) => item.productName || item.name || '').join(' ')}`
          .toLowerCase()
          .includes(query)
      )
        return false
      return true
    })
  }, [orders, tab, channelFilter, statusFilter, search])

  const exportCsv = () => {
    const escapeCell = (value) => {
      const text = String(value ?? '')
      const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text
      return `"${safe.replaceAll('"', '""')}"`
    }
    const rows = [
      [
        'Order',
        'Invoice',
        'Date',
        'Customer',
        'Channel',
        'Items',
        'Units',
        'Grand Total',
        'GST',
        'Payment',
        'Status',
      ],
      ...visibleOrders.map((order) => [
        order.orderNumber,
        order.invoiceNumber,
        new Date(order.createdAt).toLocaleString('en-GB'),
        order.customerName,
        channelOf(order) === 'pos'
          ? 'Retail POS'
          : channelOf(order) === 'wholesale'
            ? 'Wholesale'
            : 'Retail order',
        order.items?.length || 0,
        (order.items || []).reduce(
          (sumVal, item) => sumVal + Number(item.quantity || 0),
          0
        ),
        order.totalAmount,
        Number(order.cgst || 0) +
          Number(order.sgst || 0) +
          Number(order.igst || 0) ||
          order.tax,
        order.paymentStatus,
        order.status,
      ]),
    ]
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `sales-orders-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }


  const columns = [
    {
      key: 'orderNumber',
      header: 'Id',
      priority: 'high',
      mobileLabel: 'Id',
      render: (order) => (
        <span className="ledger-cell-id">
          #{order.invoiceNumber || order.orderNumber}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      priority: 'high',
      mobileLabel: 'Customer',
      render: (order) => {
        const customer = customerById.get(order.customerId)
        return (
          <div>
            <div className="ledger-cell-primary">
              {order.customerName || 'Walk-in customer'}
              {order.billingType === 'wholesale' && (
                <span className="ord-b2b" style={{ marginLeft: '6px', fontSize: '10px' }}>B2B</span>
              )}
            </div>
            <div className="ledger-cell-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>
              {customer?.phone || order.customerSnapshot?.phone || 'Direct Sale'}
            </div>
          </div>
        )
      },
    },
    {
      key: 'dateChannel',
      header: 'Date & Channel',
      priority: 'medium',
      mobileLabel: 'Date',
      render: (order) => {
        const channel = channelOf(order)
        const channelLabel = channel === 'pos' ? 'POS' : channel === 'wholesale' ? 'Wholesale' : 'Desk'
        return (
          <div>
            <div className="ledger-cell-secondary">
              {new Date(order.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
            <div className="ledger-cell-secondary" style={{ fontSize: '11px', marginTop: '2px', color: '#0084ff', fontWeight: 600 }}>
              {channelLabel}
            </div>
          </div>
        )
      },
    },
    {
      key: 'items',
      header: 'Items',
      priority: 'medium',
      mobileLabel: 'Items',
      render: (order) => {
        const units = (order.items || []).reduce(
          (sumVal, item) => sumVal + Number(item.quantity || 0),
          0
        )
        return (
          <span className="ledger-cell-secondary">
            {order.items?.length || 0} items ({units} units)
          </span>
        )
      },
    },
    {
      key: 'totalAmount',
      header: 'Total Cost',
      priority: 'high',
      align: 'right',
      mobileLabel: 'Total',
      render: (order) => (
        <div style={{ textAlign: 'right' }}>
          <span className="ledger-cell-cost">{money(order.totalAmount)}</span>
          {order.paymentStatus !== 'Paid' && (
            <div className="ledger-cell-secondary" style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px' }}>
              Due: {money(order.balanceDue || order.totalAmount)}
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
      mobileLabel: 'Status',
      render: (order) => {
        let pillClass = 'status-pending'
        let label = order.status || 'Pending'
        if (order.status === 'Completed') {
          pillClass = 'status-delivered'
          label = 'Delivered'
        } else if (order.status === 'Cancelled') {
          pillClass = 'status-danger'
          label = 'Cancelled'
        } else if (order.paymentStatus === 'Paid') {
          pillClass = 'status-shipped'
          label = 'Shipped'
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
      priority: 'high',
      align: 'right',
      mobileLabel: 'Action',
      render: (order) => (
        <div className="ledger-actions-group" onClick={(e) => e.stopPropagation()}>
          {order.status !== 'Completed' && order.status !== 'Cancelled' && (
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
            onClick={() => setViewingOrder(order)}
            title="View Invoice"
            aria-label="View Invoice"
          >
            <Icon name="eye" size={17} />
          </button>
          {order.status !== 'Completed' && order.status !== 'Cancelled' && (
            <button
              type="button"
              className="ledger-action-icon action-delete"
              onClick={() => cancelOrder(order)}
              title="Cancel Order"
              aria-label="Cancel Order"
            >
              <Icon name="close" size={17} />
            </button>
          )}
        </div>
      ),
    },
  ]

  if (creditSales) {
    return (
      <section className="sales-orders-unified">
        <CreditSalesList
          section={section}
          orders={orders}
          business={business}
          loading={loading}
          error={error}
          refetch={refetch}
          onCreate={() => openForm()}
          onView={setViewingOrder}
          onEdit={openForm}
          onComplete={completeOrder}
          onCancel={cancelOrder}
        />
        {message && (
          <p className={`form-status ${message.type}`}>{message.text}</p>
        )}
        <OrderFormModal
          isOpen={formOpen}
          creditSales={creditSales}
          editingOrder={editingOrder}
          customers={customers}
          products={products}
          items={items}
          setItems={setItems}
          emptyItem={emptyItem}
          updateItem={updateItem}
          itemTotal={itemTotal}
          totals={totals}
          business={business}
          saving={saving}
          handleSubmit={handleSubmit}
          onClose={() => setFormOpen(false)}
        />
        {viewingOrder && (
          <OrderDetails
            order={viewingOrder}
            business={business}
            onClose={() => setViewingOrder(null)}
          />
        )}
      </section>
    )
  }

  const pageActions = [
    {
      label: 'Print Slips',
      variant: 'secondary',
      onClick: () => window.print(),
    },
    {
      label: 'Export CSV',
      variant: 'secondary',
      onClick: exportCsv,
      disabled: loading || !!error || !orders.length,
    },
    {
      label: 'Create Order',
      variant: 'primary',
      onClick: () => openForm(),
    },
  ]

  return (
    <section className="sales-orders-unified" aria-labelledby="ord-title">
      <PageHeader
        kicker={`${business?.name || 'Store'} · ${business?.industry || 'Retail'}`}
        title={section || 'Orders'}
        description="Manage customer sales, dispatch statuses, invoices, and point-of-sale receipts."
        scope={`${stats.todayCount} sales registered today`}
        actions={pageActions}
      />

      {message && (
        <div
          className={`form-status ${message.type}`}
          role={message.type === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </div>
      )}

      {/* 4 Pastel KPI Summary Cards */}
      <div className="ledger-kpi-grid">
        <div
          className={`ledger-kpi-card theme-blue ${tab === 'all' ? 'is-active' : ''}`}
          onClick={() => setTab('all')}
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="list" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Total</span>
            <span className="ledger-kpi-val">{orders.length} Invoices</span>
          </div>
        </div>

        <div
          className={`ledger-kpi-card theme-slate ${tab === 'processing' ? 'is-active' : ''}`}
          onClick={() => setTab('processing')}
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="truck" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Shipped</span>
            <span className="ledger-kpi-val">{stats.inFulfilment} Invoices</span>
          </div>
        </div>

        <div
          className={`ledger-kpi-card theme-green ${tab === 'completed' ? 'is-active' : ''}`}
          onClick={() => setTab('completed')}
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="dollar" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Delivered</span>
            <span className="ledger-kpi-val">{money(stats.todaySales)}</span>
          </div>
        </div>

        <div
          className={`ledger-kpi-card theme-amber ${tab === 'pending' ? 'is-active' : ''}`}
          onClick={() => setTab('pending')}
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="pending" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Pending</span>
            <span className="ledger-kpi-val">{stats.awaitingCount} Invoices</span>
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
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="ledger-search-icon">
              <Icon name="search" size={17} />
            </span>
          </div>

          <select
            className="ledger-pill-select"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
          >
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.label}
              </option>
            ))}
          </select>

          <select
            className="ledger-pill-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
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
        data={visibleOrders}
        keyField="orderId"
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyMessage={
          orders.length
            ? 'No orders match these filters.'
            : 'No sales orders yet. Create one or ring up a sale at the POS.'
        }
        pagination
        pageSize={10}
        onRowClick={(order) => setViewingOrder(order)}
      />

      <OrderFormModal
        isOpen={formOpen}
        creditSales={creditSales}
        editingOrder={editingOrder}
        customers={customers}
        products={products}
        items={items}
        setItems={setItems}
        emptyItem={emptyItem}
        updateItem={updateItem}
        itemTotal={itemTotal}
        totals={totals}
        business={business}
        saving={saving}
        handleSubmit={handleSubmit}
        onClose={() => setFormOpen(false)}
      />

      {viewingOrder && (
        <OrderDetails
          order={viewingOrder}
          business={business}
          onClose={() => setViewingOrder(null)}
        />
      )}
    </section>
  )
}

function OrderFormModal({
  isOpen,
  editingOrder,
  customers = [],
  products = [],
  items = [],
  setItems,
  emptyItem: makeEmptyItem,
  updateItem,
  itemTotal,
  totals,
  business,
  saving,
  handleSubmit,
  onClose,
}) {
  const currency = business?.currency || 'INR'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingOrder ? `Edit ${editingOrder.orderNumber}` : 'Create Sales Order'}
      kicker={editingOrder ? 'Update Order' : 'New Sales Order'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="order-form-modal"
            loading={saving}
          >
            {saving ? 'Saving…' : 'Save Order'}
          </Button>
        </>
      }
    >
      <form id="order-form-modal" onSubmit={handleSubmit} className="ord-form-container">
        <div className="ord-form-grid">
          <Field label="Customer *" htmlFor="order-customer" required>
            <Select
              id="order-customer"
              name="customerId"
              defaultValue={editingOrder?.customerId || ''}
              required
            >
              <option value="" disabled>
                Select customer
              </option>
              {customers.map((c) => (
                <option key={c.customerId} value={c.customerId}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Notes" htmlFor="order-notes">
            <Input
              id="order-notes"
              name="notes"
              defaultValue={editingOrder?.notes || ''}
              placeholder="Internal order notes, delivery instructions…"
            />
          </Field>
        </div>

        <div className="ord-items-section">
          <div className="ord-items-header">
            <h4>Order Items ({items.length})</h4>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setItems([...items, makeEmptyItem()])}
            >
              Add Item +
            </Button>
          </div>

          <div className="ord-items-list">
            {items.map((item, index) => (
              <div className="ord-item-row" key={item.id}>
                <Select
                  aria-label="Select product"
                  value={item.productId}
                  onChange={(e) => updateItem(index, 'productId', e.target.value)}
                  required
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.productId} value={p.productId}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </Select>

                <Input
                  aria-label="Quantity"
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  required
                />

                <Input
                  aria-label="Selling price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  value={item.sellingPrice}
                  onChange={(e) => updateItem(index, 'sellingPrice', e.target.value)}
                  required
                />

                <Input
                  aria-label="Discount"
                  type="number"
                  min="0"
                  placeholder="Disc"
                  value={item.discount}
                  onChange={(e) => updateItem(index, 'discount', e.target.value)}
                />

                <Input
                  aria-label="Tax"
                  type="number"
                  min="0"
                  placeholder="Tax"
                  value={item.tax}
                  onChange={(e) => updateItem(index, 'tax', e.target.value)}
                />

                <div className="ord-item-total">
                  {currency} {itemTotal(item).toFixed(2)}
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    className="ord-remove-item"
                    onClick={() =>
                      setItems(items.filter((_, itemIndex) => itemIndex !== index))
                    }
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="ord-total-bar">
            <span>Total Payable:</span>
            <strong>
              {currency} {totals.totalAmount.toFixed(2)}
            </strong>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default SalesOrders
