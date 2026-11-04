import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ShoppingCart,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Plus,
  Printer,
  Eye,
  Edit2,
  Trash2,
  Package,
} from 'lucide-react'
import { StatCard } from '../../dashboard/components/common/StatCard.tsx'
import { Badge } from '../../dashboard/components/common/Badge.tsx'
import { TableSkeleton } from '../../components/ui/Feedback.tsx'
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

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, search, channelFilter, statusFilter]);

  const totalPages = Math.ceil(visibleOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleOrders.slice(start, start + pageSize);
  }, [visibleOrders, currentPage, pageSize]);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10" aria-labelledby="ord-title">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="ord-title" className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            {section || 'Orders'}
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Manage customer sales, dispatch statuses, invoices, and point-of-sale receipts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 py-0.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#EEE6DA] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={loading || !!error || !orders.length}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EEE6DA] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 disabled:opacity-50"
          >
            <Download size={15} />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => openForm()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
          >
            <Plus size={16} />
            <span>+ Create Order</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium border ${
            message.type === 'error'
              ? 'bg-[#FDECEC] text-[#D64545] border-[#F9C2C2]'
              : 'bg-[#E8F5EC] text-[#2E8B57] border-[#CDEBD5]'
          }`}
          role={message.type === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </div>
      )}

      {/* 4 Dashboard-style StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<ShoppingCart size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Total Orders"
          value={orders.length}
          trend={`${stats.todayCount} today`}
          isPositive={true}
          onClick={() => setTab('all')}
          className={tab === 'all' ? 'ring-2 ring-[#7FAE82]' : ''}
        />
        <StatCard
          icon={<Truck size={18} strokeWidth={2} />}
          iconBgColor="bg-[#EBF2FA] text-[#2563EB]"
          label="Shipped / In Fulfilment"
          value={stats.inFulfilment}
          trend={`${stats.fulfilUnits} units`}
          isPositive={true}
          onClick={() => setTab('processing')}
          className={tab === 'processing' ? 'ring-2 ring-[#7FAE82]' : ''}
        />
        <StatCard
          icon={<CheckCircle2 size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E8F5EC] text-[#2E8B57]"
          label="Delivered / Completed"
          value={money(stats.todaySales)}
          trend={`${stats.fulfilRate}% rate`}
          isPositive={true}
          onClick={() => setTab('completed')}
          className={tab === 'completed' ? 'ring-2 ring-[#7FAE82]' : ''}
        />
        <StatCard
          icon={<Clock size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FFF4DC] text-[#D98E0B]"
          label="Pending Payment"
          value={stats.awaitingCount}
          trend={stats.awaitingAmount ? money(stats.awaitingAmount) : 'Settled'}
          isPositive={false}
          onClick={() => setTab('pending')}
          className={tab === 'pending' ? 'ring-2 ring-[#7FAE82]' : ''}
        />
      </div>

      {/* Toolbar matching Product Page */}
      <div className="bg-white rounded-2xl p-3 border border-[#EEE6DA] flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-2.5 text-[#9A948A]" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, invoice, customer, or product..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none"
            />
          </div>

          {/* Channel Dropdown */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs text-[#1C1B18] bg-white cursor-pointer outline-none"
          >
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.label}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs text-[#1C1B18] bg-white cursor-pointer outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 bg-[#FAF6EF] p-1 rounded-xl border border-[#EEE6DA]/80 overflow-x-auto w-full md:w-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                tab === t.id
                  ? 'bg-white text-[#1C1B18] shadow-2xs'
                  : 'text-[#6B665E] hover:text-[#1C1B18]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table matching Product Page */}
      {loading && orders.length === 0 ? (
        <TableSkeleton
          columns={[
            { title: 'Order ID', width: '15%' },
            { title: 'Customer', width: '22%' },
            { title: 'Date & Channel', width: '15%' },
            { title: 'Items', width: '12%', align: 'center' },
            { title: 'Total Amount', width: '14%', align: 'right' },
            { title: 'Payment', width: '11%', align: 'center' },
            { title: 'Status', width: '11%', align: 'center' },
          ]}
          rows={6}
        />
      ) : visibleOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EEE6DA] p-12 text-center shadow-2xs">
          <Package className="mx-auto text-[#9A948A] mb-3 opacity-60" size={36} />
          <h3 className="text-sm font-semibold text-[#1C1B18]">No orders found</h3>
          <p className="text-xs text-[#6B665E] mt-1 max-w-sm mx-auto">
            {orders.length ? 'No orders match your filter criteria.' : 'No sales orders yet. Create your first order.'}
          </p>
          <button
            type="button"
            onClick={() => openForm()}
            className="mt-4 px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            + Create New Order
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[800px]">
              <thead className="sticky top-0 z-10 bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#8C867A] text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-medium">Order ID</th>
                  <th className="py-3 px-3 font-medium">Customer</th>
                  <th className="py-3 px-3 font-medium">Date & Channel</th>
                  <th className="py-3 px-3 font-medium text-center">Items</th>
                  <th className="py-3 px-3 font-medium text-right">Total Amount</th>
                  <th className="py-3 px-3 font-medium text-center">Payment</th>
                  <th className="py-3 px-3 font-medium text-center">Status</th>
                  <th className="py-3 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6DA]/80">
                {paginatedOrders.map((order) => {
                  const customer = customerById.get(order.customerId);
                  const channel = channelOf(order);
                  const channelLabel = channel === 'pos' ? 'POS' : channel === 'wholesale' ? 'Wholesale' : 'Desk';
                  const totalItemsCount = order.items?.length || 0;
                  const totalUnitsCount = (order.items || []).reduce(
                    (sumVal, item) => sumVal + Number(item.quantity || 0),
                    0
                  );

                  let statusVariant = 'warning';
                  let statusLabel = order.status || 'Pending';
                  if (order.status === 'Completed') {
                    statusVariant = 'success';
                    statusLabel = 'Delivered';
                  } else if (order.status === 'Cancelled') {
                    statusVariant = 'danger';
                    statusLabel = 'Cancelled';
                  } else if (order.paymentStatus === 'Paid') {
                    statusVariant = 'info';
                    statusLabel = 'Shipped';
                  }

                  const paymentVariant =
                    order.paymentStatus === 'Paid'
                      ? 'success'
                      : order.paymentStatus === 'Partial'
                        ? 'warning'
                        : 'danger';

                  return (
                    <tr
                      key={order.orderId}
                      className="hover:bg-[#FAF6EF]/60 transition-colors group cursor-pointer"
                      onClick={() => setViewingOrder(order)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1C1B18] text-[13px] group-hover:text-[#6C9C70] transition-colors">
                          #{order.invoiceNumber || order.orderNumber}
                        </div>
                        {order.orderNumber && order.invoiceNumber && (
                          <div className="text-[11px] text-[#9A948A]">{order.orderNumber}</div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#1C1B18] text-[13px] flex items-center gap-1.5">
                          <span>{order.customerName || 'Walk-in customer'}</span>
                          {order.billingType === 'wholesale' && (
                            <span className="bg-[#EBF2FA] text-[#2563EB] text-[10px] font-semibold px-1.5 py-0.5 rounded border border-[#BFDBFE]">
                              B2B
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#9A948A]">
                          {customer?.phone || order.customerSnapshot?.phone || 'Direct Sale'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-[#1C1B18] text-xs font-medium">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] font-medium text-[#2563EB]">
                          {channelLabel}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center text-[#6B665E]">
                        <span className="font-semibold text-[#1C1B18]">{totalItemsCount}</span> items{' '}
                        <span className="text-[11px] text-[#9A948A]">({totalUnitsCount} pcs)</span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-[#1C1B18] text-sm tabular-nums">
                          {money(order.totalAmount)}
                        </div>
                        {order.paymentStatus !== 'Paid' && (
                          <div className="text-[11px] text-[#D98E0B] tabular-nums">
                            Due: {money(order.balanceDue || order.totalAmount)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <Badge variant={paymentVariant}>{order.paymentStatus || 'Pending'}</Badge>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                      </td>

                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingOrder(order)}
                            className="p-1.5 rounded-lg text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer"
                            title="View Invoice"
                            aria-label="View Invoice"
                          >
                            <Eye size={15} />
                          </button>
                          {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                            <button
                              type="button"
                              onClick={() => openForm(order)}
                              className="p-1.5 rounded-lg text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer"
                              title="Edit Order"
                              aria-label="Edit Order"
                            >
                              <Edit2 size={15} />
                            </button>
                          )}
                          {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                            <button
                              type="button"
                              onClick={() => cancelOrder(order)}
                              className="p-1.5 rounded-lg text-[#D64545] hover:text-[#B33535] hover:bg-[#FDECEC] transition-colors cursor-pointer"
                              title="Cancel Order"
                              aria-label="Cancel Order"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-[#EEE6DA] flex items-center justify-between text-xs text-[#6B665E]">
              <span>
                Showing {Math.min((currentPage - 1) * pageSize + 1, visibleOrders.length)} to{' '}
                {Math.min(currentPage * pageSize, visibleOrders.length)} of {visibleOrders.length} orders
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-[#EEE6DA] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <span className="px-2 font-medium text-[#1C1B18]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg border border-[#EEE6DA] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
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
    </div>
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
