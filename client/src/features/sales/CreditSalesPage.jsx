import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { StatGrid, StatCard } from '../../components/ui/Card.jsx'
import { Toolbar } from '../../components/ui/Toolbar.jsx'
import { Tabs } from '../../components/ui/Tabs.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'

export default function CreditSalesList({
  section = 'Credit Sales',
  orders = [],
  business = {},
  loading = false,
  error = null,
  refetch,
  onCreate,
  onView,
  onEdit,
  onComplete,
  onCancel,
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const currency = business?.currency || 'INR'
  const money = (value) => {
    const amount = Number(value || 0)
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    } catch {
      return `${currency} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }

  const sum = (list, field = 'totalAmount') =>
    list.reduce((total, order) => total + Number(order[field] || 0), 0)

  const completed = useMemo(
    () => orders.filter((order) => order.status === 'Completed'),
    [orders]
  )
  const pending = useMemo(
    () => orders.filter((order) => order.status === 'Pending'),
    [orders]
  )
  const cancelled = useMemo(
    () => orders.filter((order) => order.status === 'Cancelled'),
    [orders]
  )
  const settled = useMemo(
    () =>
      orders.filter(
        (order) => order.status !== 'Cancelled' && order.paymentStatus === 'Paid'
      ),
    [orders]
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return orders.filter((order) => {
      const matchStatus = status === 'all' || order.status === status
      const matchSearch =
        !query ||
        `${order.orderNumber} ${order.customerName}`.toLowerCase().includes(query)
      return matchStatus && matchSearch
    })
  }, [orders, status, search])

  const exportOrders = () => {
    const cell = (value) =>
      `"${String(value ?? '')
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""')}"`
    const rows = [
      ['Order ID', 'Customer', 'Total amount', 'Currency', 'Status', 'Payment status'],
      ...filtered.map((order) => [
        order.orderNumber,
        order.customerName,
        order.totalAmount,
        currency,
        order.status,
        order.paymentStatus,
      ]),
    ]
    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8;',
      })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `credit-sales-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const tabs = [
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'Completed', label: 'Completed', count: completed.length },
    { id: 'Cancelled', label: 'Cancelled', count: cancelled.length },
  ]

  const columns = [
    {
      key: 'orderNumber',
      header: 'Order ID',
      priority: 'high',
      mobileLabel: 'Order',
      render: (order) => (
        <div className="credit-cell-primary">
          <strong className="credit-order-num">{order.orderNumber}</strong>
          <small className="credit-cell-sub">
            {new Date(order.createdAt).toLocaleDateString()} · {order.items?.length || 0}{' '}
            {order.items?.length === 1 ? 'item' : 'items'}
          </small>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      priority: 'high',
      mobileLabel: 'Customer',
      render: (order) => (
        <div className="credit-customer-cell">
          <strong>{order.customerName || 'Customer'}</strong>
          <small className="credit-cell-sub">
            {order.channel === 'POS'
              ? 'Point of sale'
              : order.billingType === 'wholesale'
                ? 'Wholesale customer'
                : 'Sales order'}
          </small>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      priority: 'high',
      mobileLabel: 'Amount',
      render: (order) => (
        <div className="credit-amount-cell">
          <strong className={order.status === 'Cancelled' ? 'credit-void-amt' : ''}>
            {money(order.totalAmount)}
          </strong>
          <small className={order.paymentStatus === 'Paid' ? 'credit-paid-amt' : 'credit-cell-sub'}>
            {order.paymentSummary?.length
              ? order.paymentSummary.map((p) => p.method).join(' / ')
              : order.paymentStatus || 'Unpaid'}
          </small>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      priority: 'medium',
      mobileLabel: 'Status',
      render: (order) => {
        const tone =
          order.status === 'Completed'
            ? 'success'
            : order.status === 'Cancelled'
              ? 'danger'
              : 'warning'
        return (
          <Badge tone={tone} dot>
            {order.status}
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      priority: 'high',
      align: 'right',
      mobileLabel: 'Actions',
      render: (order) => (
        <div className="credit-actions-cell" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => onView?.(order)}>
            View
          </Button>
          {order.status === 'Pending' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onEdit?.(order)}>
                Edit
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onComplete?.(order)}>
                Complete
              </Button>
              <Button variant="danger" size="sm" onClick={() => onCancel?.(order)}>
                Cancel
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  const activeOrders = orders.filter((order) => order.status !== 'Cancelled')
  const totalSalesVal = sum(activeOrders)
  const settledPct = orders.length
    ? ((settled.length / orders.length) * 100).toFixed(1)
    : '0'

  return (
    <div className="credit-sales-unified">
      <PageHeader
        kicker={`Orders / ${section}`}
        title={section}
        description={`Manage customer receivables, credit terms, and settled orders.`}
        scope={`${orders.length} orders · ${business?.name || 'Store'}`}
        actions={[
          {
            label: 'Export CSV',
            variant: 'secondary',
            onClick: exportOrders,
            disabled: loading || !!error || !filtered.length,
          },
          {
            label: 'Create Order',
            variant: 'primary',
            onClick: onCreate,
          },
        ]}
      />

      {!loading && !error && (
        <StatGrid>
          <StatCard
            label="Total Sales"
            value={money(totalSalesVal)}
            subtext={`Across ${activeOrders.length} non-cancelled orders`}
            tone="primary"
          />
          <StatCard
            label="Settled Orders"
            value={`${settled.length} / ${orders.length}`}
            subtext={`${settledPct}% collection rate · ${money(sum(activeOrders, 'amountPaid'))} collected`}
            tone="emerald"
          />
          <StatCard
            label="Pending Orders"
            value={`${pending.length} orders`}
            subtext={`Awaiting completion (${money(sum(pending))})`}
            tone="amber"
          />
          <StatCard
            label="Cancelled"
            value={`${cancelled.length} orders`}
            subtext={`Cancelled value: ${money(sum(cancelled))}`}
            tone="rose"
          />
        </StatGrid>
      )}

      <Toolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order number or customer…"
        filters={
          <div className="credit-filters-row">
            <Tabs tabs={tabs} activeTab={status} onChange={setStatus} />
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyField="orderId"
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyMessage={
          orders.length
            ? 'No orders match your filter criteria.'
            : 'No credit sales orders yet. Create your first sales order.'
        }
        pagination
        pageSize={10}
        onRowClick={(order) => onView?.(order)}
      />
    </div>
  )
}
