import { useCallback, useMemo, useState } from 'react'
import { paymentApi } from '../../api/paymentApi.js'
import { salesOrderApi } from '../../api/salesOrderApi.js'
import { purchaseOrderApi } from '../../api/purchaseOrderApi.js'
import { useResource } from '../../hooks/useResource.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Field, Input, Select } from '../../components/ui/FormControls.jsx'
import { Icon } from '../../components/ui/icons.jsx'
import './PaymentsPage.css'

const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const METHODS = ['Cash', 'UPI', 'Card', 'Bank transfer', 'Credit', 'Other']

const MODE_TABS = [
  { id: 'all', label: 'All Modes', match: () => true },
  { id: 'UPI', label: 'UPI', match: (p) => p.paymentMethod === 'UPI' },
  { id: 'Cash', label: 'Cash', match: (p) => p.paymentMethod === 'Cash' },
  { id: 'Card', label: 'Card', match: (p) => /card/i.test(p.paymentMethod) },
  { id: 'Bank', label: 'Bank', match: (p) => /bank/i.test(p.paymentMethod) },
]

function Payments({ business = {}, account = {} }) {
  const load = useCallback(
    () => Promise.all([paymentApi.list(), salesOrderApi.list(), purchaseOrderApi.list()]),
    []
  )
  const { data, loading, error, refetch, setData } = useResource(load, [], [[], [], []])
  const [payments, salesOrders, purchaseOrders] = data

  const [type, setType] = useState('sale')
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('all')
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  const currency = business?.currency || 'INR'
  const money = (value, dp = 2) => {
    const n = Number(value || 0)
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: dp,
        maximumFractionDigits: dp,
      }).format(n)
    } catch {
      return `${currency} ${n.toLocaleString('en-IN', {
        minimumFractionDigits: dp,
        maximumFractionDigits: dp,
      })}`
    }
  }

  const orders = type === 'sale' ? salesOrders : purchaseOrders

  const getPaid = useCallback(
    (referenceId) =>
      payments
        .filter((payment) => payment.referenceId === referenceId)
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [payments]
  )

  const orderName = (referenceId) => {
    const sale = salesOrders.find((order) => order.orderId === referenceId)
    if (sale)
      return {
        entity: sale.customerName || 'Walk-in customer',
        ref: sale.orderNumber,
        gstin: sale.customerSnapshot?.gstin,
      }
    const po = purchaseOrders.find((order) => order.purchaseOrderId === referenceId)
    if (po) return { entity: po.supplierName || 'Vendor', ref: po.orderNumber }
    return { entity: referenceId, ref: '' }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    const form = event.currentTarget
    const formData = new FormData(form)
    const referenceId = formData.get('referenceId')
    const order = orders.find(
      (item) => item.orderId === referenceId || item.purchaseOrderId === referenceId
    )
    const value = Number(formData.get('amount'))
    const paid = getPaid(referenceId)
    if (!order || !value || value <= 0 || paid + value > order.totalAmount + 0.01) {
      setMessage({
        type: 'error',
        text: 'Enter a valid payment that does not exceed the outstanding balance.',
      })
      return
    }
    setSaving(true)
    try {
      await paymentApi.create({
        type,
        referenceId,
        amount: value,
        paymentMethod: formData.get('paymentMethod'),
        paymentDate: formData.get('paymentDate'),
        notes: (formData.get('notes') || '').trim(),
      })
      const [freshPayments, freshSales, freshPurchases] = await Promise.all([
        paymentApi.list(),
        salesOrderApi.list(),
        purchaseOrderApi.list(),
      ])
      setData([freshPayments, freshSales, freshPurchases])
      setMessage({
        type: 'success',
        text: `${money(value)} payment recorded and posted to the ledger.`,
      })
      setAmount('')
      form.reset()
    } catch (caught) {
      setMessage({
        type: 'error',
        text: caught.message || 'Could not record the payment.',
      })
    } finally {
      setSaving(false)
    }
  }

  const stats = useMemo(() => {
    const today = startOfToday()
    const yesterday = new Date(today.getTime() - 864e5)
    const isToday = (payment) =>
      new Date(payment.paymentDate || payment.createdAt) >= today
    const salesToday = payments
      .filter((payment) => payment.type === 'sale' && isToday(payment))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const salesYesterday = payments
      .filter((payment) => {
        if (payment.type !== 'sale') return false
        const at = new Date(payment.paymentDate || payment.createdAt)
        return at >= yesterday && at < today
      })
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const purchasePayments = payments.filter((payment) => payment.type === 'purchase')
    const purchasesOut = purchasePayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    )
    const vendorCount = new Set(purchasePayments.map((payment) => payment.referenceId))
      .size
    const dues = salesOrders
      .filter((order) => order.status !== 'Cancelled')
      .map((order) => Number(order.totalAmount || 0) - getPaid(order.orderId))
      .filter((value) => value > 0.5)
    const cashToday = payments
      .filter(
        (payment) =>
          payment.paymentMethod === 'Cash' &&
          payment.type === 'sale' &&
          isToday(payment)
      )
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    return {
      salesToday,
      salesTxns: payments.filter((payment) => payment.type === 'sale' && isToday(payment))
        .length,
      salesDelta: salesYesterday
        ? Math.round(((salesToday - salesYesterday) / salesYesterday) * 100)
        : null,
      purchasesOut,
      vendorCount,
      duesTotal: dues.reduce((sum, value) => sum + value, 0),
      duesCount: dues.length,
      cashDrawer: cashToday,
    }
  }, [payments, salesOrders, getPaid])

  const visiblePayments = useMemo(() => {
    const matchMode =
      MODE_TABS.find((option) => option.id === mode)?.match || (() => true)
    return payments.filter(matchMode)
  }, [payments, mode])


  const exportCsv = () => {
    const escapeCell = (value) => {
      const t = String(value ?? '')
      const s = /^[=+@\-\t\r]/.test(t) ? `'${t}` : t
      return `"${s.replaceAll('"', '""')}"`
    }
    const rows = [
      ['Receipt', 'Type', 'Entity', 'Ref order', 'Method', 'Reference note', 'Amount', 'Date'],
      ...visiblePayments.map((payment) => {
        const info = orderName(payment.referenceId)
        return [
          payment.paymentId?.slice(-8).toUpperCase(),
          payment.type,
          info.entity,
          info.ref,
          payment.paymentMethod,
          payment.transactionReference || payment.notes,
          payment.amount,
          payment.paymentDate ||
            new Date(payment.createdAt).toLocaleDateString('en-GB'),
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
    link.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }


  const columns = [
    {
      key: 'paymentId',
      header: 'Id',
      priority: 'high',
      mobileLabel: 'Id',
      render: (payment) => (
        <span className="ledger-cell-id">
          #RCP-{payment.paymentId?.slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Party / Customer',
      priority: 'high',
      mobileLabel: 'Party',
      render: (payment) => {
        const info = orderName(payment.referenceId)
        return (
          <div>
            <div className="ledger-cell-primary">{info.entity}</div>
            <div className="ledger-cell-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>
              Ref: {info.ref || 'Direct'} {info.gstin ? `· GSTIN ${info.gstin}` : ''}
            </div>
          </div>
        )
      },
    },
    {
      key: 'dateMethod',
      header: 'Date & Mode',
      priority: 'medium',
      mobileLabel: 'Mode',
      render: (payment) => (
        <div>
          <div className="ledger-cell-secondary">
            {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          <div className="ledger-cell-secondary" style={{ fontSize: '11px', marginTop: '2px', color: '#0084ff', fontWeight: 600 }}>
            {payment.paymentMethod}
          </div>
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Notes / Ref',
      priority: 'low',
      mobileLabel: 'Notes',
      render: (payment) => (
        <span className="ledger-cell-secondary">
          {payment.transactionReference || payment.notes || '—'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Total Cost',
      priority: 'high',
      align: 'right',
      mobileLabel: 'Amount',
      render: (payment) => (
        <div style={{ textAlign: 'right' }}>
          <span className="ledger-cell-cost" style={{ color: payment.type === 'sale' ? '#10b981' : '#ef4444' }}>
            {payment.type === 'sale' ? '+ ' : '− '}
            {money(payment.amount)}
          </span>
          <div className="ledger-cell-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>
            {payment.type === 'sale' ? 'Customer Inflow' : 'Vendor Outflow'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      priority: 'high',
      align: 'center',
      mobileLabel: 'Status',
      render: (payment) => (
        <span className={`ledger-status-pill ${payment.type === 'sale' ? 'status-delivered' : 'status-shipped'}`}>
          {payment.type === 'sale' ? 'Paid' : 'Vendor Paid'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      priority: 'high',
      align: 'right',
      mobileLabel: 'Action',
      render: () => (
        <div className="ledger-actions-group" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="ledger-action-icon action-view"
            onClick={() => window.print()}
            title="Print Receipt"
            aria-label="Print Receipt"
          >
            <Icon name="print" size={17} />
          </button>
        </div>
      ),
    },
  ]

  const salesCount = payments.filter((payment) => payment.type === 'sale').length
  const vendorCount = payments.filter((payment) => payment.type === 'purchase').length

  return (
    <section className="pay-page" aria-labelledby="pay-title">
      <PageHeader
        kicker="Terminal • Payments &amp; Settlement Control"
        title="Payments Management"
        description="Record customer sales inflows, manage vendor disbursements, and track real-time settlements."
        scope="Counter #01 Online"
        actions={
          <div className="pay-type-switch">
            <button
              type="button"
              className={type === 'sale' ? 'active' : ''}
              onClick={() => setType('sale')}
            >
              Sales payments <b>{salesCount}</b>
            </button>
            <button
              type="button"
              className={type === 'purchase' ? 'active' : ''}
              onClick={() => setType('purchase')}
            >
              Vendor outflow <b>{vendorCount}</b>
            </button>
          </div>
        }
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
          className={`ledger-kpi-card theme-blue ${type === 'sale' ? 'is-active' : ''}`}
          onClick={() => setType('sale')}
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="list" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Total</span>
            <span className="ledger-kpi-val">{payments.length} Invoices</span>
          </div>
        </div>

        <div
          className={`ledger-kpi-card theme-slate ${type === 'purchase' ? 'is-active' : ''}`}
          onClick={() => setType('purchase')}
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="credit-card" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Shipped</span>
            <span className="ledger-kpi-val">{stats.vendorCount} Vendors</span>
          </div>
        </div>

        <div
          className="ledger-kpi-card theme-green"
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="dollar" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Delivered</span>
            <span className="ledger-kpi-val">{money(stats.salesToday)}</span>
          </div>
        </div>

        <div
          className={`ledger-kpi-card theme-amber ${stats.duesTotal > 0 ? 'is-active' : ''}`}
          role="button"
          tabIndex={0}
        >
          <div className="ledger-kpi-bubble">
            <Icon name="pending" size={20} />
          </div>
          <div className="ledger-kpi-content">
            <span className="ledger-kpi-label">Pending</span>
            <span className="ledger-kpi-val">{money(stats.duesTotal)}</span>
          </div>
        </div>
      </div>

      {/* Record Payment Entry Card */}
      <div className="pay-form-card">
        <div className="pay-form-head">
          <div className="pay-form-title-wrap">
            <span className="pay-form-dot" />
            <strong>Record Payment &amp; Settle Invoice</strong>
            <em>Quick terminal entry</em>
          </div>
          <span className="pay-form-note">
            Entries instantly update ledgers and release inventory holds.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="pay-form-body">
          <Field
            label={`Select ${type === 'sale' ? 'Sale Order / Invoice' : 'Purchase Order'} *`}
            htmlFor="pay-order-ref"
            required
            hint="Only orders with an open balance can accept a payment."
          >
            <Select id="pay-order-ref" name="referenceId" defaultValue="" required>
              <option value="" disabled>
                Select {type} order…
              </option>
              {orders.map((order) => {
                const id = order.orderId || order.purchaseOrderId
                const outstanding = Number(order.totalAmount || 0) - getPaid(id)
                return (
                  <option key={id} value={id}>
                    {order.orderNumber || id} ·{' '}
                    {type === 'sale' ? order.customerName : order.supplierName} · due{' '}
                    {money(outstanding, 0)}
                  </option>
                )
              })}
            </Select>
          </Field>

          <Field
            label="Amount Received *"
            htmlFor="pay-amount"
            required
          >
            <Input
              id="pay-amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
            <div className="pay-quick-chips">
              {[1000, 2000, 5000].map((quick) => (
                <button
                  type="button"
                  key={quick}
                  className="pay-quick-chip"
                  onClick={() => setAmount(String(quick))}
                >
                  {money(quick, 0)}
                </button>
              ))}
            </div>
          </Field>

          <Field
            label="Payment Method *"
            htmlFor="pay-method"
            required
            hint="UPI & bank transfers settle instantly with zero fee."
          >
            <Select id="pay-method" name="paymentMethod" defaultValue="UPI">
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Payment Date *"
            htmlFor="pay-date"
            required
            hint="Defaults to the active register timestamp."
          >
            <Input
              id="pay-date"
              name="paymentDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </Field>

          <Field
            label="Payment Reference / Notes"
            htmlFor="pay-notes"
            className="pay-field-full"
          >
            <Input
              id="pay-notes"
              name="notes"
              placeholder="e.g. UPI-HDFC-9940291482 or Cheque #49201"
            />
          </Field>

          <div className="pay-form-submit-row">
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={saving}
              loading={saving}
            >
              {saving ? 'Recording…' : 'Record Payment →'}
            </Button>
          </div>
        </form>
      </div>

      {/* Payment Ledger / History */}
      {/* Pill Search & Action Toolbar */}
      <div className="ledger-toolbar">
        <div className="ledger-toolbar-left">
          <select
            className="ledger-pill-select"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            {MODE_TABS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} ({payments.filter(m.match).length})
              </option>
            ))}
          </select>

          <select
            className="ledger-pill-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="sale">Customer Inflows</option>
            <option value="purchase">Vendor Outflows</option>
          </select>
        </div>

        <div className="ledger-toolbar-right">
          <button
            type="button"
            className="ledger-btn-secondary"
            onClick={exportCsv}
            disabled={!payments.length}
          >
            <Icon name="download" size={15} />
            <span>Export</span>
          </button>
          <button
            type="button"
            className="ledger-btn-secondary"
            onClick={() => window.print()}
          >
            <Icon name="print" size={15} />
            <span>Print Slips</span>
          </button>
          <button
            type="button"
            className="ledger-btn-secondary"
            onClick={refetch}
            disabled={loading}
          >
            <Icon name="refresh" size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={visiblePayments}
        keyField="paymentId"
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyMessage={
          payments.length
            ? 'No payments found for this payment mode.'
            : 'No payments recorded yet. Settle an invoice above to start the ledger.'
        }
        pagination
        pageSize={10}
      />

      <footer className="pay-statusbar">
        <span><i />Stockroom OS · Settlement Control</span>
        <span>Cashier: {account?.name || account?.email || 'Operator'}</span>
        <span>
          {visiblePayments.length} of {payments.length} ledger entries
        </span>
        <span className="pay-statusbar-suite">Enterprise Retail OS</span>
      </footer>
    </section>
  )
}

export default Payments
