import { useEffect, useMemo, useRef, useState } from 'react'
import AsyncBoundary from '../../components/feedback/AsyncBoundary.jsx'
import '../../styles/categories.css'
import '../../styles/inventory-dashboard.css'

function CatIcon({ name, ...props }) {
  const paths = {
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5M3 17l9 5 9-5" /></>,
    barcode: <><path d="M4 5v14M8 5v14M12 5v14M16 5v10M20 5v14" /></>,
    trend: <><path d="M4 17 10 11l4 4 6-7" /><path d="M15 8h5v5" /></>,
    alert: <><path d="M12 4 2 20h20L12 4Z" /><path d="M12 10v5M12 18h.01" /></>,
    export: <><path d="M12 3v12m-4-4 4 4 4-4" /><path d="M5 17v3h14v-3" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    grid: <><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></>,
    folder: <path d="M4 7a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />,
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {paths[name]}
    </svg>
  )
}

const TABS = [
  { id: 'all', label: 'All Categories' },
  { id: 'healthy', label: 'Well Stocked' },
  { id: 'attention', label: 'Needs Attention' },
]

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
  const [tableOpen, setTableOpen] = useState(true)
  const pageSize = 10
  const searchRef = useRef(null)

  const currency = business.currency || 'INR'
  const money = (value, dp = 0) => {
    const amount = Number(value || 0)
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: dp, maximumFractionDigits: dp }).format(amount)
    } catch {
      return `${currency} ${amount.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`
    }
  }

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  )

  const stats = useMemo(
    () =>
      categories.map((category) => {
        const items = products.filter((product) => product.category === category)
        const totalStock = items.reduce((sum, product) => sum + Number(product.currentStock || 0), 0)
        const stockValue = items.reduce(
          (sum, product) => sum + Number(product.currentStock || 0) * Number(product.sellingPrice || 0),
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

  const totalSkus = products.length
  const flagged = stats.filter((stat) => stat.status !== 'healthy')
  const wellStockedCount = stats.filter((stat) => stat.status === 'healthy').length
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
  const currentPage = Math.min(page, totalPages)
  const currentItems = filteredStats.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
      ['Category', 'Products', 'Total Units', 'Stock Value', 'Low Stock Items', 'Out Of Stock Items', 'Status'],
      ...stats.map((stat) => [
        stat.category,
        stat.count,
        stat.totalStock,
        stat.stockValue,
        stat.lowStock,
        stat.outOfStock,
        stat.status === 'critical' ? 'Out of Stock' : stat.status === 'attention' ? 'Low Stock' : 'Healthy',
      ]),
    ]
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
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
    <div className="modern-dashboard-content inventory-dashboard-page" aria-busy={loading}>
      {/* 1. Header Toolbar */}
      <header className="inventory-page-header">
        <div className="inventory-header-left">
          <div className="inventory-header-title-row">
            <h1>Category Taxonomy &amp; Catalog Health</h1>
            <span className={`inventory-live-badge ${error ? 'is-error' : ''}`}>
              <i /> Synced Catalog
            </span>
          </div>
          <p className="inventory-header-sub">
            Category structure, SKU distribution, and warehouse valuation for <strong>{business.name}</strong>.
          </p>
        </div>

        <div className="inventory-header-actions">
          <button
            type="button"
            onClick={exportHierarchy}
            disabled={loading || !!error || !stats.length}
          >
            <CatIcon name="export" /> Export CSV ({stats.length})
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => onNavigate?.('Products')}
          >
            <CatIcon name="plus" /> Add Category / Product
          </button>
        </div>
      </header>

      {/* 2. Top Metric KPI 4 Cards Grid */}
      <div className="modern-kpi-row">
        {/* KPI 1: Total Categories */}
        <div className="modern-kpi-card" tabIndex={0} role="region" aria-label="Total categories">
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Total Categories</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : categories.length}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 500 }}>
              Across {business.name} warehouse
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-blue" aria-hidden="true">
            <CatIcon name="layers" />
          </div>
        </div>

        {/* KPI 2: Catalogued SKUs */}
        <div
          className="modern-kpi-card"
          tabIndex={0}
          role="button"
          onClick={() => onNavigate?.('Products')}
          aria-label="View product catalog"
        >
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Catalogued SKUs</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : totalSkus}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 500 }}>
              Active catalog items
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-purple" aria-hidden="true">
            <CatIcon name="barcode" />
          </div>
        </div>

        {/* KPI 3: Highest Value Category */}
        <div className="modern-kpi-card" tabIndex={0} role="region" aria-label="Highest value category">
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Highest Valuation</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : topValue ? money(topValue.stockValue) : '—'}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--success)', fontWeight: 600 }}>
              {topValue?.category || 'No categories'}
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-green" aria-hidden="true">
            <CatIcon name="trend" />
          </div>
        </div>

        {/* KPI 4: Needs Attention */}
        <div
          className="modern-kpi-card"
          tabIndex={0}
          role="button"
          onClick={() => {
            setTab('attention')
            setPage(1)
          }}
          aria-label="Filter categories needing attention"
        >
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Needs Attention</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : flagged.length}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--danger)', fontWeight: 600 }}>
              Categories with low / zero stock
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-rose" aria-hidden="true">
            <CatIcon name="alert" />
          </div>
        </div>
      </div>

      {/* 3. Categories List (Dashboard invoice-style-panel) */}
      <section className="modern-panel-card invoice-style-panel">
        <div className="section-heading" style={{ marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
              <span
                className="inventory-heading-icon"
                aria-hidden="true"
                style={{
                  fontSize: '32px',
                  lineHeight: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                🗂️
              </span>
              <span>Category Hierarchy &amp; SKU Directory</span>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="outline-button"
              type="button"
              onClick={() => setTableOpen(!tableOpen)}
            >
              {tableOpen ? 'Hide Table' : 'Show Table'}
            </button>
          </div>
        </div>

        {tableOpen && (
          <>
            {/* Controls Row: Search + Filter Selects + View Toggles */}
            <div className="invoice-controls-row">
              <div className="invoice-controls-left">
                <div className="invoice-search-wrap">
                  <input
                    ref={searchRef}
                    type="text"
                    className="invoice-search-input"
                    aria-label="Filter categories"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value)
                      setPage(1)
                    }}
                    placeholder="Search category name…"
                  />
                  <span className="invoice-search-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </span>
                </div>

                <div className="inventory-quick-tabs">
                  {TABS.map((option) => (
                    <button
                      type="button"
                      key={option.id}
                      className={`inventory-tab-pill ${tab === option.id ? 'active' : ''}`}
                      onClick={() => {
                        setTab(option.id)
                        setPage(1)
                      }}
                    >
                      {option.label}
                      <b>
                        {option.id === 'all'
                          ? stats.length
                          : option.id === 'healthy'
                          ? wellStockedCount
                          : flagged.length}
                      </b>
                    </button>
                  ))}
                </div>

                <select
                  className="invoice-select"
                  aria-label="Sort categories"
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="count">Sort: Product Count</option>
                  <option value="value">Sort: Stock Valuation</option>
                  <option value="stock">Sort: Units in Stock</option>
                  <option value="name">Sort: Name (A–Z)</option>
                </select>

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className={`outline-button ${view === 'list' ? 'active' : ''}`}
                    aria-label="List view"
                    onClick={() => setView('list')}
                    style={{ padding: '6px 10px', height: '38px' }}
                  >
                    <CatIcon name="list" width={16} height={16} />
                  </button>
                  <button
                    type="button"
                    className={`outline-button ${view === 'grid' ? 'active' : ''}`}
                    aria-label="Grid view"
                    onClick={() => setView('grid')}
                    style={{ padding: '6px 10px', height: '38px' }}
                  >
                    <CatIcon name="grid" width={16} height={16} />
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="invoice-primary-btn"
                onClick={() => onNavigate?.('Products')}
              >
                + New Product
              </button>
            </div>

            {/* List or Grid */}
            <AsyncBoundary
              loading={loading}
              error={error}
              onRetry={refetch}
              isEmpty={!filteredStats.length}
              emptyText={
                stats.length
                  ? 'No categories match your search and filter.'
                  : 'No categories recorded yet.'
              }
            >
              {view === 'grid' ? (
                <div className="cat-grid" style={{ padding: '16px 0' }}>
                  {currentItems.map((stat) => (
                    <article className={`cat-card tone-${stat.status === 'healthy' ? 'ok' : 'attention'}`} key={stat.category}>
                      <div className="cat-card-head">
                        <span className="cat-card-icon">
                          <CatIcon name="folder" />
                        </span>
                        <div className="cat-card-id">
                          <strong>{stat.category}</strong>
                          <small>{stat.count} product{stat.count === 1 ? '' : 's'}</small>
                        </div>
                        <button
                          type="button"
                          className="cat-card-menu"
                          onClick={() => onNavigate?.('Products')}
                          title={`Open ${stat.category} in Products`}
                        >
                          ⋮
                        </button>
                      </div>
                      <div className="cat-card-foot">
                        <span className={`cat-tag ${stat.status === 'healthy' ? 'green' : stat.status === 'critical' ? 'rose' : 'amber'}`}>
                          <i />
                          {stat.status === 'healthy'
                            ? 'Well Stocked'
                            : stat.status === 'critical'
                            ? 'Depleted'
                            : `${stat.totalStock} units left`}
                        </span>
                        <b>{money(stat.stockValue)}</b>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="invoice-table-wrap">
                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Category Name</th>
                        <th>Catalogued Products</th>
                        <th>Total Available Units</th>
                        <th>Landed Stock Value</th>
                        <th>Stock Health</th>
                        <th style={{ textAlign: 'right', paddingRight: '20px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((stat, idx) => {
                        const pillClass =
                          stat.status === 'critical'
                            ? 'pill-out'
                            : stat.status === 'attention'
                            ? 'pill-pending'
                            : 'pill-delivered'

                        const statusText =
                          stat.status === 'critical'
                            ? 'Out of Stock'
                            : stat.status === 'attention'
                            ? 'Needs Restock'
                            : 'Well Stocked'

                        return (
                          <tr key={stat.category}>
                            <td className="invoice-cell-id">
                              {(currentPage - 1) * pageSize + idx + 1}
                            </td>
                            <td className="invoice-cell-name">
                              <span className="invoice-product-title">{stat.category}</span>
                            </td>
                            <td className="invoice-cell-category">
                              <strong>{stat.count}</strong> products
                            </td>
                            <td className="invoice-cell-cost">
                              <strong>{stat.totalStock.toLocaleString('en-IN')}</strong> units
                            </td>
                            <td className="invoice-cell-cost">
                              {money(stat.stockValue)}
                            </td>
                            <td>
                              <span className={`invoice-pill ${pillClass}`}>
                                {statusText}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                              <div className="invoice-actions-cell">
                                <button
                                  type="button"
                                  className="inventory-row-action-btn"
                                  onClick={() => onNavigate?.('Products')}
                                  title={`View products in ${stat.category}`}
                                >
                                  View SKUs
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination footer */}
              <footer className="overview-pagination invoice-pagination">
                <span>
                  Showing {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filteredStats.length)} of{' '}
                  {filteredStats.length} categories
                </span>
                <div className="invoice-page-buttons">
                  <button
                    type="button"
                    className="invoice-page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous
                  </button>
                  <span className="invoice-page-num">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    className="invoice-page-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </footer>
            </AsyncBoundary>
          </>
        )}
      </section>
    </div>
  )
}
