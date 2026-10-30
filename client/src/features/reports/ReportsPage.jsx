import { useCallback, useState } from 'react'
import { reportApi } from '../../api/reportApi.js'
import { useResource } from '../../hooks/useResource.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { StatGrid, StatCard, Card } from '../../components/ui/Card.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input, Select } from '../../components/ui/FormControls.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import './ReportsPage.css'

export default function ReportsPage({ business = {} }) {
  const loadReport = useCallback(() => reportApi.summary(), [])
  const { data: report, loading, error, refetch } = useResource(loadReport, [])
  const [stockFilter, setStockFilter] = useState('all')
  const [search, setSearch] = useState('')
  const products = report?.products || []
  const currency = business?.currency || 'INR'

  const money = (value, dp = 0) => {
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

  const num = (value) => Number(value || 0).toLocaleString('en-IN')
  const margin = report?.salesTotal
    ? Math.round((Number(report.grossProfit || 0) / Number(report.salesTotal)) * 100)
    : 0

  const visible = products
    .filter((product) => {
      const stock = Number(product.currentStock || 0)
      const status = stock === 0 ? 'out' : stock <= (product.minimumStock || 10) ? 'low' : 'in'
      if (stockFilter !== 'all' && stockFilter !== status) return false
      return `${product.name} ${product.sku} ${product.category || ''}`
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    })
    .sort((a, b) => b.currentStock * b.purchasePrice - a.currentStock * a.purchasePrice)

  const exportCsv = () => {
    const esc = (v) => {
      const t = String(v ?? '')
      return `"${(/^[=+@\-\t\r]/.test(t) ? `'${t}` : t).replaceAll('"', '""')}"`
    }
    const rows = [
      ['Product', 'SKU', 'Category', 'Stock', 'Unit cost', 'Stock value', 'Status'],
      ...visible.map((p) => {
        const s = Number(p.currentStock || 0)
        return [
          p.name,
          p.sku,
          p.category || '',
          s,
          p.purchasePrice,
          s * p.purchasePrice,
          s === 0 ? 'Out of stock' : s <= (p.minimumStock || 10) ? 'Low stock' : 'In stock',
        ]
      }),
    ]
    const url = URL.createObjectURL(
      new Blob([rows.map((r) => r.map(esc).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `report-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const columns = [
    {
      key: 'product',
      header: 'Product & Category',
      render: (p) => (
        <div>
          <span className="font-semibold text-main">{p.name}</span>
          <small className="block text-muted">
            {p.sku}
            {p.category ? ` · ${p.category}` : ''}
          </small>
        </div>
      ),
      mobileLabel: 'Product',
    },
    {
      key: 'stock',
      header: 'Current Stock',
      align: 'right',
      render: (p) => {
        const s = Number(p.currentStock || 0)
        const isLow = s <= (p.minimumStock || 10)
        return (
          <strong className={s === 0 ? 'text-danger' : isLow ? 'text-warning' : 'text-main'}>
            {num(s)} units
          </strong>
        )
      },
      mobileLabel: 'Stock',
    },
    {
      key: 'value',
      header: 'Stock Value (At Cost)',
      align: 'right',
      render: (p) => (
        <span className="text-main font-medium">
          {money(Number(p.currentStock || 0) * Number(p.purchasePrice || 0))}
        </span>
      ),
      mobileLabel: 'Value',
    },
    {
      key: 'status',
      header: 'Health Status',
      render: (p) => {
        const s = Number(p.currentStock || 0)
        const tone = s === 0 ? 'danger' : s <= (p.minimumStock || 10) ? 'warning' : 'success'
        const label = s === 0 ? 'Out of stock' : s <= (p.minimumStock || 10) ? 'Low stock' : 'In stock'
        return <Badge tone={tone}>{label}</Badge>
      },
      mobileLabel: 'Status',
    },
  ]

  return (
    <div className="rep-page reports-container">
      <PageHeader
        kicker="Business intelligence • Live summary"
        title="Reports"
        badge="Live data"
        description={`Consolidated sales, procurement, profitability, and inventory health for ${business?.name || 'your business'}.`}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              onClick={exportCsv}
              disabled={loading || !!error || !products.length}
              icon="download"
            >
              Export CSV
            </Button>
            <Button variant="primary" onClick={() => window.print()} icon="document">
              Print Report
            </Button>
          </div>
        }
      />

      <StatGrid columns={4}>
        <StatCard
          title="Completed sales (net)"
          value={money(report?.salesTotal)}
          subtext={`${money(report?.grossSalesTotal)} gross · ${money(report?.salesReturnTotal)} returned`}
          deltaType="positive"
          icon="chart"
        />
        <StatCard
          title={`Gross profit (${margin}% margin)`}
          value={money(report?.grossProfit)}
          subtext="Revenue minus cost of goods sold"
          icon="tag"
        />
        <StatCard
          title="Purchase spend"
          value={money(report?.purchaseTotal)}
          subtext={`${money(report?.purchaseDue)} still owed to suppliers`}
          icon="truck"
        />
        <StatCard
          title="Inventory value (at cost)"
          value={money(report?.inventoryValue)}
          subtext={`${num(report?.totalUnitsInStock)} units · ${num(report?.productCount)} SKUs`}
          icon="box"
        />
      </StatGrid>

      <div className="reports-secondary-grid">
        <div className="reports-tile">
          <small>Today's Sales</small>
          <strong>{money(report?.todaySales)}</strong>
          <span>{num(report?.todayOrdersCount)} orders placed</span>
        </div>
        <div className="reports-tile">
          <small>Pending Orders</small>
          <strong>{num(report?.pendingOrdersCount)}</strong>
          <span>{money(report?.pendingOrdersAmount)} open value</span>
        </div>
        <div className={`reports-tile ${Number(report?.outstandingReceivables || 0) > 0 ? 'warn' : ''}`}>
          <small>Receivables</small>
          <strong>{money(report?.outstandingReceivables)}</strong>
          <span>Customer credit due</span>
        </div>
        <div className="reports-tile">
          <small>Stock Movements</small>
          <strong>{num(report?.stockMovements)}</strong>
          <span>{num(report?.stockInCount)} in · {num(report?.stockOutCount)} out</span>
        </div>
        <div className={`reports-tile ${Number(report?.lowStock || 0) > 0 ? 'warn' : ''}`}>
          <small>Low Stock SKUs</small>
          <strong>{num(report?.lowStock)}</strong>
          <span>At or below reorder point</span>
        </div>
        <div className={`reports-tile ${Number(report?.outOfStock || 0) > 0 ? 'danger' : ''}`}>
          <small>Out of Stock</small>
          <strong>{num(report?.outOfStock)}</strong>
          <span>Needs immediate restocking</span>
        </div>
      </div>

      <Card title="Current Stock Valuation" subtitle="Ranked by highest total inventory value at cost">
        <div className="reports-filter-bar">
          <Input
            aria-label="Search stock"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product, SKU or category..."
          />
          <Select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            aria-label="Stock status filter"
          >
            <option value="all">All stock statuses</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={visible}
          loading={loading}
          error={error}
          onRetry={refetch}
          emptyTitle="No products match"
          emptyDescription="No inventory records found matching your filters."
        />
      </Card>

      <footer className="reports-statusbar">
        <span>
          <i className="reports-statusbar-indicator" />
          Stockroom · Business Intelligence
        </span>
        <span>
          Recalculated{' '}
          {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="reports-statusbar-suite">Enterprise Retail OS</span>
      </footer>
    </div>
  )
}
