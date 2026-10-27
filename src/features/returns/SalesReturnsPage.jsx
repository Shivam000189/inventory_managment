import { useCallback, useMemo, useRef, useState } from 'react'
import { returnApi } from '../../api/returnApi.js'
import { useResource } from '../../hooks/useResource.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { StatGrid, StatCard, Card } from '../../components/ui/Card.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Field, Input, Select } from '../../components/ui/FormControls.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
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

export default function SalesReturnsPage({ business = {}, account = {} }) {
  const load = useCallback(
    () => Promise.all([returnApi.list({ type: 'sale' }), returnApi.eligibleOrders()]),
    []
  )
  const { data, loading, error, refetch } = useResource(load, [], [[], []])
  const [returns = [], orders = []] = data

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
  const order = orders.find((entry) => entry.orderId === orderId)
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
      header: 'Return ID & Customer',
      render: (record) => (
        <div>
          <span className="font-semibold text-main">{record.returnId}</span>
          <small className="block text-muted">
            {record.orderNumber} · {record.customerName || 'Walk-in Customer'}
          </small>
        </div>
      ),
      mobileLabel: 'Return ID',
    },
    {
      key: 'product',
      header: 'Product & Units',
      render: (record) => (
        <div>
          <span className="font-medium text-main">{record.productName}</span>
          <small className="block text-muted">
            {record.productSku || 'No SKU'} · {record.quantity} units
          </small>
        </div>
      ),
      mobileLabel: 'Product',
    },
    {
      key: 'value',
      header: 'Value & Condition',
      render: (record) => (
        <div>
          <span className="font-medium text-main">
            {money(business.currency, record.returnValue || record.refundAmount)}
          </span>
          <small className="block text-muted">
            {record.reason} · {record.condition || 'Legacy return'}
          </small>
        </div>
      ),
      mobileLabel: 'Value',
    },
    {
      key: 'refundStatus',
      header: 'Refund Status',
      render: (record) => (
        <Badge
          tone={
            record.refundStatus === 'Refunded'
              ? 'success'
              : record.refundStatus === 'Failed'
                ? 'danger'
                : 'warning'
          }
        >
          {record.refundStatus || 'Not Required'}
        </Badge>
      ),
      mobileLabel: 'Refund',
    },
    {
      key: 'date',
      header: 'Date',
      render: (record) => (
        <span className="text-soft text-sm">
          {new Date(record.createdAt).toLocaleDateString()}
        </span>
      ),
      mobileLabel: 'Date',
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (record) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectedReturn(record)}
        >
          View Details
        </Button>
      ),
      mobileLabel: 'Actions',
    },
  ]

  return (
    <div className="returns-page returns-container">
      <PageHeader
        kicker="Manage your returns • QA & refund control"
        title="Returns & Refund Management"
        badge="Live terminal"
        description={`Guided customer returns processing, QA inspection, inventory restocking, and refund payout for ${business.name || 'your business'}.`}
        actions={
          canCreate ? (
            <Button
              variant="primary"
              onClick={() => document.getElementById('return-order-search')?.focus()}
              icon="plus"
            >
              Create walk-in return
            </Button>
          ) : null
        }
      />

      {message && (
        <div className={`return-alert-box ${message.type === 'error' ? 'return-alert-error' : 'return-alert-success'}`}>
          {message.text}
        </div>
      )}

      <StatGrid columns={4}>
        <StatCard
          title="Total returns today"
          value={`${returnsToday.length} returns`}
          subtext={`${money(business.currency, returnsToday.reduce((sum, r) => sum + Number(r.returnValue || r.refundAmount || 0), 0))} return value`}
          icon="arrow-path"
        />
        <StatCard
          title="Pending inspection"
          value={`${pendingInspection} items`}
          subtext="Awaiting QA check before refund release"
          deltaType={pendingInspection ? 'warning' : 'neutral'}
          icon="clock"
        />
        <StatCard
          title="Approved & restocked"
          value={`${restockedItems} units`}
          subtext="Sellable stock returned to ledger"
          deltaType="positive"
          icon="box"
        />
        <StatCard
          title="Refund method split"
          value={`${upiShare}% refunded`}
          subtext={`${100 - upiShare}% settled as store credit`}
          icon="chart"
        />
      </StatGrid>

      {/* Progress chips */}
      <div className="ret-progress-bar">
        {STEPS.map(([label, state], idx) => (
          <div className={`ret-step-chip ${state}`} key={label}>
            <div className="ret-step-chip-number">
              {state === 'completed' ? '✓' : idx + 1}
            </div>
            <div className="ret-step-chip-label">
              <small>Step {idx + 1} · {state === 'completed' ? 'completed' : state === 'active' ? 'in progress' : 'next'}</small>
              <strong>{label}</strong>
            </div>
          </div>
        ))}
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
                    {visibleOrders.map((entry) => (
                      <option key={entry.orderId} value={entry.orderId}>
                        {entry.orderNumber} · {entry.customerName}
                      </option>
                    ))}
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
      <Card title="Sales Returns Audit Log" subtitle="Search and filter through historical sales returns and refund settlements">
        <div className="returns-filter-bar">
          <Input
            aria-label="Search returns"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search return ID, order, customer, product..."
          />
          <Select
            aria-label="Return status"
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
          <Select
            aria-label="Refund status"
            value={filters.refundStatus}
            onChange={(e) => updateFilter('refundStatus', e.target.value)}
          >
            <option value="all">All refund statuses</option>
            <option value="Not Required">Not Required</option>
            <option value="Pending">Pending</option>
            <option value="Partially Refunded">Partially Refunded</option>
            <option value="Refunded">Refunded</option>
            <option value="Failed">Failed</option>
          </Select>
          <Select
            aria-label="Filter reason"
            value={filters.reason}
            onChange={(e) => updateFilter('reason', e.target.value)}
          >
            <option value="all">All reasons</option>
            {reasons.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
          <Select
            aria-label="Filter condition"
            value={filters.condition}
            onChange={(e) => updateFilter('condition', e.target.value)}
          >
            <option value="all">All conditions</option>
            {conditions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={filteredReturns}
          loading={loading}
          error={error}
          onRetry={refetch}
          emptyTitle="No returns found"
          emptyDescription={returns.length ? 'No returns match these filters.' : 'No sales returns recorded yet.'}
        />
      </Card>

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
