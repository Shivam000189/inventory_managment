import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { salesOrderApi } from '../../api/salesOrderApi.js'
import { productApi } from '../../api/productApi.js'
import { customerApi } from '../../api/customerApi.js'
import { useResource } from '../../hooks/useResource.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { StatGrid, StatCard } from '../../components/ui/Card.jsx'
import { Toolbar } from '../../components/ui/Toolbar.jsx'
import { Tabs } from '../../components/ui/Tabs.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Field, Input, Select } from '../../components/ui/FormControls.jsx'
import CreditSalesList from './CreditSalesPage.jsx'
import OrderDetails from './OrderDetailsModal.jsx'
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

const FULFILLMENT = (order) => {
  if (order.status === 'Completed')
    return { label: 'Completed · handed over', tone: 'success' }
  if (order.status === 'Cancelled')
    return { label: 'Cancelled', tone: 'danger' }
  if (order.paymentStatus === 'Paid')
    return { label: 'Ready to pack', tone: 'info' }
  return { label: 'Awaiting payment', tone: 'warning' }
}

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

  const tabCounts = useMemo(() => {
    const result = {}
    for (const { id, match } of TABS) result[id] = orders.filter(match).length
    return result
  }, [orders])

  const tabsConfig = useMemo(
    () =>
      TABS.map((t) => ({
        id: t.id,
        label: t.label,
        count: tabCounts[t.id] ?? 0,
      })),
    [tabCounts]
  )

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

  const settlement = (order) => {
    const method = order.paymentSummary?.[0]?.method
    if (order.paymentStatus === 'Paid')
      return { label: method ? `Paid · ${method}` : 'Paid', tone: 'success' }
    if (order.paymentStatus === 'Partially Paid')
      return { label: 'Part-paid', tone: 'warning' }
    const terms = customerById.get(order.customerId)?.paymentTerms
    if (terms && terms !== 'Due on receipt')
      return { label: `Credit · ${terms}`, tone: 'warning' }
    return { label: 'Unpaid', tone: 'danger' }
  }

  const columns = [
    {
      key: 'orderNumber',
      header: 'Order & Date',
      priority: 'high',
      mobileLabel: 'Order',
      render: (order) => {
        const channel = channelOf(order)
        return (
          <div className="ord-cell-primary">
            <strong className="ord-num">
              {order.invoiceNumber || order.orderNumber}
            </strong>
            <small className="ord-cell-sub">
              {new Date(order.createdAt).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              · {order.cashierName || (channel === 'pos' ? 'POS counter' : 'Sales desk')}
            </small>
          </div>
        )
      },
    },
    {
      key: 'customerName',
      header: 'Customer',
      priority: 'high',
      mobileLabel: 'Customer',
      render: (order) => {
        const customer = customerById.get(order.customerId)
        const gstin = customer?.gstin || order.customerSnapshot?.gstin
        return (
          <div className="credit-customer-cell">
            <strong>
              {order.customerName || 'Walk-in customer'}
              {order.billingType === 'wholesale' && <span className="ord-b2b">B2B</span>}
            </strong>
            <small className="ord-cell-sub">
              {customer?.phone ||
                order.customerSnapshot?.phone ||
                (gstin ? `GSTIN ${gstin}` : 'No contact logged')}
            </small>
          </div>
        )
      },
    },
    {
      key: 'channel',
      header: 'Channel',
      priority: 'medium',
      mobileLabel: 'Channel',
      render: (order) => {
        const channel = channelOf(order)
        const tone = channel === 'wholesale' ? 'warning' : 'info'
        const label =
          channel === 'pos'
            ? 'Retail POS'
            : channel === 'wholesale'
              ? 'Wholesale order'
              : 'Retail order'
        return <Badge tone={tone}>{label}</Badge>
      },
    },
    {
      key: 'items',
      header: 'Purchased Items',
      priority: 'medium',
      mobileLabel: 'Items',
      render: (order) => {
        const units = (order.items || []).reduce(
          (sumVal, item) => sumVal + Number(item.quantity || 0),
          0
        )
        const skuNames = (order.items || [])
          .map((item) => item.productName || item.name)
          .filter(Boolean)
          .slice(0, 2)
          .join(', ')
        return (
          <div className="ord-cell-primary">
            <strong>
              {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'} ·{' '}
              {units} units
            </strong>
            <small className="ord-cell-sub">
              {skuNames || 'Line items on invoice'}
            </small>
          </div>
        )
      },
    },
    {
      key: 'totalAmount',
      header: 'Grand Total',
      priority: 'high',
      align: 'right',
      mobileLabel: 'Total',
      render: (order) => {
        const gst =
          Number(order.cgst || 0) +
            Number(order.sgst || 0) +
            Number(order.igst || 0) || Number(order.tax || 0)
        return (
          <div className="ord-amount-cell">
            <strong>{money(order.totalAmount)}</strong>
            <small className="ord-cell-sub">
              {gst > 0 ? `Incl. ${money(gst)} GST` : 'GST exempt'}
            </small>
          </div>
        )
      },
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      priority: 'high',
      mobileLabel: 'Payment',
      render: (order) => {
        const pay = settlement(order)
        return (
          <Badge tone={pay.tone} dot>
            {pay.label}
          </Badge>
        )
      },
    },
    {
      key: 'fulfillment',
      header: 'Fulfilment',
      priority: 'medium',
      mobileLabel: 'Fulfilment',
      render: (order) => {
        const fulfil = FULFILLMENT(order)
        return <Badge tone={fulfil.tone}>{fulfil.label}</Badge>
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      priority: 'high',
      align: 'right',
      mobileLabel: 'Actions',
      render: (order) => (
        <div className="ord-actions-cell" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewingOrder(order)}
            title="View Invoice"
          >
            Invoice
          </Button>
          {order.status !== 'Completed' && order.status !== 'Cancelled' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openForm(order)}
                title="Edit Order"
              >
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => completeOrder(order)}
                title="Complete & Deliver"
              >
                Complete
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => cancelOrder(order)}
                title="Cancel Order"
              >
                Cancel
              </Button>
            </>
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

      <StatGrid>
        <StatCard
          label="Today's Sales"
          value={loading || error ? '—' : money(stats.todaySales)}
          delta={stats.salesDelta !== null ? `${stats.salesDelta >= 0 ? '+' : ''}${stats.salesDelta}%` : undefined}
          deltaType={stats.salesDelta !== null && stats.salesDelta >= 0 ? 'up' : 'down'}
          subtext={`${stats.todayCount} orders today · Avg ${money(stats.avgOrder, 0)}`}
          tone="primary"
        />
        <StatCard
          label="In Fulfilment / Dispatch"
          value={loading || error ? '—' : `${stats.inFulfilment} orders`}
          subtext={`${stats.fulfilUnits} units waiting to be packed & dispatched`}
          tone="blue"
        />
        <StatCard
          label="Awaiting Payment"
          value={loading || error ? '—' : money(stats.awaitingAmount)}
          subtext={`${stats.awaitingCount} open credit orders with unpaid balances`}
          tone={stats.awaitingCount > 0 ? 'amber' : 'neutral'}
        />
        <StatCard
          label="Fulfilment Rate"
          value={loading || error ? '—' : `${stats.fulfilRate}%`}
          subtext={`${stats.completed} delivered out of non-cancelled orders`}
          tone="emerald"
        />
      </StatGrid>

      <div className="ord-pipeline-banner">
        <div className="ord-pipeline-icon">✓</div>
        <div className="ord-pipeline-content">
          <div className="ord-pipeline-title">Sales Pipeline &amp; Inventory Sync</div>
          <div className="ord-pipeline-desc">
            Orders reserve warehouse stock as soon as they're created. Completing an
            order deducts stock and generates the customer invoice.
          </div>
          <div className="ord-pipeline-legend">
            <span className="ord-legend-item">
              <span className="ord-legend-dot green" />
              Completed = paid &amp; handed over
            </span>
            <span className="ord-legend-item">
              <span className="ord-legend-dot blue" />
              Processing = packing / dispatch
            </span>
            <span className="ord-legend-item">
              <span className="ord-legend-dot amber" />
              Pending = unpaid / on credit
            </span>
          </div>
        </div>
      </div>

      <Toolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order, invoice, customer, or item (Ctrl+K)"
        filters={
          <div className="ord-toolbar-filters">
            <Tabs tabs={tabsConfig} activeTab={tab} onChange={setTab} />
            <select
              className="ord-select"
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              aria-label="Filter by channel"
            >
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.label}
                </option>
              ))}
            </select>
            <select
              className="ord-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              {['Pending', 'Completed', 'Cancelled'].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        }
        actions={
          <Button variant="secondary" size="sm" onClick={refetch} disabled={loading}>
            Refresh
          </Button>
        }
      />

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
