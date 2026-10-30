import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../components/ui/index.js'
import AsyncBoundary from '../../components/feedback/AsyncBoundary.jsx'
import '../dashboard/overview-dashboard.css'
import '../inventory/InventoryOperations.css'

const SORTS = {
  count: { label: 'Product Count', fn: (a, b) => b.count - a.count },
  value: { label: 'Stock Valuation', fn: (a, b) => b.stockValue - a.stockValue },
  name: { label: 'Name (A–Z)', fn: (a, b) => a.category.localeCompare(b.category) },
  stock: { label: 'Units in Stock', fn: (a, b) => b.totalStock - a.totalStock },
}

export default function CategoriesView({
  products = [],
  loading,
  error,
  refetch,
  business = {},
  onNavigate,
}) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [view, setView] = useState('list')
  const [sort, setSort] = useState('count')
  const [page, setPage] = useState(1)
  const pageSize = 8
  const searchRef = useRef(null)

  const currency = business.currency || 'INR'
  const money = useCallback(
    (value, dp = 0) => {
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
    },
    [currency]
  )

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  )

  const stats = useMemo(
    () =>
      categories.map((category) => {
        const items = products.filter((product) => product.category === category)
        const totalStock = items.reduce(
          (sum, product) => sum + Number(product.currentStock || 0),
          0
        )
        const stockValue = items.reduce(
          (sum, product) =>
            sum + Number(product.currentStock || 0) * Number(product.sellingPrice || 0),
          0
        )
        const outOfStock = items.filter((product) => Number(product.currentStock || 0) <= 0).length
        const lowStock = items.filter(
          (product) =>
            Number(product.currentStock || 0) > 0 &&
            Number(product.currentStock || 0) <= Number(product.minimumStock || 10)
        ).length
        const status =
          items.length > 0 && outOfStock === items.length
            ? 'critical'
            : outOfStock + lowStock > 0
            ? 'attention'
            : 'healthy'

        return { category, count: items.length, totalStock, stockValue, lowStock, outOfStock, status }
      }),
    [categories, products]
  )

  const flagged = stats.filter((stat) => stat.status !== 'healthy')
  const topValue = stats.reduce(
    (max, stat) => (!max || stat.stockValue > max.stockValue ? stat : max),
    null
  )

  const filteredStats = useMemo(
    () =>
      stats
        .filter(
          (stat) =>
            tab === 'all' ||
            (tab === 'healthy' && stat.status === 'healthy') ||
            (tab === 'attention' && stat.status !== 'healthy')
        )
        .filter((stat) => stat.category.toLowerCase().includes(search.trim().toLowerCase()))
        .sort(SORTS[sort].fn),
    [stats, tab, search, sort]
  )

  const totalPages = Math.max(1, Math.ceil(filteredStats.length / pageSize))
  const effectivePage = Math.min(page, totalPages)
  const pagedStats = useMemo(() => {
    return filteredStats.slice((effectivePage - 1) * pageSize, effectivePage * pageSize)
  }, [filteredStats, effectivePage, pageSize])

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const exportHierarchy = () => {
    const escapeCell = (value) => {
      const text = String(value ?? '')
      const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text
      return `"${safe.replaceAll('"', '""')}"`
    }
    const rows = [
      [
        'Category',
        'Products',
        'Total Units',
        'Stock Value',
        'Low Stock Items',
        'Out Of Stock Items',
        'Status',
      ],
      ...stats.map((stat) => [
        stat.category,
        stat.count,
        stat.totalStock,
        stat.stockValue,
        stat.lowStock,
        stat.outOfStock,
        stat.status === 'critical'
          ? 'Out of Stock'
          : stat.status === 'attention'
          ? 'Low Stock'
          : 'Healthy',
      ]),
    ]
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `category-hierarchy-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="inventory-page">
      {/* 4 Tonal Pastel Top KPI Cards in a Horizontal Row */}
      {!loading && !error && (
        <div className="ledger-kpi-grid">
          {/* Card 1: Total Categories (Sky Blue) */}
          <div
            className={`ledger-kpi-card theme-blue ${tab === 'all' ? 'is-active' : ''}`}
            onClick={() => {
              setTab('all')
              setPage(1)
            }}
            role="button"
            tabIndex={0}
            title="All Categories"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="layers" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Total Categories</span>
              <span className="ledger-kpi-val">{categories.length} Categories</span>
              <span className="ledger-kpi-pill pill-blue">Catalog Taxonomy</span>
            </div>
          </div>

          {/* Card 2: Well-Stocked (Emerald Green) */}
          <div
            className={`ledger-kpi-card theme-green ${tab === 'healthy' ? 'is-active' : ''}`}
            onClick={() => {
              setTab(tab === 'healthy' ? 'all' : 'healthy')
              setPage(1)
            }}
            role="button"
            tabIndex={0}
            title="Well-Stocked Categories"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="trending-up" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Well-Stocked</span>
              <span className="ledger-kpi-val">{categories.length - flagged.length} Categories</span>
              <span className="ledger-kpi-pill pill-green">Healthy Stock</span>
            </div>
          </div>

          {/* Card 3: Needs Attention (Warm Amber) */}
          <div
            className={`ledger-kpi-card theme-amber ${tab === 'attention' ? 'is-active' : ''}`}
            onClick={() => {
              setTab(tab === 'attention' ? 'all' : 'attention')
              setPage(1)
            }}
            role="button"
            tabIndex={0}
            title="Categories with alerts"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="warning" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Needs Attention</span>
              <span className="ledger-kpi-val">{flagged.length} Categories</span>
              <span className="ledger-kpi-pill pill-amber">Action Needed</span>
            </div>
          </div>

          {/* Card 4: Top Valuation Category (Royal Purple) */}
          <div
            className="ledger-kpi-card theme-purple"
            role="button"
            tabIndex={0}
            title="Highest Valuation Category"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="box" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Top Category Value</span>
              <span className="ledger-kpi-val">{topValue ? money(topValue.stockValue) : money(0)}</span>
              <span className="ledger-kpi-pill pill-purple">{topValue?.category || 'General'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Panel Card matching Dashboard Overview aesthetic */}
      <div className="modern-panel-card content-list-panel">
        <div className="content-list-header">
          <div className="content-list-title-wrap">
            <h2 className="content-list-title">
              Category Taxonomy <span className="content-list-count">({filteredStats.length})</span>
            </h2>
          </div>

          <div className="content-list-toolbar">
            <div className="content-list-search">
              <svg
                className="content-list-search-icon"
                viewBox="0 0 24 24"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                className="content-list-search-input"
                aria-label="Search categories"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search categories..."
              />
            </div>

            <select
              className="content-list-select"
              aria-label="Filter status"
              value={tab}
              onChange={(e) => {
                setTab(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">All Categories ({stats.length})</option>
              <option value="healthy">Well Stocked ({stats.length - flagged.length})</option>
              <option value="attention">Needs Attention ({flagged.length})</option>
            </select>

            <select
              className="content-list-select"
              aria-label="Sort categories"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setPage(1)
              }}
            >
              {Object.entries(SORTS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                type="button"
                className={`content-list-action-btn ${view === 'list' ? '' : 'secondary'}`}
                style={{ padding: '0 12px', height: '38px', minWidth: 'auto', fontSize: '12px' }}
                onClick={() => setView('list')}
                title="Table view"
              >
                Table
              </button>
              <button
                type="button"
                className={`content-list-action-btn ${view === 'grid' ? '' : 'secondary'}`}
                style={{ padding: '0 12px', height: '38px', minWidth: 'auto', fontSize: '12px' }}
                onClick={() => setView('grid')}
                title="Cards view"
              >
                Cards
              </button>
            </div>

            <button
              type="button"
              className="content-list-action-btn secondary"
              onClick={exportHierarchy}
              disabled={loading || !!error || !stats.length}
              title="Export CSV"
            >
              Export CSV
            </button>

            <button
              type="button"
              className="content-list-action-btn"
              onClick={() => onNavigate?.('Products')}
              title="Add product to catalog"
            >
              Add Product
            </button>
          </div>
        </div>

        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={refetch}
          isEmpty={!filteredStats.length}
          emptyText="No categories match your filters."
        >
          {view === 'list' ? (
            <div className="content-list-table-wrap">
              <table className="content-list-table">
                <thead>
                  <tr>
                    <th style={{ width: '32%' }}>Category Name</th>
                    <th style={{ width: '14%' }}>SKUs Count</th>
                    <th style={{ width: '16%' }}>Total Units</th>
                    <th style={{ width: '16%' }}>Stock Valuation</th>
                    <th style={{ width: '14%' }}>Stock Health</th>
                    <th style={{ width: '8%', textAlign: 'right', paddingRight: '16px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedStats.map((stat) => {
                    const isCritical = stat.status === 'critical'
                    const isAttention = stat.status === 'attention'
                    const pillClass = isCritical
                      ? 'status-pill-out'
                      : isAttention
                      ? 'status-pill-low'
                      : 'status-pill-instock'
                    const statusText = isCritical
                      ? 'Out of Stock'
                      : isAttention
                      ? `${stat.lowStock + stat.outOfStock} Low/Out`
                      : 'Well Stocked'

                    return (
                      <tr key={stat.category}>
                        <td className="cl-cell-product">
                          <div className="cl-product-name">{stat.category}</div>
                          <div className="cl-product-meta">
                            <span className="cl-product-sku">{stat.count} products catalogued</span>
                          </div>
                        </td>
                        <td className="cl-cell-category">
                          <span className="ledger-sku-pill">{stat.count} SKUs</span>
                        </td>
                        <td className="cl-cell-stock">
                          <span className="cl-stock-value">{stat.totalStock.toLocaleString('en-IN')}</span>
                          <span className="cl-stock-label"> units</span>
                        </td>
                        <td className="cl-cell-price">
                          <strong>{money(stat.stockValue)}</strong>
                        </td>
                        <td className="cl-cell-status">
                          <span className={`content-status-pill ${pillClass}`}>
                            {statusText}
                          </span>
                        </td>
                        <td className="cl-cell-actions" style={{ textAlign: 'right', paddingRight: '16px' }}>
                          <div className="cl-actions-wrapper">
                            <button
                              type="button"
                              className="ledger-action-icon action-view"
                              onClick={() => onNavigate?.('Products')}
                              aria-label={`View products in ${stat.category}`}
                              title={`View ${stat.category} products`}
                            >
                              <Icon name="eye" size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="categories-grid" style={{ padding: '16px' }}>
              {pagedStats.map((stat) => (
                <div key={stat.category} className={`category-card status-${stat.status}`}>
                  <div className="category-card-header">
                    <div className="category-card-title-group">
                      <div className={`category-icon-bubble ${stat.status}`}>
                        <Icon name="box" size={18} />
                      </div>
                      <div>
                        <h4 className="category-card-title">{stat.category}</h4>
                        <span style={{ fontSize: '12px', color: 'var(--muted, #64748b)' }}>
                          {stat.count} products catalogued
                        </span>
                      </div>
                    </div>
                    <span
                      className={`content-status-pill ${
                        stat.status === 'critical'
                          ? 'status-pill-out'
                          : stat.status === 'attention'
                          ? 'status-pill-low'
                          : 'status-pill-instock'
                      }`}
                    >
                      {stat.status === 'critical'
                        ? 'Out of Stock'
                        : stat.status === 'attention'
                        ? 'Low Stock'
                        : 'Healthy'}
                    </span>
                  </div>

                  <div className="category-metric-row">
                    <span style={{ color: 'var(--muted, #64748b)', fontWeight: 600, fontSize: '12.5px' }}>
                      Total Units
                    </span>
                    <span className="cl-stock-value" style={{ fontSize: '14px' }}>
                      {stat.totalStock.toLocaleString('en-IN')} units
                    </span>
                  </div>

                  <div className="category-metric-row">
                    <span style={{ color: 'var(--muted, #64748b)', fontWeight: 600, fontSize: '12.5px' }}>
                      Valuation
                    </span>
                    <strong style={{ color: 'var(--text, #1e293b)', fontSize: '14px' }}>
                      {money(stat.stockValue)}
                    </strong>
                  </div>

                  <div className="category-card-stats">
                    <span style={{ fontSize: '12px', color: 'var(--muted, #64748b)' }}>
                      {stat.lowStock + stat.outOfStock > 0
                        ? `${stat.lowStock + stat.outOfStock} items low/out`
                        : 'Stock is healthy'}
                    </span>
                    <button
                      type="button"
                      className="content-list-action-btn secondary"
                      style={{ padding: '4px 12px', height: '30px', fontSize: '12px' }}
                      onClick={() => onNavigate?.('Products')}
                    >
                      Explore →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredStats.length > 0 && (
            <footer className="content-list-pagination">
              <span className="cl-page-info">
                Page {effectivePage} of {totalPages}
              </span>
              <div className="cl-page-nav">
                <button
                  type="button"
                  className="cl-page-btn"
                  disabled={effectivePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="cl-page-btn"
                  disabled={effectivePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </footer>
          )}
        </AsyncBoundary>
      </div>
    </div>
  )
}
