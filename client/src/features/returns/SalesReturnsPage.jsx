import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import {
  RotateCcw,
  PackageCheck,
  DollarSign,
  Clock,
  Search,
  Plus,
  Eye,
  Package,
  Check,
} from 'lucide-react'
import { StatCard } from '../../dashboard/components/common/StatCard.tsx'
import { Badge } from '../../dashboard/components/common/Badge.tsx'
import { TableSkeleton } from '../../components/ui/Feedback.tsx'
import { returnApi } from '../../api/returnApi.js'
import { useResource } from '../../hooks/useResource.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Field, Input, Select } from '../../components/ui/FormControls.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Icon } from '../../components/ui/icons.jsx'
import './ReturnsPage.css'

const reasons = [
  'Damaged product',
  'Defective product',
  'Incorrect product',
  'Customer changed mind',
  'Size/Fit issue',
  'Other',
]
const conditions = ['Sellable', 'Damaged', 'Defective', 'Opened / Used', 'Other']
const refundMethods = [
  'Original Payment Method',
  'Cash',
  'UPI',
  'Card',
  'Bank transfer',
  'Store Credit',
  'Customer Balance/Credit',
  'Other',
]
const money = (currency = 'INR', value) => `${currency} ${Number(value || 0).toFixed(2)}`

const toList = (res) => (Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [])

export default function SalesReturnsPage({ business = {}, account = {} }) {
  const load = useCallback(
    () =>
      Promise.all([
        returnApi.list({ type: 'sale' }),
        returnApi.eligibleOrders(),
      ]).then(([returnsRes, ordersRes]) => [
        toList(returnsRes),
        toList(ordersRes),
      ]),
    []
  )
  const { data, loading, error, refetch } = useResource(load, [], [[], []])
  const [rawReturns = [], rawOrders = []] = data
  const returns = useMemo(() => toList(rawReturns), [rawReturns])
  const orders = useMemo(() => toList(rawOrders), [rawOrders])

  const [orderSearch, setOrderSearch] = useState('')
  const [orderId, setOrderId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('Damaged product')
  const [reasonDetails, setReasonDetails] = useState('')
  const [condition, setCondition] = useState('Sellable')
  const [refundMethod, setRefundMethod] = useState('Original Payment Method')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundState, setRefundState] = useState('Pending')
  const [confirming, setConfirming] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    refundStatus: 'all',
    reason: 'all',
    condition: 'all',
    refundMethod: 'all',
    dateFrom: '',
    dateTo: '',
  })

  const idempotencyKey = useRef('')
  const permissions = account.permissions || []
  const owner = account.role === 'owner'
  const canCreate = owner || permissions.includes('complete_returns') || permissions.includes('create_order')
  const canRefund = owner || permissions.includes('process_refunds')
  const canAdjustRefund = owner || permissions.includes('adjust_refunds')

  const visibleOrders = orders.filter((o) =>
    `${o.orderNumber || ''} ${o.invoiceNumber || ''} ${o.customerName || ''}`
      .toLowerCase()
      .includes(orderSearch.toLowerCase())
  )
  const order = orders.find((entry) => (entry.orderId || String(entry._id)) === orderId)
  const item = order?.items?.find((line) => line.productId === productId)
  const returnValue =
    item && quantity > 0
      ? Math.round(
          (((item.total || item.quantity * item.sellingPrice - (item.discount || 0) + (item.tax || 0)) *
            quantity) /
            item.quantity +
            Number.EPSILON) *
            100
        ) / 100
      : 0
  const outstandingAdjustment = Math.min(returnValue, order?.outstandingActual || 0)
  const refundRequired = Math.max(0, Math.round((returnValue - outstandingAdjustment) * 100) / 100)
  const desiredRefund = refundAmount === '' ? refundRequired : Number(refundAmount)
  const invalidQuantity =
    !item ||
    quantity <= 0 ||
    quantity > (item.returnableQuantity || item.quantity) ||
    (!['kg', 'gram', 'litre'].includes(item.unit) && !Number.isInteger(Number(quantity)))

  const filteredReturns = useMemo(() => {
    return returns.filter((record) => {
      const term = filters.search.toLowerCase()
      const matchesSearch =
        !term ||
        `${record.returnId || ''} ${record.orderNumber || ''} ${record.productName || ''} ${record.productSku || ''} ${record.customerName || ''}`
          .toLowerCase()
          .includes(term)
      const matchesStatus = filters.status === 'all' || record.status === filters.status
      const matchesRefund = filters.refundStatus === 'all' || record.refundStatus === filters.refundStatus
      const matchesReason = filters.reason === 'all' || record.reason === filters.reason
      const matchesCondition = filters.condition === 'all' || record.condition === filters.condition
      const matchesMethod =
        filters.refundMethod === 'all' || record.refundMethod?.includes(filters.refundMethod)
      const matchesDateFrom =
        !filters.dateFrom || new Date(record.createdAt) >= new Date(filters.dateFrom)
      const matchesDateTo =
        !filters.dateTo || new Date(record.createdAt) <= new Date(`${filters.dateTo}T23:59:59`)

      const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(filteredReturns.length / pageSize) || 1;
  const paginatedReturns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReturns.slice(start, start + pageSize);
  }, [filteredReturns, currentPage, pageSize]);

  return (
        matchesSearch &&
        matchesStatus &&
        matchesRefund &&
        matchesReason &&
        matchesCondition &&
        matchesMethod &&
        matchesDateFrom &&
        matchesDateTo
      )
    })
  }, [returns, filters])

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(filteredReturns.length / pageSize) || 1;
  const paginatedReturns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReturns.slice(start, start + pageSize);
  }, [filteredReturns, currentPage, pageSize]);

  const selectOrder = (value) => {
    setOrderId(value)
    setProductId('')
    setQuantity(1)
    setRefundAmount('')
    setMessage(null)
  }

  const askConfirmation = (event) => {
    event.preventDefault()
    if (!order || invalidQuantity || (reason === 'Other' && !reasonDetails.trim())) {
      setMessage({
        type: 'error',
        text: 'Complete the order, product, quantity, reason and condition steps.',
      })
      return
    }
    if (
      desiredRefund < 0 ||
      desiredRefund > refundRequired ||
      (!canAdjustRefund && desiredRefund !== refundRequired)
    ) {
      setMessage({
        type: 'error',
        text: 'Refund amount is outside your allowed refundable amount.',
      })
      return
    }
    idempotencyKey.current ||= globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
    setConfirming(true)
  }

  const confirm = async () => {
    if (saving) return
    setSaving(true)
    setMessage(null)
    try {
      const record = await returnApi.create({
        type: 'sale',
        orderId,
        productId,
        quantity: Number(quantity),
        reason,
        reasonDetails,
        condition,
        idempotencyKey: idempotencyKey.current,
      })
      let refundPending = record.refundRequired > 0
      let refundFailure = ''
      if (record.refundRequired > 0 && canRefund && desiredRefund > 0) {
        try {
          await returnApi.refund(record.returnId, {
            amount: desiredRefund,
            method: refundMethod,
            status: refundState,
          })
          refundPending = refundState !== 'Refunded' || desiredRefund < record.refundRequired
        } catch (refundError) {
          refundFailure = refundError.message
          refundPending = true
        }
      }
      await refetch()
      setMessage({
        type: refundPending ? 'error' : 'success',
        text: refundFailure
          ? `${record.returnId} completed, but its refund remains pending: ${refundFailure}`
          : refundPending
            ? `${record.returnId} completed. Refund follow-up is still required.`
            : `${record.returnId} completed and financially settled.`,
      })
      setConfirming(false)
      setOrderId('')
      setProductId('')
      setQuantity(1)
      setRefundAmount('')
      idempotencyKey.current = ''
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not complete the return.' })
      setConfirming(false)
    } finally {
      setSaving(false)
    }
  }

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  const refreshReturn = async (retId) => {
    await refetch()
    setSelectedReturn(await returnApi.get(retId))
  }

  const updateRefundStatus = async (refund, status) => {
    if (saving) return
    setSaving(true)
    setMessage(null)
    try {
      await returnApi.updateRefund(selectedReturn.returnId, refund.refundId, { status })
      await refreshReturn(selectedReturn.returnId)
      setMessage({ type: 'success', text: `Refund marked ${status.toLowerCase()}.` })
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not update the refund.' })
    } finally {
      setSaving(false)
    }
  }

  const recordRemainingRefund = async () => {
    if (saving || !selectedReturn?.remainingRefund) return
    setSaving(true)
    setMessage(null)
    try {
      await returnApi.refund(selectedReturn.returnId, {
        amount: selectedReturn.remainingRefund,
        method: refundMethod,
        status: refundState,
      })
      await refreshReturn(selectedReturn.returnId)
      setMessage({ type: 'success', text: 'Refund transaction recorded.' })
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not record the refund.' })
    } finally {
      setSaving(false)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const returnsToday = returns.filter((r) => new Date(r.createdAt) >= today)
  const pendingInspection = returns.filter((r) => r.status === 'Pending').length
  const restockedItems = returns
    .filter(
      (r) =>
        r.status === 'Completed' &&
        (r.condition === 'Sellable' || r.inventoryAction === 'sellable')
    )
    .reduce((sum, r) => sum + Number(r.quantity || 0), 0)
  const refundedCount = returns.filter((r) => r.refundStatus === 'Refunded').length
  const creditCount = returns.filter((r) => /credit|balance/i.test(r.refundMethod || '')).length
  const upiShare =
    refundedCount + creditCount > 0
      ? Math.round((refundedCount / (refundedCount + creditCount)) * 100)
      : 0
  const currentStep = !orderId ? 1 : !item || invalidQuantity ? 2 : 3
  const STEPS = [
    ['Select sales order', orderId ? 'completed' : 'active'],
    ['Choose item & reason', !orderId ? 'todo' : currentStep === 2 ? 'active' : 'completed'],
    ['Refund method & restock', currentStep === 3 ? 'active' : 'todo'],
  ]

  const columns = [
    {
      key: 'returnId',
      header: 'Id',
      render: (record) => (
        <span className="ledger-cell-id">
          #{record.returnId || 'RET'}
        </span>
      ),
      mobileLabel: 'Return ID',
    },
    {
      key: 'customer',
      header: 'Customer & Order',
      render: (record) => (
        <div>
          <span className="ledger-cell-primary">{record.customerName || 'Walk-in Customer'}</span>
          <span className="ledger-cell-secondary">
            Order: {record.orderNumber || '—'}
          </span>
        </div>
      ),
      mobileLabel: 'Customer',
    },
    {
      key: 'product',
      header: 'Product & Units',
      render: (record) => (
        <div>
          <span className="ledger-cell-primary">{record.productName}</span>
          <span className="ledger-cell-secondary">
            {record.productSku || 'No SKU'} · {record.quantity} units
          </span>
        </div>
      ),
      mobileLabel: 'Product',
    },
    {
      key: 'value',
      header: 'Return Value',
      render: (record) => (
        <div>
          <span className="ledger-cell-cost">
            {money(business.currency, record.returnValue || record.refundAmount)}
          </span>
          <span className="ledger-cell-secondary">
            {record.reason} · {record.condition || 'Sellable'}
          </span>
        </div>
      ),
      mobileLabel: 'Value',
    },
    {
      key: 'refundStatus',
      header: 'Refund Status',
      render: (record) => {
        const status = record.refundStatus || 'Not Required'
        const color =
          status === 'Refunded'
            ? '#10b981'
            : status === 'Failed'
              ? '#ef4444'
              : status.toLowerCase().includes('pending') || status.toLowerCase().includes('partial')
                ? '#f59e0b'
                : '#0084ff'
        return (
          <span
            className="ledger-status-pill"
            style={{ backgroundColor: color }}
          >
            {status}
          </span>
        )
      },
      mobileLabel: 'Refund',
    },
    {
      key: 'date',
      header: 'Date',
      render: (record) => (
        <span className="ledger-cell-secondary">
          {new Date(record.createdAt).toLocaleDateString()}
        </span>
      ),
      mobileLabel: 'Date',
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (record) => (
        <div className="ledger-actions-group">
          <button
            type="button"
            className="ledger-action-icon view"
            title="View Details"
            onClick={() => setSelectedReturn(record)}
          >
            <Icon name="search" size={14} />
          </button>
        </div>
      ),
      mobileLabel: 'Actions',
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Sales Returns
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Process customer returns, QA inspection, inventory restocking, and refund payouts.
          </p>
        </div>

        {canCreate && (
          <div className="flex items-center gap-2.5 py-0.5">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('return-order-search');
                if (el) {
                  el.focus();
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
            >
              <Plus size={16} />
              <span> Create Return</span>
            </button>
          </div>
        )}
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
          icon={<RotateCcw size={18} strokeWidth={2} />}
          iconBgColor="bg-[#EBF2FA] text-[#2563EB]"
          label="Total Returns"
          value={returnsToday.length}
          trend={`${returns.length} all time`}
          isPositive={true}
          onClick={() => updateFilter('status', 'all')}
          className={filters.status === 'all' ? 'ring-2 ring-[#7FAE82]' : ''}
        />
        <StatCard
          icon={<PackageCheck size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Restocked Units"
          value={`${restockedItems} units`}
          trend="Restocked to ledger"
          isPositive={true}
        />
        <StatCard
          icon={<DollarSign size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E8F5EC] text-[#2E8B57]"
          label="Refund Settlement"
          value={money(business.currency, returnsToday.reduce((sum, r) => sum + Number(r.returnValue || r.refundAmount || 0), 0))}
          trend={`${upiShare}% refunded`}
          isPositive={true}
        />
        <StatCard
          icon={<Clock size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FFF4DC] text-[#D98E0B]"
          label="Pending Inspection"
          value={`${pendingInspection} items`}
          trend="Awaiting QA"
          isPositive={false}
          onClick={() => updateFilter('status', 'Pending')}
          className={filters.status === 'Pending' ? 'ring-2 ring-[#7FAE82]' : ''}
        />
      </div>

      {/* 3-Step Progress Stepper */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#EEE6DA] shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STEPS.map(([label, state], idx) => {
            const isCompleted = state === 'completed'
            const isActive = state === 'active'
            return (
              <div
                key={label}
                className={`relative flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border transition-all duration-200 overflow-hidden ${
                  isActive
                    ? 'bg-[#FDFBF7] border-[#381e12] ring-2 ring-[#381e12]/10 shadow-xs'
                    : isCompleted
                    ? 'bg-[#F4FAF4] border-[#7FAE82]/60'
                    : 'bg-[#FAF8F5]/60 border-[#EBE4DC]'
                }`}
              >
                {/* Step number / check badge */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#381e12] text-white shadow-xs ring-2 ring-[#381e12]/15'
                      : isCompleted
                      ? 'bg-[#2E7D32] text-white shadow-xs'
                      : 'bg-[#EDE8E1] text-[#8C7E74] border border-[#DDD5CC]'
                  }`}
                >
                  {isCompleted ? <Check size={14} strokeWidth={2.8} /> : idx + 1}
                </div>

                {/* Step text labels */}
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isActive
                        ? 'text-[#381e12]'
                        : isCompleted
                        ? 'text-[#2E7D32]'
                        : 'text-[#9A948A]'
                    }`}
                  >
                    <span>
                      Step {idx + 1} · {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Next'}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#381e12] animate-pulse" />
                    )}
                  </div>
                  <div
                    className={`text-xs sm:text-sm font-semibold truncate mt-0.5 ${
                      isActive || isCompleted ? 'text-[#1C1B18]' : 'text-[#7C746B]'
                    }`}
                  >
                    {label}
                  </div>
                </div>

                {/* Visual bottom accent indicator */}
                <div
                  className={`absolute bottom-0 left-3 right-3 h-[2.5px] rounded-full transition-all ${
                    isActive
                      ? 'bg-[#381e12]'
                      : isCompleted
                      ? 'bg-[#2E7D32]/60'
                      : 'bg-transparent'
                  }`}
                />
              </div>
            )
          })}
        </div>
      </div>

      {canCreate && (
        <Card title="Process Customer Return" subtitle="Follow the 5 steps to verify order, product, reason and financial treatment">
          <form className="return-workflow-grid" onSubmit={askConfirmation}>
            {/* Step 1 */}
            <div className="return-step-section">
              <div className="return-step-header">
                <div className="return-step-badge">1</div>
                <div className="return-step-header-text">
                  <small>Step 1 · Order Lookup</small>
                  <h3>Original Sales Order</h3>
                </div>
              </div>
              <div className="returns-form-grid">
                <Field label="Search Orders" htmlFor="return-order-search">
                  <Input
                    id="return-order-search"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Order number, invoice or customer..."
                  />
                </Field>
                <Field label="Completed Order" required htmlFor="return-order">
                  <Select
                    id="return-order"
                    value={orderId}
                    onChange={(e) => selectOrder(e.target.value)}
                    required
                  >
                    <option value="">Select order</option>
                    {visibleOrders.map((entry) => {
                      const id = entry.orderId || String(entry._id);
                      return (
                        <option key={id} value={id}>
                          {entry.orderNumber || 'Order'} · {entry.customerName || 'Customer'}
                        </option>
                      );
                    })}
                  </Select>
                </Field>
              </div>

              {order && (
                <div className="return-info-pill-grid">
                  <div className="return-info-pill">
                    <small>Order Number</small>
                    <strong>{order.orderNumber}</strong>
                  </div>
                  <div className="return-info-pill">
                    <small>Customer</small>
                    <strong>{order.customerName}</strong>
                  </div>
                  <div className="return-info-pill">
                    <small>Date</small>
                    <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
                  </div>
                  <div className="return-info-pill">
                    <small>Total</small>
                    <strong>{money(business.currency, order.totalAmount)}</strong>
                  </div>
                  <div className="return-info-pill">
                    <small>Payment</small>
                    <strong>{order.paymentStatus}</strong>
                  </div>
                  <div className="return-info-pill">
                    <small>Paid</small>
                    <strong>{money(business.currency, order.amountPaidActual)}</strong>
                  </div>
                  <div className="return-info-pill">
                    <small>Outstanding</small>
                    <strong>{money(business.currency, order.outstandingActual)}</strong>
                  </div>
                  <div className="return-info-pill">
                    <small>Method</small>
                    <strong>{order.originalPaymentMethods?.join(', ') || 'None'}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2 */}
            <div className={`return-step-section ${!order ? 'disabled-step' : ''}`}>
              <div className="return-step-header">
                <div className="return-step-badge">2</div>
                <div className="return-step-header-text">
                  <small>Step 2 · Item Selection</small>
                  <h3>Sold Product</h3>
                </div>
              </div>
              <div className="returns-form-grid">
                <Field label="Select Product Line" required htmlFor="return-product">
                  <Select
                    id="return-product"
                    value={productId}
                    onChange={(e) => {
                      setProductId(e.target.value)
                      setQuantity(1)
                      setRefundAmount('')
                    }}
                    disabled={!order}
                    required
                  >
                    <option value="">Select sold product</option>
                    {order?.items
                      ?.filter((line) => (line.returnableQuantity ?? line.quantity) > 0)
                      .map((line) => (
                        <option key={line.productId} value={line.productId}>
                          {line.productName} ({line.sku || 'No SKU'})
                        </option>
                      ))}
                  </Select>
                </Field>
              </div>

              {item && (
                <div className="return-selected-product-card">
                  <strong>{item.productName}</strong>
                  <small>
                    {item.sku || 'No SKU'}
                    {item.size ? ` · Size ${item.size}` : ''}
                    {item.color ? ` · ${item.color}` : ''}
                  </small>
                  <p>
                    Sold: {item.quantity} | Already returned: {item.alreadyReturned || 0} | Returnable: {item.returnableQuantity ?? item.quantity}
                  </p>
                  <p>
                    Unit: {money(business.currency, item.sellingPrice)} · Discount: {money(business.currency, item.discount || 0)} · Tax: {money(business.currency, item.tax || 0)}
                  </p>
                </div>
              )}
            </div>

            {/* Step 3 */}
            <div className={`return-step-section ${!item ? 'disabled-step' : ''}`}>
              <div className="return-step-header">
                <div className="return-step-badge">3</div>
                <div className="return-step-header-text">
                  <small>Step 3 · Details & Inspection</small>
                  <h3>Quantity, Reason and Condition</h3>
                </div>
              </div>
              <div className="returns-form-grid">
                <Field label="Quantity to Return" required htmlFor="return-quantity">
                  <Input
                    id="return-quantity"
                    type="number"
                    min={item && ['kg', 'gram', 'litre'].includes(item.unit) ? 0.001 : 1}
                    step={item && ['kg', 'gram', 'litre'].includes(item.unit) ? 0.001 : 1}
                    max={item?.returnableQuantity || item?.quantity || 1}
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(Number(e.target.value))
                      setRefundAmount('')
                    }}
                    disabled={!item}
                    required
                  />
                </Field>

                <Field label="Return Reason" required htmlFor="return-reason">
                  <Select
                    id="return-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    disabled={!item}
                  >
                    {reasons.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </Select>
                </Field>

                <Field label="Condition Assessment" required htmlFor="return-condition">
                  <Select
                    id="return-condition"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    disabled={!item}
                  >
                    {conditions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              {reason === 'Other' && (
                <Field label="Specify Reason Details" required htmlFor="return-reason-details">
                  <Input
                    id="return-reason-details"
                    value={reasonDetails}
                    onChange={(e) => setReasonDetails(e.target.value)}
                    placeholder="Enter reason..."
                    required
                  />
                </Field>
              )}

              {invalidQuantity && item && (
                <div className="return-alert-box return-alert-error">
                  Quantity must be positive and cannot exceed {item.returnableQuantity || item.quantity}.
                </div>
              )}
            </div>

            {/* Step 4 */}
            <div className={`return-step-section ${!item || invalidQuantity ? 'disabled-step' : ''}`}>
              <div className="return-step-header">
                <div className="return-step-badge">4</div>
                <div className="return-step-header-text">
                  <small>Step 4 · Financials</small>
                  <h3>Financial Treatment</h3>
                </div>
              </div>

              <div className="return-info-pill-grid">
                <div className="return-info-pill">
                  <small>Order Total</small>
                  <strong>{money(business.currency, order?.totalAmount)}</strong>
                </div>
                <div className="return-info-pill">
                  <small>Originally Paid</small>
                  <strong>{money(business.currency, order?.amountPaidActual)}</strong>
                </div>
                <div className="return-info-pill">
                  <small>Outstanding Before</small>
                  <strong>{money(business.currency, order?.outstandingActual)}</strong>
                </div>
                <div className="return-info-pill">
                  <small>Return Value</small>
                  <strong>{money(business.currency, returnValue)}</strong>
                </div>
                <div className="return-info-pill">
                  <small>Balance Adjustment</small>
                  <strong>{money(business.currency, outstandingAdjustment)}</strong>
                </div>
                <div className="return-info-pill highlight-due">
                  <small>Refund Required</small>
                  <strong>{money(business.currency, refundRequired)}</strong>
                </div>
              </div>

              {refundRequired > 0 && canRefund && (
                <div className="returns-form-grid" style={{ marginTop: 'var(--space-3)' }}>
                  <Field label="Refund Method" htmlFor="refund-method">
                    <Select
                      id="refund-method"
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                    >
                      {refundMethods.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Refund Amount" htmlFor="refund-amount">
                    <Input
                      id="refund-amount"
                      type="number"
                      min="0.01"
                      max={refundRequired}
                      step="0.01"
                      value={refundAmount === '' ? refundRequired : refundAmount}
                      readOnly={!canAdjustRefund}
                      onChange={(e) => setRefundAmount(e.target.value)}
                    />
                  </Field>

                  <Field label="Initial Status" htmlFor="refund-state">
                    <Select
                      id="refund-state"
                      value={refundState}
                      onChange={(e) => setRefundState(e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Refunded">Refunded</option>
                      <option value="Failed">Failed</option>
                    </Select>
                  </Field>
                </div>
              )}
            </div>

            {/* Step 5 */}
            <div className={`return-step-section ${!item || invalidQuantity ? 'disabled-step' : ''}`}>
              <div className="return-step-header">
                <div className="return-step-badge">5</div>
                <div className="return-step-header-text">
                  <small>Step 5 · Confirmation</small>
                  <h3>Review & Confirm</h3>
                </div>
              </div>

              {item && (
                <div className="return-info-pill-grid">
                  <div className="return-info-pill">
                    <small>Order / Customer</small>
                    <strong>{order?.orderNumber} · {order?.customerName}</strong>
                  </div>
                  <div className="return-info-pill">
                    <small>Product / Qty</small>
                    <strong>{item.productName} · {quantity}</strong>
                  </div>
                  <div className="return-info-pill">
                    <small>Reason / Condition</small>
                    <strong>{reason} · {condition}</strong>
                  </div>
                  <div className="return-info-pill">
                    <small>Financial Impact</small>
                    <strong>{money(business.currency, outstandingAdjustment)} adj · {money(business.currency, refundRequired)} refund</strong>
                  </div>
                </div>
              )}

              <div className="returns-form-actions">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={!item || invalidQuantity || saving}
                  loading={saving}
                  icon="arrow-path"
                >
                  Review Return
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Audit History */}
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="bg-white rounded-2xl p-3 border border-[#EEE6DA] flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
          {/* Search - expanded and flexible */}
          <div className="relative flex-1 w-full md:w-auto min-w-[260px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A948A]" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search return ID, order, customer, product..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#EEE6DA] text-xs text-[#1C1B18] placeholder-[#9A948A] focus:border-[#381e12] outline-none transition-colors"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
            {/* Refund Status Dropdown */}
            <select
              value={filters.refundStatus}
              onChange={(e) => updateFilter('refundStatus', e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-[#EEE6DA] text-xs text-[#1C1B18] bg-white cursor-pointer outline-none focus:border-[#381e12] transition-colors"
            >
              <option value="all">All Refund Statuses</option>
              <option value="Not Required">Not Required</option>
              <option value="Pending">Pending</option>
              <option value="Partially Refunded">Partially Refunded</option>
              <option value="Refunded">Refunded</option>
              <option value="Failed">Failed</option>
            </select>

            {/* Reason Dropdown */}
            <select
              value={filters.reason}
              onChange={(e) => updateFilter('reason', e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-[#EEE6DA] text-xs text-[#1C1B18] bg-white cursor-pointer outline-none focus:border-[#381e12] transition-colors"
            >
              <option value="all">All Reasons</option>
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {/* Return Status Dropdown */}
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-[#EEE6DA] text-xs text-[#1C1B18] bg-white cursor-pointer outline-none focus:border-[#381e12] transition-colors font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table matching Product Page */}
        {loading && returns.length === 0 ? (
          <TableSkeleton
            columns={[
              { title: 'Return ID', width: '15%' },
              { title: 'Customer & Order', width: '22%' },
              { title: 'Product & Units', width: '22%' },
              { title: 'Return Value', width: '15%', align: 'right' },
              { title: 'Refund Status', width: '14%', align: 'center' },
              { title: 'Date', width: '12%', align: 'center' },
            ]}
            rows={6}
          />
        ) : filteredReturns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EEE6DA] p-12 flex flex-col items-center justify-center text-center shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF6EF] border border-[#EEE6DA] flex items-center justify-center text-[#9A948A] mb-3">
              <Package size={22} className="stroke-[1.75]" />
            </div>
            <h3 className="text-sm font-semibold text-[#1C1B18] text-center">No returns found</h3>
            <p className="text-xs text-[#6B665E] mt-1 max-w-md text-center">
              {returns.length ? 'No returns match your filter criteria.' : 'No customer returns recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead className="sticky top-0 z-10 bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#8C867A] text-[11px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-medium">Return ID</th>
                    <th className="py-3 px-3 font-medium">Customer & Order</th>
                    <th className="py-3 px-3 font-medium">Product & Units</th>
                    <th className="py-3 px-3 font-medium text-right">Return Value</th>
                    <th className="py-3 px-3 font-medium text-center">Refund Status</th>
                    <th className="py-3 px-3 font-medium text-center">Status</th>
                    <th className="py-3 px-3 font-medium text-center">Date</th>
                    <th className="py-3 px-4 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEE6DA]/80">
                  {paginatedReturns.map((record) => {
                    let refundVariant = 'neutral';
                    if (record.refundStatus === 'Refunded') refundVariant = 'success';
                    else if (record.refundStatus === 'Failed') refundVariant = 'danger';
                    else if (
                      record.refundStatus?.toLowerCase().includes('pending') ||
                      record.refundStatus?.toLowerCase().includes('partial')
                    )
                      refundVariant = 'warning';
                    else if (record.refundStatus === 'Not Required') refundVariant = 'neutral';
                    else refundVariant = 'info';

                    const statusVariant =
                      record.status === 'Completed'
                        ? 'success'
                        : record.status === 'Cancelled'
                          ? 'danger'
                          : 'warning';

                    return (
                      <tr
                        key={record.returnId}
                        className="hover:bg-[#FAF6EF]/60 transition-colors group cursor-pointer"
                        onClick={() => setSelectedReturn(record)}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#1C1B18] text-[13px] group-hover:text-[#6C9C70] transition-colors">
                            #{record.returnId || 'RET'}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#1C1B18] text-[13px]">
                            {record.customerName || 'Walk-in Customer'}
                          </div>
                          <div className="text-[11px] text-[#9A948A]">
                            Order: {record.orderNumber || '—'}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#1C1B18] text-[13px]">
                            {record.productName}
                          </div>
                          <div className="text-[11px] text-[#9A948A]">
                            {record.productSku || 'No SKU'} ·{' '}
                            <span className="text-[#1C1B18] font-medium">{record.quantity} units</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-[#1C1B18] text-sm tabular-nums">
                            {money(business.currency, record.returnValue || record.refundAmount)}
                          </div>
                          <div className="text-[11px] text-[#6B665E]">
                            {record.reason} · {record.condition || 'Sellable'}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <Badge variant={refundVariant}>{record.refundStatus || 'Not Required'}</Badge>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <Badge variant={statusVariant}>{record.status || 'Pending'}</Badge>
                        </td>

                        <td className="py-3 px-3 text-center text-[#6B665E] whitespace-nowrap">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </td>

                        <td
                          className="py-3 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedReturn(record)}
                              className="p-1.5 rounded-lg text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer"
                              title="View Details"
                              aria-label="View Details"
                            >
                              <Eye size={15} />
                            </button>
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
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredReturns.length)} to{' '}
                  {Math.min(currentPage * pageSize, filteredReturns.length)} of {filteredReturns.length} returns
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
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        title="Complete this return?"
        kicker="Final Confirmation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirm} loading={saving} disabled={saving} icon="arrow-path">
              Confirm return
            </Button>
          </>
        }
      >
        <p className="text-soft text-sm" style={{ marginBottom: 'var(--space-3)' }}>
          {quantity} × {item?.productName} will be recorded as {condition.toLowerCase()}.
        </p>
        <div className="return-info-pill-grid" style={{ marginBottom: 'var(--space-3)' }}>
          <div className="return-info-pill">
            <small>Inventory Action</small>
            <strong>{condition === 'Sellable' ? 'Restock Available' : 'Quarantine / Damaged'}</strong>
          </div>
          <div className="return-info-pill">
            <small>Balance Adjustment</small>
            <strong>{money(business.currency, outstandingAdjustment)}</strong>
          </div>
          <div className="return-info-pill highlight-due">
            <small>Refund Required</small>
            <strong>{money(business.currency, refundRequired)}</strong>
          </div>
        </div>
        <p className="text-muted text-xs">
          Refund records are internal workflow records. No payment gateway will be contacted.
        </p>
      </Modal>

      {/* Selected Return Details Modal */}
      <Modal
        isOpen={Boolean(selectedReturn)}
        onClose={() => setSelectedReturn(null)}
        title={selectedReturn?.returnId || 'Return Details'}
        kicker="Return Record"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelectedReturn(null)}>
            Close
          </Button>
        }
      >
        {selectedReturn && (
          <div>
            <div className="return-detail-fields-grid">
              {[
                ['Order Number', selectedReturn.orderNumber],
                ['Customer', selectedReturn.customerName],
                ['Product', `${selectedReturn.productName} (${selectedReturn.productSku || 'No SKU'})`],
                ['Quantity', selectedReturn.quantity],
                ['Return Value', money(business.currency, selectedReturn.returnValue || selectedReturn.refundAmount)],
                ['Reason', `${selectedReturn.reason}${selectedReturn.reasonDetails ? ` — ${selectedReturn.reasonDetails}` : ''}`],
                ['Condition', selectedReturn.condition || 'Legacy return'],
                ['Inventory Action', selectedReturn.inventoryAction || 'sellable'],
                ['Outstanding Adjusted', money(business.currency, selectedReturn.outstandingAdjustment)],
                ['Refunded', money(business.currency, selectedReturn.refundAmount)],
                ['Remaining Refund', money(business.currency, selectedReturn.remainingRefund)],
                ['Refund Status', selectedReturn.refundStatus || 'Not Required'],
                ['Return Status', selectedReturn.status],
                ['Processed By', selectedReturn.processedBy || 'System Admin'],
                ['Date', new Date(selectedReturn.createdAt).toLocaleString()],
              ].map(([label, value]) => (
                <div className="return-info-pill" key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            {selectedReturn.refunds?.length > 0 && (
              <div style={{ marginTop: 'var(--space-4)' }}>
                <h4 style={{ color: 'var(--text)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--space-2)' }}>
                  Refund Transactions
                </h4>
                {selectedReturn.refunds.map((refund) => (
                  <div className="refund-tx-card" key={refund.refundId}>
                    <div>
                      <strong className="text-main">{money(business.currency, refund.amount)}</strong>
                      <small className="block text-muted">{refund.resolvedMethod || refund.method}</small>
                    </div>
                    <Badge tone={refund.status === 'Refunded' ? 'success' : 'warning'}>
                      {refund.status}
                    </Badge>
                    {canRefund && ['Pending', 'Failed'].includes(refund.status) && (
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={saving}
                          onClick={() => updateRefundStatus(refund, 'Refunded')}
                        >
                          Mark Refunded
                        </Button>
                        {refund.status === 'Pending' && (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={saving}
                            onClick={() => updateRefundStatus(refund, 'Failed')}
                          >
                            Mark Failed
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canRefund && selectedReturn.remainingRefund > 0 && !selectedReturn.refunds?.some((r) => r.status === 'Pending') && (
              <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--surface-soft)', borderRadius: 'var(--sr-radius-md)' }}>
                <h4 style={{ color: 'var(--text)', fontSize: 'var(--fs-sm)', marginBottom: 'var(--space-2)' }}>
                  Process Remaining Refund ({money(business.currency, selectedReturn.remainingRefund)})
                </h4>
                <div className="returns-form-grid">
                  <Field label="Refund Method">
                    <Select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                    >
                      {refundMethods.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Status">
                    <Select
                      value={refundState}
                      onChange={(e) => setRefundState(e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Refunded">Refunded</option>
                      <option value="Failed">Failed</option>
                    </Select>
                  </Field>
                </div>
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <Button
                    variant="primary"
                    disabled={saving}
                    loading={saving}
                    onClick={recordRemainingRefund}
                  >
                    Record {money(business.currency, selectedReturn.remainingRefund)}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
