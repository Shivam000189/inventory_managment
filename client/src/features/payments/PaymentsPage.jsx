import { useCallback, useMemo, useState, useEffect } from 'react'
import {
  CreditCard,
  Receipt,
  ArrowUpRight,
  Clock,
  Search,
  Download,
  Printer,
  Plus,
  RotateCcw,
  Package,
} from 'lucide-react'
import { StatCard } from '../../dashboard/components/common/StatCard.tsx'
import { Badge } from '../../dashboard/components/common/Badge.tsx'
import { TableSkeleton } from '../../components/ui/Feedback.tsx'
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
  const [selectedReferenceId, setSelectedReferenceId] = useState('')
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

  const selectedOrder = useMemo(() => {
    if (!selectedReferenceId) return null
    return (
      orders.find(
        (item) => (item.orderId || item.purchaseOrderId) === selectedReferenceId
      ) || null
    )
  }, [orders, selectedReferenceId])

  const selectedPaid = useMemo(() => {
    if (!selectedReferenceId) return 0
    return getPaid(selectedReferenceId)
  }, [selectedReferenceId, getPaid])

  const selectedTotal = useMemo(() => {
    if (!selectedOrder) return 0
    return Number(selectedOrder.totalAmount || 0)
  }, [selectedOrder])

  const selectedOutstanding = useMemo(() => {
    return Math.max(0, selectedTotal - selectedPaid)
  }, [selectedTotal, selectedPaid])

  const handleOrderChange = (refId) => {
    setSelectedReferenceId(refId)
    const ord = orders.find((o) => (o.orderId || o.purchaseOrderId) === refId)
    if (ord) {
      const out = Math.max(0, Number(ord.totalAmount || 0) - getPaid(refId))
      if (out > 0) {
        setAmount(String(out))
      }
    }
  }

  const handleTypeSwitch = (newType) => {
    setType(newType)
    setSelectedReferenceId('')
    setAmount('')
  }

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

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [mode, type, search]);

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
    <div className="space-y-6 animate-in fade-in duration-150 pb-10" aria-labelledby="pay-title">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="pay-title" className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Payments
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Record customer sales inflows, manage vendor disbursements, and track real-time settlements.
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
            disabled={!payments.length}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EEE6DA] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 disabled:opacity-50"
          >
            <Download size={15} />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('pay-order-ref');
              if (el) {
                el.focus();
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
          >
            <Plus size={16} />
            <span>+ Record Payment</span>
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
          icon={<Receipt size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Today's Collections"
          value={money(stats.salesToday)}
          trend={`${stats.salesTxns} txns today`}
          isPositive={true}
        />
        <StatCard
          icon={<CreditCard size={18} strokeWidth={2} />}
          iconBgColor="bg-[#EBF2FA] text-[#2563EB]"
          label="Total Receipts"
          value={payments.length}
          trend={`${salesCount} sales · ${vendorCount} vendors`}
          isPositive={true}
        />
        <StatCard
          icon={<ArrowUpRight size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FAF6EF] text-[#6B665E]"
          label="Vendor Outflows"
          value={money(stats.purchasesOut)}
          trend={`${stats.vendorCount} vendors paid`}
          isPositive={true}
          onClick={() => setType('purchase')}
          className={type === 'purchase' ? 'ring-2 ring-[#7FAE82]' : ''}
        />
        <StatCard
          icon={<Clock size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FFF4DC] text-[#D98E0B]"
          label="Outstanding Dues"
          value={money(stats.duesTotal)}
          trend={`${stats.duesCount} open invoices`}
          isPositive={false}
          onClick={() => setType('sale')}
          className={type === 'sale' ? 'ring-2 ring-[#7FAE82]' : ''}
        />
      </div>

      {/* Record Payment Form Card */}
      <div className="bg-white rounded-2xl border border-[#EEE6DA] p-5 sm:p-6 shadow-2xs space-y-4">
        {/* Header with Icon, Title, and Segmented Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#EEE6DA]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E6F1E6] text-[#2E8B57] flex items-center justify-center shrink-0">
              <CreditCard size={20} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1C1B18]">Record Payment & Settle Invoice</h2>
              <p className="text-xs text-[#6B665E] mt-0.5">Entries immediately update financial ledgers and clear open invoice balances.</p>
            </div>
          </div>

          {/* Toggle Type Switcher */}
          <div className="flex items-center gap-1 bg-[#FAF6EF] p-1 rounded-xl border border-[#EEE6DA] shrink-0">
            <button
              type="button"
              onClick={() => handleTypeSwitch('sale')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                type === 'sale'
                  ? 'bg-white text-[#1C1B18] shadow-2xs border border-[#EEE6DA]'
                  : 'text-[#6B665E] hover:text-[#1C1B18]'
              }`}
            >
              Customer Inflow ({salesCount})
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('purchase')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                type === 'purchase'
                  ? 'bg-white text-[#1C1B18] shadow-2xs border border-[#EEE6DA]'
                  : 'text-[#6B665E] hover:text-[#1C1B18]'
              }`}
            >
              Vendor Outflow ({vendorCount})
            </button>
          </div>
        </div>

        {/* Selected Order Insight Bar */}
        {selectedOrder && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FAF6EF] border border-[#EEE6DA] text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="text-[#6B665E] font-medium">Selected: </span>
                <span className="font-semibold text-[#1C1B18]">{selectedOrder.orderNumber || selectedReferenceId}</span>
              </div>
              <div className="h-3 w-px bg-[#DDD5C7] hidden sm:block" />
              <div>
                <span className="text-[#6B665E] font-medium">{type === 'sale' ? 'Customer' : 'Vendor'}: </span>
                <span className="font-semibold text-[#1C1B18]">
                  {type === 'sale' ? (selectedOrder.customerName || 'Walk-in') : (selectedOrder.supplierName || 'Vendor')}
                </span>
              </div>
              <div className="h-3 w-px bg-[#DDD5C7] hidden sm:block" />
              <div>
                <span className="text-[#6B665E] font-medium">Invoice Total: </span>
                <span className="font-semibold text-[#1C1B18]">{money(selectedTotal)}</span>
              </div>
              <div className="h-3 w-px bg-[#DDD5C7] hidden sm:block" />
              <div>
                <span className="text-[#6B665E] font-medium">Already Settled: </span>
                <span className="font-semibold text-[#2E8B57]">{money(selectedPaid)}</span>
              </div>
              <div className="h-3 w-px bg-[#DDD5C7] hidden sm:block" />
              <div>
                <span className="text-[#6B665E] font-medium">Remaining Due: </span>
                <span className="font-bold text-[#C84B31]">{money(selectedOutstanding)}</span>
              </div>
            </div>

            {selectedOutstanding > 0 && Number(amount) !== selectedOutstanding && (
              <button
                type="button"
                onClick={() => setAmount(String(selectedOutstanding))}
                className="text-xs font-semibold text-[#2E8B57] hover:underline cursor-pointer flex items-center gap-1 shrink-0"
              >
                Auto-fill full due ({money(selectedOutstanding, 0)})
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 4 Perfectly Aligned Input Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-start">
            {/* Col 1: Order Select */}
            <div className="lg:col-span-5">
              <label htmlFor="pay-order-ref" className="block text-xs font-semibold text-[#1C1B18] mb-1.5">
                Select {type === 'sale' ? 'Sale Order / Invoice' : 'Purchase Order'} <span className="text-red-500">*</span>
              </label>
              <select
                id="pay-order-ref"
                name="referenceId"
                value={selectedReferenceId}
                onChange={(e) => handleOrderChange(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-[#EEE6DA] text-xs bg-white text-[#1C1B18] outline-none focus:border-[#7FAE82] transition-colors cursor-pointer"
              >
                <option value="" disabled>
                  Select {type} order…
                </option>
                {orders.map((order) => {
                  const id = order.orderId || order.purchaseOrderId;
                  const outstanding = Math.max(0, Number(order.totalAmount || 0) - getPaid(id));
                  return (
                    <option key={id} value={id}>
                      {order.orderNumber || id} · {type === 'sale' ? (order.customerName || 'Walk-in') : (order.supplierName || 'Vendor')} · due {money(outstanding, 0)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Col 2: Amount Received */}
            <div className="lg:col-span-3">
              <label htmlFor="pay-amount" className="block text-xs font-semibold text-[#1C1B18] mb-1.5">
                Amount Received <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6B665E]">₹</span>
                <input
                  id="pay-amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full h-10 pl-7 pr-3 rounded-xl border border-[#EEE6DA] text-xs font-bold text-[#1C1B18] outline-none focus:border-[#7FAE82] transition-colors"
                />
              </div>
            </div>

            {/* Col 3: Payment Method */}
            <div className="lg:col-span-2">
              <label htmlFor="pay-method" className="block text-xs font-semibold text-[#1C1B18] mb-1.5">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                id="pay-method"
                name="paymentMethod"
                defaultValue="UPI"
                className="w-full h-10 px-3 rounded-xl border border-[#EEE6DA] text-xs bg-white text-[#1C1B18] outline-none focus:border-[#7FAE82] transition-colors cursor-pointer"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Col 4: Payment Date */}
            <div className="lg:col-span-2">
              <label htmlFor="pay-date" className="block text-xs font-semibold text-[#1C1B18] mb-1.5">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                id="pay-date"
                name="paymentDate"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
                className="w-full h-10 px-3 rounded-xl border border-[#EEE6DA] text-xs text-[#1C1B18] bg-white outline-none focus:border-[#7FAE82] transition-colors"
              />
            </div>
          </div>

          {/* Bottom Action Row: Reference Notes + Quick Presets + Submit Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            <div className="flex-1 min-w-[240px]">
              <input
                id="pay-notes"
                name="notes"
                placeholder="Reference / Transaction notes (e.g. UPI-HDFC-9940291482 or Cheque #49201)"
                className="w-full h-10 px-3.5 rounded-xl border border-[#EEE6DA] text-xs text-[#1C1B18] placeholder:text-[#A39E93] bg-white outline-none focus:border-[#7FAE82] transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <span className="text-[11px] font-semibold text-[#6B665E]">Quick:</span>
              {[1000, 2000, 5000].map((quick) => (
                <button
                  type="button"
                  key={quick}
                  onClick={() => setAmount(String(quick))}
                  className="h-10 px-3 rounded-xl border border-[#EEE6DA] bg-[#FAF6EF] hover:bg-[#F2ECE1] text-xs font-semibold text-[#1C1B18] transition-all cursor-pointer active:scale-95"
                >
                  +{money(quick, 0)}
                </button>
              ))}

              <button
                type="submit"
                disabled={saving}
                className="h-10 inline-flex items-center justify-center gap-1.5 px-5 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 disabled:opacity-50 ml-1"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>{saving ? 'Recording…' : 'Record Payment →'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Toolbar matching Product Page */}
      <div className="bg-white rounded-2xl p-3 border border-[#EEE6DA] flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-2.5 text-[#9A948A]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipts, party/customer, or notes..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs focus:border-[#7FAE82] outline-none"
            />
          </div>

          {/* Type Dropdown */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#EEE6DA] text-xs text-[#1C1B18] bg-white cursor-pointer outline-none"
          >
            <option value="sale">Customer Inflows</option>
            <option value="purchase">Vendor Outflows</option>
          </select>
        </div>

        {/* Mode Pills */}
        <div className="flex items-center gap-1 bg-[#FAF6EF] p-1 rounded-xl border border-[#EEE6DA]/80 overflow-x-auto w-full md:w-auto">
          {MODE_TABS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                mode === m.id
                  ? 'bg-white text-[#1C1B18] shadow-2xs'
                  : 'text-[#6B665E] hover:text-[#1C1B18]'
              }`}
            >
              {m.label} ({payments.filter(m.match).length})
            </button>
          ))}
        </div>
      </div>

      {/* Table matching Product Page */}
      {loading && payments.length === 0 ? (
        <TableSkeleton
          columns={[
            { title: 'Receipt ID', width: '15%' },
            { title: 'Party / Customer', width: '25%' },
            { title: 'Date & Mode', width: '15%' },
            { title: 'Reference / Notes', width: '20%' },
            { title: 'Amount', width: '15%', align: 'right' },
            { title: 'Status', width: '10%', align: 'center' },
          ]}
          rows={6}
        />
      ) : visiblePayments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EEE6DA] p-12 text-center shadow-2xs">
          <Package className="mx-auto text-[#9A948A] mb-3 opacity-60" size={36} />
          <h3 className="text-sm font-semibold text-[#1C1B18]">No payments found</h3>
          <p className="text-xs text-[#6B665E] mt-1 max-w-sm mx-auto">
            {payments.length ? 'No payments match your search filter.' : 'No payments recorded yet. Settle an invoice above to start the ledger.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#EEE6DA] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="sticky top-0 z-10 bg-[#FAF6EF] border-b border-[#EEE6DA] text-[#8C867A] text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-medium">Receipt ID</th>
                  <th className="py-3 px-3 font-medium">Party / Customer</th>
                  <th className="py-3 px-3 font-medium">Date & Mode</th>
                  <th className="py-3 px-3 font-medium">Notes / Ref</th>
                  <th className="py-3 px-3 font-medium text-right">Amount</th>
                  <th className="py-3 px-3 font-medium text-center">Status</th>
                  <th className="py-3 px-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6DA]/80">
                {paginatedPayments.map((payment) => {
                  const info = orderName(payment.referenceId);
                  const isSale = payment.type === 'sale';

                  return (
                    <tr
                      key={payment.paymentId || Math.random()}
                      className="hover:bg-[#FAF6EF]/60 transition-colors group cursor-pointer"
                      onClick={() => window.print()}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1C1B18] text-[13px] group-hover:text-[#6C9C70] transition-colors">
                          #RCP-{payment.paymentId?.slice(-6).toUpperCase() || 'PAY'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#1C1B18] text-[13px]">{info.entity}</div>
                        <div className="text-[11px] text-[#9A948A]">
                          Ref: {info.ref || 'Direct'} {info.gstin ? `· GSTIN ${info.gstin}` : ''}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-[#1C1B18] text-xs">
                          {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] font-medium text-[#2563EB]">
                          {payment.paymentMethod}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-[#6B665E]">
                        {payment.transactionReference || payment.notes || '—'}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div
                          className={`font-bold text-sm tabular-nums ${
                            isSale ? 'text-[#2E8B57]' : 'text-[#D64545]'
                          }`}
                        >
                          {isSale ? '+ ' : '− '}
                          {money(payment.amount)}
                        </div>
                        <div className="text-[11px] text-[#9A948A]">
                          {isSale ? 'Customer Inflow' : 'Vendor Outflow'}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <Badge variant={isSale ? 'success' : 'info'}>
                          {isSale ? 'Paid' : 'Vendor Paid'}
                        </Badge>
                      </td>

                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="p-1.5 rounded-lg text-[#6B665E] hover:text-[#1C1B18] hover:bg-[#FAF6EF] transition-colors cursor-pointer"
                            title="Print Receipt"
                            aria-label="Print Receipt"
                          >
                            <Printer size={15} />
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
                Showing {Math.min((currentPage - 1) * pageSize + 1, visiblePayments.length)} to{' '}
                {Math.min(currentPage * pageSize, visiblePayments.length)} of {visiblePayments.length} payments
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
  );
}

export default Payments;
