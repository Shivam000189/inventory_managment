import { useCallback, useState } from 'react'
import { reportApi } from '../../api/reportApi.js'
import { useResource } from '../../hooks/useResource.js'
import AsyncBoundary from '../../components/feedback/AsyncBoundary.jsx'
import '../../styles/reports.css'

export default function ReportsPage({ business }) {
  const loadReport = useCallback(() => reportApi.summary(), [])
  const { data: report, loading, error, refetch } = useResource(loadReport, [])
  const [stockFilter, setStockFilter] = useState('all')
  const [search, setSearch] = useState('')
  const products = report?.products || []
  const currency = business?.currency || 'INR'
  const money = (value, dp = 0) => {
    const amount = Number(value || 0)
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: dp, maximumFractionDigits: dp }).format(amount)
    } catch {
      return `${currency} ${amount.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`
    }
  }
  const num = (value) => Number(value || 0).toLocaleString('en-IN')
  const margin = report?.salesTotal ? Math.round((Number(report.grossProfit || 0) / Number(report.salesTotal)) * 100) : 0

  const visible = products.filter((product) => {
    const stock = Number(product.currentStock || 0)
    const status = stock === 0 ? 'out' : stock <= (product.minimumStock || 10) ? 'low' : 'in'
    if (stockFilter !== 'all' && stockFilter !== status) return false
    return `${product.name} ${product.sku} ${product.category || ''}`.toLowerCase().includes(search.trim().toLowerCase())
  }).sort((a, b) => (b.currentStock * b.purchasePrice) - (a.currentStock * a.purchasePrice))

  const exportCsv = () => {
    const esc = (v) => { const t = String(v ?? ''); return `"${(/^[=+@\-\t\r]/.test(t) ? `'${t}` : t).replaceAll('"', '""')}"` }
    const rows = [
      ['Product', 'SKU', 'Category', 'Stock', 'Unit cost', 'Stock value', 'Status'],
      ...visible.map((p) => {
        const s = Number(p.currentStock || 0)
        return [p.name, p.sku, p.category || '', s, p.purchasePrice, s * p.purchasePrice, s === 0 ? 'Out of stock' : s <= (p.minimumStock || 10) ? 'Low stock' : 'In stock']
      })
    ]
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `report-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <section className="rep-page" aria-labelledby="rep-title">
      <header className="rep-heading">
        <div>
          <p className="rep-kicker">Business intelligence <span>•</span> Live summary for {business?.name}</p>
          <div className="rep-title-line">
            <h1 id="rep-title">Reports</h1>
            <span className="rep-live">Live data</span>
          </div>
          <p>Consolidated sales, procurement, profitability, and inventory health — recalculated on every load.</p>
        </div>
        <div className="rep-heading-actions">
          <button type="button" onClick={exportCsv} disabled={loading || !!error || !products.length}>
            Export stock CSV
          </button>
          <button type="button" className="primary" onClick={() => window.print()}>
            Print report ↗
          </button>
        </div>
      </header>

      <AsyncBoundary loading={loading} error={error} onRetry={refetch}>
        <div className="rep-kpis">
          <article className="rep-kpi">
            <span>Completed sales <i>net</i></span>
            <strong className="rep-money rep-good">{money(report?.salesTotal)}</strong>
            <p>{money(report?.grossSalesTotal)} gross · {money(report?.salesReturnTotal)} returned</p>
          </article>
          <article className="rep-kpi">
            <span>Gross profit <i>{margin}% margin</i></span>
            <strong className="rep-money">{money(report?.grossProfit)}</strong>
            <p>Revenue minus cost of goods sold</p>
          </article>
          <article className="rep-kpi">
            <span>Purchase value <i>spend</i></span>
            <strong className="rep-money">{money(report?.purchaseTotal)}</strong>
            <p>{money(report?.purchaseDue)} still owed to suppliers</p>
          </article>
          <article className="rep-kpi">
            <span>Inventory value <i>at cost</i></span>
            <strong className="rep-money">{money(report?.inventoryValue)}</strong>
            <p>{num(report?.totalUnitsInStock)} units · {num(report?.productCount)} SKUs</p>
          </article>
        </div>

        <div className="rep-tiles">
          <article>
            <small>Today's sales</small>
            <strong>{money(report?.todaySales)}</strong>
            <span>{num(report?.todayOrdersCount)} orders</span>
          </article>
          <article>
            <small>Pending orders</small>
            <strong>{num(report?.pendingOrdersCount)}</strong>
            <span>{money(report?.pendingOrdersAmount)} value</span>
          </article>
          <article className={Number(report?.outstandingReceivables || 0) > 0 ? 'warn' : ''}>
            <small>Receivables</small>
            <strong>{money(report?.outstandingReceivables)}</strong>
            <span>Customer credit due</span>
          </article>
          <article>
            <small>Stock movements</small>
            <strong>{num(report?.stockMovements)}</strong>
            <span>{num(report?.stockInCount)} in · {num(report?.stockOutCount)} out</span>
          </article>
          <article className={Number(report?.lowStock || 0) > 0 ? 'warn' : ''}>
            <small>Low stock SKUs</small>
            <strong>{num(report?.lowStock)}</strong>
            <span>At or below reorder level</span>
          </article>
          <article className={Number(report?.outOfStock || 0) > 0 ? 'danger' : ''}>
            <small>Out of stock</small>
            <strong>{num(report?.outOfStock)}</strong>
            <span>Needs restocking now</span>
          </article>
        </div>

        <section className="rep-panel">
          <div className="rep-panel-head">
            <div>
              <p className="rep-kicker">Inventory report</p>
              <h2>Current stock — highest value first</h2>
            </div>
            <div className="rep-panel-tools">
              <label className="rep-search">
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="10.5" cy="10.5" r="6.5" />
                    <path d="m16 16 4.5 4.5" />
                  </svg>
                </span>
                <input aria-label="Search stock" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product or SKU" />
              </label>
              <select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)} aria-label="Stock status filter">
                <option value="all">All items</option>
                <option value="in">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
            </div>
          </div>
          <div className="rep-table-scroll" tabIndex={0} role="region" aria-label="Current stock">
            <table className="rep-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="num">Stock</th>
                  <th className="num">Stock value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => {
                  const stock = Number(product.currentStock || 0)
                  const state = stock === 0 ? 'out' : stock <= (product.minimumStock || 10) ? 'low' : 'in'
                  return (
                    <tr key={product.productId}>
                      <td>
                        <div className="rep-product">
                          <span className="rep-avatar">{product.name[0].toUpperCase()}</span>
                          <div>
                            <strong>{product.name}</strong>
                            <small>{product.sku}{product.category ? ` · ${product.category}` : ''}</small>
                          </div>
                        </div>
                      </td>
                      <td className="num">
                        <strong className={state === 'in' ? '' : 'rep-flag'}>{num(stock)}</strong>
                      </td>
                      <td className="num rep-val">{money(stock * product.purchasePrice)}</td>
                      <td>
                        <span className={`rep-badge ${state}`}>
                          <i />
                          {state === 'out' ? 'Out of stock' : state === 'low' ? 'Low stock' : 'In stock'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </AsyncBoundary>

      <footer className="rep-statusbar">
        <span><i />Stockroom · business intelligence</span>
        <span>Recalculated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="rep-statusbar-suite">Enterprise Retail OS</span>
      </footer>
    </section>
  )
}
