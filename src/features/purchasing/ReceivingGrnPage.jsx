import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { receivingApi } from '../../api/receivingApi.js'
import { useResource } from '../../hooks/useResource.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { StatGrid, StatCard, Card } from '../../components/ui/Card.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Field, Input, Select, Textarea } from '../../components/ui/FormControls.jsx'
import { FormStatus } from '../../components/ui/Feedback.jsx'
import { Toolbar } from '../../components/ui/Toolbar.jsx'
import './ReceivingGrnPage.css'

function GrnLocalIcon({ name }) {
  const paths = {
    inbound: <><path d="M12 3v11m-4-4 4 4 4-4" /><path d="M4 17v3h16v-3" /></>,
    export: <><path d="M12 3v12m-4-4 4 4 4-4" /><path d="M5 17v3h14v-3" /></>,
    scan: <><path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3" /><path d="M4 12h16" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8.4 12 2.4 2.4 4.8-5.4" /></>,
    box: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="M4 7.5 12 12m0 9V12m8-4.5L12 12" /></>,
    gauge: <><path d="M12 13 16 9" /><path d="M4 18a8 8 0 1 1 16 0" /></>,
    clipboard: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1M9 11h6M9 15h4" /></>,
    arrow: <path d="M4 12h15m-5-5 5 5-5 5" />,
    minus: <path d="M5 12h14" />,
    plus: <path d="M12 5v14M5 12h14" />,
    printer: <><path d="M7 8V3h10v5M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z" /></>,
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

const DOCK_BAYS = ['Bay 01 - Ambient', 'Bay 02 - Cold storage', 'Bay 03 - Bulk / pallet', 'Bay 04 - Returns dock']
const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function Receiving({ business, account, onNavigate }) {
  const load = useCallback(() => Promise.all([receivingApi.pendingOrders(), receivingApi.list()]), [])
  const { data, loading, error, setData } = useResource(load, [], [[], []])
  const [pendingOrders, receivings] = data

  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [lines, setLines] = useState([])
  const [challan, setChallan] = useState('')
  const [dockBay, setDockBay] = useState(DOCK_BAYS[0])
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const orderSelectRef = useRef(null)

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

  const getPoId = (order) => order?.purchaseOrderId || order?.poId || ''

  const selectedOrder = pendingOrders.find((order) => getPoId(order) === selectedOrderId)

  const buildLines = (order) =>
    (order.lines || order.items || []).map((line) => ({
      productId: line.productId,
      productName: line.productName || line.name || 'Unknown item',
      variantSku: line.variantSku || line.sku || '',
      orderedQuantity: Number(line.orderedQuantity || line.quantity || 0),
      alreadyReceived: Number(line.alreadyReceived || 0),
      receivedQuantity: Math.max(0, Number(line.orderedQuantity || line.quantity || 0) - Number(line.alreadyReceived || 0)),
      damagedQuantity: 0,
      rejectedQuantity: 0,
      batchNumber: '',
      expiryDate: '',
    }))

  const selectOrder = (orderId) => {
    const order = pendingOrders.find((item) => getPoId(item) === orderId)
    setSelectedOrderId(orderId)
    setMessage(null)
    setLines(order ? buildLines(order) : [])
  }

  const updateLine = (index, field, value) =>
    setLines((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, [field]: value } : line)),
    )

  const stepQty = (index, delta) =>
    setLines((current) =>
      current.map((line, lineIndex) => {
        if (lineIndex !== index) return line
        const remaining = line.orderedQuantity - line.alreadyReceived
        return {
          ...line,
          receivedQuantity: Math.max(0, Math.min(remaining, Number(line.receivedQuantity || 0) + delta)),
        }
      }),
    )

  const acceptAllAsOrdered = () =>
    selectedOrder &&
    setLines((current) =>
      current.map((line) => ({
        ...line,
        receivedQuantity: line.orderedQuantity - line.alreadyReceived,
        damagedQuantity: 0,
        rejectedQuantity: 0,
      })),
    )

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    if (!selectedOrder) {
      setMessage({ type: 'error', text: 'Select a purchase order first.' })
      return
    }
    const invalid = lines.find((line) => {
      const remaining = line.orderedQuantity - line.alreadyReceived
      return (
        Number(line.receivedQuantity) < 0 ||
        Number(line.receivedQuantity) > remaining ||
        Number(line.damagedQuantity) < 0 ||
        Number(line.rejectedQuantity) < 0 ||
        Number(line.damagedQuantity) + Number(line.rejectedQuantity) > Number(line.receivedQuantity)
      )
    })
    if (invalid) {
      setMessage({
        type: 'error',
        text: 'Check received quantities. They cannot exceed the remaining ordered quantity, and damaged/rejected quantities cannot exceed received quantity.',
      })
      return
    }

    setSaving(true)
    try {
      const form = event.currentTarget
      const userNotes = (new FormData(form).get('notes') || '').trim()
      const context = [challan.trim() && `Challan ${challan.trim()}`, dockBay].filter(Boolean).join(' · ')
      const payload = {
        purchaseOrderId: selectedOrder.purchaseOrderId,
        notes: [context, userNotes].filter(Boolean).join(' — '),
        items: lines.map((line) => ({
          productId: line.productId,
          receivedQuantity: Number(line.receivedQuantity),
          damagedQuantity: Number(line.damagedQuantity),
          rejectedQuantity: Number(line.rejectedQuantity),
          batchNumber: (line.batchNumber || '').trim(),
          expiryDate: line.expiryDate,
        })),
      }
      const receiving = await receivingApi.create(payload)
      const [freshPending, freshHistory] = await Promise.all([receivingApi.pendingOrders(), receivingApi.list()])
      setData([freshPending, freshHistory])
      setSelectedOrderId('')
      setLines([])
      setChallan('')
      setMessage({ type: 'success', text: `GRN ${receiving.receivingId} posted. Accepted stock was added to inventory.` })
      form.reset()
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not record the receiving.' })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const handler = (event) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return
      if (event.key === 'F2') {
        event.preventDefault()
        orderSelectRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const stats = useMemo(() => {
    const today = startOfToday()
    const remainingUnits = pendingOrders.reduce(
      (sum, order) =>
        sum +
        (order.lines || order.items || []).reduce(
          (n, line) => n + Math.max(0, (line.orderedQuantity || line.quantity || 0) - (line.alreadyReceived || 0)),
          0,
        ),
      0,
    )
    const uniqueSkus = new Set(
      pendingOrders.flatMap((order) => (order.lines || order.items || []).map((line) => line.productId)),
    ).size
    const expectedValue = pendingOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
    const lateTrucks = pendingOrders.filter(
      (order) => order.expectedDeliveryDate && new Date(order.expectedDeliveryDate) < today,
    ).length
    const allItems = receivings.flatMap((receiving) => receiving.items || [])
    const received = allItems.reduce((sum, item) => sum + Number(item.receivedQuantity || 0), 0)
    const accepted = allItems.reduce((sum, item) => sum + Number(item.acceptedQuantity || 0), 0)
    const rejected = allItems.reduce(
      (sum, item) => sum + Number(item.rejectedQuantity || 0) + Number(item.damagedQuantity || 0),
      0,
    )
    const todayReceivings = receivings.filter((receiving) => new Date(receiving.receivedAt) >= today)
    const acceptedToday = todayReceivings
      .flatMap((receiving) => receiving.items || [])
      .reduce((sum, item) => sum + Number(item.acceptedQuantity || 0), 0)
    const days = new Set(receivings.map((receiving) => new Date(receiving.receivedAt).toDateString())).size || 1
    const avgPerDay = receivings.length / days
    const deltaVsAvg = avgPerDay ? Math.round(((todayReceivings.length - avgPerDay) / avgPerDay) * 100) : null

    return {
      pendingCount: pendingOrders.length,
      lateTrucks,
      remainingUnits,
      uniqueSkus,
      expectedValue,
      passRate: received ? (accepted / received) * 100 : 100,
      rejected,
      inspectedReceipts: receivings.length,
      completedToday: todayReceivings.length,
      acceptedToday,
      deltaVsAvg,
    }
  }, [pendingOrders, receivings])

  const currentStep = selectedOrder ? 2 : 1
  const STEPS = [
    { n: 1, title: 'Select PO', hint: 'Choose supplier order & dock bay' },
    { n: 2, title: 'Check & scan items', hint: 'Count boxes, verify batch & expiry' },
    { n: 3, title: 'Post to stock', hint: 'Generate GRN & update inventory' },
  ]

  const lineStatus = (line) => {
    const remaining = line.orderedQuantity - line.alreadyReceived
    const received = Number(line.receivedQuantity || 0)
    const flagged = Number(line.damagedQuantity || 0) + Number(line.rejectedQuantity || 0)
    if (received === 0) return { label: 'Not checked', tone: 'neutral' }
    if (flagged > 0) return { label: 'Damage logged', tone: 'danger' }
    if (received < remaining) return { label: 'Short receipt', tone: 'warning' }
    return { label: 'All good · verified', tone: 'success' }
  }

  const exportCsv = () => {
    const escapeCell = (value) => {
      const text = String(value ?? '')
      const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text
      return `"${safe.replaceAll('"', '""')}"`
    }
    const rows = [
      ['GRN', 'Purchase Order', 'Products', 'Received', 'Accepted', 'Damaged', 'Rejected', 'Received At', 'Received By'],
      ...receivings.map((receiving) => [
        receiving.receivingId,
        receiving.purchaseOrderId,
        receiving.items?.length || 0,
        receiving.items?.reduce((sum, item) => sum + Number(item.receivedQuantity || 0), 0) || 0,
        receiving.items?.reduce((sum, item) => sum + Number(item.acceptedQuantity || 0), 0) || 0,
        receiving.items?.reduce((sum, item) => sum + Number(item.damagedQuantity || 0), 0) || 0,
        receiving.items?.reduce((sum, item) => sum + Number(item.rejectedQuantity || 0), 0) || 0,
        new Date(receiving.receivedAt).toLocaleString('en-GB'),
        receiving.receivedBy,
      ]),
    ]
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `grn-history-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const visibleHistory = useMemo(
    () =>
      receivings.filter((receiving) =>
        `${receiving.receivingId} ${receiving.purchaseOrderId} ${receiving.supplierId}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [receivings, search],
  )

  const manifestColumns = useMemo(
    () => [
      {
        key: 'product',
        header: 'Product & SKU',
        render: (line) => (
          <div>
            <strong>{line.productName}</strong>
            <small style={{ display: 'block', color: 'var(--text-soft)', fontSize: 'var(--fs-xs)' }}>
              {line.variantSku || 'SKU on file'}
              {line.alreadyReceived > 0 ? ` · ${line.alreadyReceived} received earlier` : ''}
            </small>
          </div>
        ),
      },
      {
        key: 'orderedQuantity',
        header: 'Ordered',
        align: 'right',
        render: (line) => (
          <div style={{ textAlign: 'right' }}>
            <strong>{line.orderedQuantity}</strong>
            <small style={{ display: 'block', color: 'var(--text-soft)', fontSize: 'var(--fs-xs)' }}>ordered</small>
          </div>
        ),
      },
      {
        key: 'receivedQuantity',
        header: 'Received Qty',
        render: (line, idx) => {
          const remaining = line.orderedQuantity - line.alreadyReceived
          const received = Number(line.receivedQuantity || 0)
          return (
            <div>
              <div className="grn-stepper">
                <button type="button" aria-label="Decrease" onClick={() => stepQty(idx, -1)}>
                  <GrnLocalIcon name="minus" />
                </button>
                <input
                  aria-label={`${line.productName} received quantity`}
                  type="number"
                  min="0"
                  max={remaining}
                  value={line.receivedQuantity}
                  onChange={(event) => updateLine(idx, 'receivedQuantity', event.target.value)}
                />
                <button type="button" aria-label="Increase" onClick={() => stepQty(idx, 1)}>
                  <GrnLocalIcon name="plus" />
                </button>
              </div>
              <small style={{ display: 'block', color: 'var(--text-soft)', fontSize: 'var(--fs-xs)', marginTop: 2 }}>
                {received === remaining ? 'Exact match' : `of ${remaining} remaining`}
              </small>
            </div>
          )
        },
      },
      {
        key: 'accepted',
        header: 'Accepted / Shortage',
        render: (line, idx) => {
          const remaining = line.orderedQuantity - line.alreadyReceived
          const received = Number(line.receivedQuantity || 0)
          const accepted = Math.max(0, received - Number(line.damagedQuantity || 0) - Number(line.rejectedQuantity || 0))
          const shortage = Math.max(0, remaining - received)
          return (
            <div className="grn-accept">
              <strong style={{ color: shortage > 0 ? 'var(--warning)' : 'var(--success)' }}>
                {accepted} accepted
              </strong>
              <label>
                Damaged
                <input
                  type="number"
                  min="0"
                  value={line.damagedQuantity}
                  onChange={(event) => updateLine(idx, 'damagedQuantity', event.target.value)}
                />
              </label>
              <label>
                Rejected
                <input
                  type="number"
                  min="0"
                  value={line.rejectedQuantity}
                  onChange={(event) => updateLine(idx, 'rejectedQuantity', event.target.value)}
                />
              </label>
              <small style={{ color: 'var(--text-soft)' }}>{shortage > 0 ? `${shortage} short` : 'No shortage'}</small>
            </div>
          )
        },
      },
      {
        key: 'batchExpiry',
        header: 'Batch & Expiry',
        render: (line, idx) => (
          <div>
            <input
              className="grn-batch"
              aria-label={`${line.productName} batch number`}
              value={line.batchNumber}
              onChange={(event) => updateLine(idx, 'batchNumber', event.target.value)}
              placeholder="Batch / lot #"
            />
            <input
              className="grn-expiry"
              aria-label={`${line.productName} expiry date`}
              type="date"
              value={line.expiryDate}
              onChange={(event) => updateLine(idx, 'expiryDate', event.target.value)}
            />
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Inspection',
        render: (line) => {
          const st = lineStatus(line)
          return <Badge tone={st.tone}>{st.label}</Badge>
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lines],
  )

  const historyColumns = useMemo(
    () => [
      {
        key: 'receivingId',
        header: 'GRN ID',
        render: (r) => {
          const flagged = (r.items || []).reduce(
            (sum, item) => sum + Number(item.damagedQuantity || 0) + Number(item.rejectedQuantity || 0),
            0,
          )
          return (
            <div>
              <strong>{r.receivingId}</strong>
              <Badge tone={flagged > 0 ? 'warning' : 'success'} style={{ marginTop: 4 }}>
                {flagged > 0 ? 'Posted with flags' : 'Posted clean'}
              </Badge>
            </div>
          )
        },
      },
      {
        key: 'purchaseOrderId',
        header: 'PO Reference',
        render: (r) => (
          <div>
            <strong>PO {r.purchaseOrderId}</strong>
            <small style={{ display: 'block', color: 'var(--text-soft)', fontSize: 'var(--fs-xs)' }}>
              {r.items?.length || 0} lines · {r.receivedBy || 'Receiver'}
            </small>
          </div>
        ),
      },
      {
        key: 'receivedAt',
        header: 'Received At',
        render: (r) => (
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text)' }}>
            {new Date(r.receivedAt).toLocaleString('en-GB')}
          </span>
        ),
      },
      {
        key: 'summary',
        header: 'Accepted Quantity',
        align: 'right',
        render: (r) => {
          const accepted = (r.items || []).reduce((sum, item) => sum + Number(item.acceptedQuantity || 0), 0)
          const flagged = (r.items || []).reduce(
            (sum, item) => sum + Number(item.damagedQuantity || 0) + Number(item.rejectedQuantity || 0),
            0,
          )
          return (
            <div style={{ textAlign: 'right' }}>
              <strong style={{ color: 'var(--text)' }}>{accepted.toLocaleString('en-IN')} accepted</strong>
              {flagged > 0 && (
                <small style={{ display: 'block', color: 'var(--warning)', fontSize: 'var(--fs-xs)' }}>
                  {flagged} flagged
                </small>
              )}
            </div>
          )
        },
      },
    ],
    [],
  )

  return (
    <section className="grn-page" aria-labelledby="grn-title">
      <PageHeader
        kicker="Manage your inward logistics • Dock & GRN control"
        title="Receiving & Inward Goods Inspection"
        badge={<Badge tone="success">{stats.pendingCount} awaiting unload</Badge>}
        subtitle="Inspect deliveries against active purchase orders, verify vendor challans, audit expiry dates, and commit Goods Received Notes directly to inventory."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<GrnLocalIcon name="inbound" />}
              onClick={() => onNavigate?.('Stock In')}
            >
              Direct Inward (No PO)
            </Button>
            <Button
              variant="secondary"
              icon={<GrnLocalIcon name="export" />}
              onClick={exportCsv}
              disabled={loading || !!error || !receivings.length}
            >
              Export GRN CSV
            </Button>
            <Button
              variant="primary"
              icon={<GrnLocalIcon name="scan" />}
              onClick={() => orderSelectRef.current?.focus()}
            >
              Scan Waybill
            </Button>
          </>
        }
      />

      {message && <FormStatus status={message.type} message={message.text} />}

      <div className="grn-workflow">
        <div className="grn-workflow-head">
          <span className="grn-workflow-tag">Workflow Guide</span>
          <strong>Floor receiving in 3 easy steps</strong>
          <em>
            Currently at step {currentStep}: {STEPS[currentStep - 1].title}
          </em>
        </div>
        <div className="grn-steps">
          {STEPS.map((step) => {
            const state = step.n < currentStep ? 'done' : step.n === currentStep ? 'active' : 'todo'
            return (
              <div className={`grn-step ${state}`} key={step.n}>
                <span className="grn-step-mark">{state === 'done' ? '✓' : step.n}</span>
                <div>
                  <strong>
                    Step {step.n}: {step.title}
                    {state === 'done' ? ' · done' : state === 'active' ? ' · active' : ''}
                  </strong>
                  <small>{step.hint}</small>
                </div>
              </div>
            )
          })}
        </div>
        <p className="grn-terms">
          <b>?</b> Quick terms: <strong>PO</strong> = Purchase Order · <strong>GRN</strong> = Goods Received Note ·{' '}
          <strong>Challan</strong> = vendor delivery slip
        </p>
      </div>

      <StatGrid>
        <StatCard
          icon="truck"
          label="Pending Deliveries"
          value={loading || error ? '—' : stats.pendingCount}
          helpText={`${stats.lateTrucks > 0 ? `${stats.lateTrucks} past ETA · ` : ''}${Math.max(0, stats.pendingCount - stats.lateTrucks)} on schedule`}
          tone="info"
        />
        <StatCard
          icon="cart"
          label="Items to Check"
          value={loading || error ? '—' : stats.remainingUnits.toLocaleString('en-IN')}
          helpText={`Expected value ${money(stats.expectedValue, 0)}`}
          badge={`${stats.uniqueSkus} SKUs`}
          tone="warning"
        />
        <StatCard
          icon="shield"
          label="Quality Check Pass"
          value={loading || error ? '—' : `${stats.passRate.toFixed(1)}%`}
          helpText={`${stats.rejected} rejected/damaged units · ${stats.inspectedReceipts} receipts inspected`}
          tone="success"
        />
        <StatCard
          icon="check"
          label="Completed Today"
          value={loading || error ? '—' : stats.completedToday}
          helpText={`${stats.acceptedToday.toLocaleString('en-IN')} units accepted today`}
          badge={
            stats.deltaVsAvg !== null
              ? `${stats.deltaVsAvg >= 0 ? '+' : ''}${stats.deltaVsAvg}% vs avg`
              : null
          }
          tone="success"
        />
      </StatGrid>

      {/* Intake Terminal */}
      <Card className="grn-intake-card">
        <div className="grn-intake-head">
          <div>
            <strong>Inward consignment intake &amp; verification</strong>
          </div>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-soft)' }}>
            Receiver: <strong>{account?.name || account?.email || 'Current user'}</strong>
          </span>
        </div>
        <div className="grn-intake-grid">
          <Field label="Purchase Order" required hint="Select an awaiting PO">
            <Select
              ref={orderSelectRef}
              value={selectedOrderId}
              onChange={(event) => selectOrder(event.target.value)}
            >
              <option value="">Select an awaiting purchase order…</option>
              {pendingOrders.map((order, idx) => {
                const poId = getPoId(order) || `order-${idx}`
                return (
                  <option key={poId} value={poId}>
                    {order.orderNumber} — {order.supplierName} ({(order.lines || order.items || []).length} lines ·{' '}
                    {money(order.totalAmount, 0)})
                  </option>
                )
              })}
            </Select>
          </Field>

          <Field label="Vendor Challan / Invoice #" hint="Recorded on the GRN note">
            <Input
              value={challan}
              onChange={(event) => setChallan(event.target.value)}
              placeholder="e.g. CH-98412"
            />
          </Field>

          <Field label="Dock Staging Bay" hint="Inspection lane for this consignment">
            <Select value={dockBay} onChange={(event) => setDockBay(event.target.value)}>
              {DOCK_BAYS.map((bay) => (
                <option key={bay} value={bay}>
                  {bay}
                </option>
              ))}
            </Select>
          </Field>

          <div>
            <Button
              variant={selectedOrder ? 'secondary' : 'primary'}
              onClick={() => orderSelectRef.current?.focus()}
              disabled={!!selectedOrder}
            >
              {selectedOrder ? 'Manifest Loaded' : 'Load Manifest'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Manifest Table */}
      {selectedOrder && (
        <Card>
          <div className="grn-manifest-head">
            <div>
              <p style={{ margin: 0, color: 'var(--orange)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Consignment SKU manifest · {selectedOrder.orderNumber}
              </p>
              <h3 style={{ margin: '4px 0 0', color: 'var(--text)' }}>
                {selectedOrder.supplierName}{' '}
                <Badge tone="info" style={{ marginLeft: 8 }}>
                  {selectedOrder.status}
                </Badge>
              </h3>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button size="sm" variant="secondary" icon={<GrnLocalIcon name="printer" />}>
                Bulk Print Labels
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon={<GrnLocalIcon name="check" />}
                onClick={acceptAllAsOrdered}
              >
                Accept All as Ordered
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <DataTable columns={manifestColumns} data={lines} />

            <div style={{ marginTop: 'var(--space-4)' }}>
              <Field label="Receiving Notes">
                <Textarea
                  id="receiving-notes"
                  name="notes"
                  placeholder="Dock observations, temperature checks, discrepancies…"
                  rows={2}
                />
              </Field>
            </div>

            <div className="grn-form-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedOrderId('')
                  setLines([])
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={saving}>
                {saving ? 'Posting GRN…' : 'Post GRN to Stock'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* History */}
      <Card>
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <h3 style={{ margin: 0, color: 'var(--text)' }}>Completed GRN History</h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-soft)', fontSize: 'var(--fs-xs)' }}>
            All past Goods Received Notes committed to stock
          </p>
        </div>

        <Toolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search GRN or PO reference..."
        />

        <DataTable
          columns={historyColumns}
          data={visibleHistory}
          isLoading={loading}
          emptyState={{
            title: 'No GRNs found',
            description: receivings.length
              ? 'No GRNs match your search filter.'
              : 'No goods received notes logged yet.',
          }}
        />
      </Card>
    </section>
  )
}

export default Receiving
