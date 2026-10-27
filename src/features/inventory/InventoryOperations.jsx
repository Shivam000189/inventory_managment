import { useCallback, useMemo, useState } from 'react'
import { productApi } from '../../api/productApi.js'
import { inventoryApi } from '../../api/inventoryApi.js'
import { useResource } from '../../hooks/useResource.js'
import AsyncBoundary from '../../components/feedback/AsyncBoundary.jsx'
import StockInView, { StockOutView } from './StockInView.jsx'
import StockAdjustmentView from './StockAdjustmentView.jsx'
import StockHistoryView from './StockHistoryView.jsx'
import CategoriesView from '../products/CategoriesPage.jsx'
import '../../styles/stock-ledger.css'
import '../../styles/inventory-dashboard.css'

function InventoryOperations({ section, business, account, onNavigate, canNavigate }) {
  const load = useCallback(() => Promise.all([productApi.list(), inventoryApi.transactions()]), [])
  const { data, loading, error, refetch, setData } = useResource(load, [], [[], []])
  const [products, transactions] = data
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleStockSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    const form = event.currentTarget
    const data = new FormData(form)
    const productId = data.get('productId')
    const quantity = Number(data.get('quantity'))
    if (!productId || Number.isNaN(quantity) || quantity < 0) {
      setMessage({ type: 'error', text: 'Select a product and enter a valid quantity.' })
      return
    }
    setSaving(true)
    try {
      await inventoryApi.recordOperation({ section, productId, quantity, reason: (data.get('reason') || '').trim() })
      const [freshProducts, freshTransactions] = await Promise.all([productApi.list(), inventoryApi.transactions()])
      setData([freshProducts, freshTransactions])
      const product = freshProducts.find((item) => item.productId === productId)
      setMessage({
        type: 'success',
        text: `${section} recorded${product ? ` for ${product.name}. New stock: ${product.currentStock} ${product.unit}.` : '.'}`,
      })
      form.reset()
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || `Could not record the ${section.toLowerCase()}.` })
    } finally {
      setSaving(false)
    }
  }

  if (section === 'Stock') {
    return (
      <StockLedgerView
        products={products}
        loading={loading}
        error={error}
        refetch={refetch}
        business={business}
        onNavigate={onNavigate}
      />
    )
  }

  if (section === 'Stock In') {
    return (
      <StockInView
        products={products}
        transactions={transactions}
        business={business}
        account={account}
        loading={loading}
        error={error}
        refetch={refetch}
        saving={saving}
        message={message}
        onSubmit={handleStockSubmit}
        onNavigate={onNavigate}
        canNavigate={canNavigate}
      />
    )
  }

  if (section === 'Stock Out') {
    return (
      <StockOutView
        products={products}
        transactions={transactions}
        business={business}
        account={account}
        loading={loading}
        error={error}
        refetch={refetch}
        saving={saving}
        message={message}
        onSubmit={handleStockSubmit}
        onNavigate={onNavigate}
        canNavigate={canNavigate}
      />
    )
  }

  if (section === 'Adjustments') {
    return (
      <StockAdjustmentView
        products={products}
        transactions={transactions}
        business={business}
        account={account}
        loading={loading}
        error={error}
        refetch={refetch}
        saving={saving}
        message={message}
        onSubmit={handleStockSubmit}
        onNavigate={onNavigate}
      />
    )
  }

  if (section === 'Stock History') {
    return (
      <StockHistoryView
        transactions={transactions}
        products={products}
        business={business}
        loading={loading}
        error={error}
        refetch={refetch}
        onNavigate={onNavigate}
      />
    )
  }

  if (section === 'Categories') {
    return (
      <CategoriesView
        products={products}
        business={business}
        loading={loading}
        error={error}
        refetch={refetch}
        onNavigate={onNavigate}
      />
    )
  }

  return (
    <div className="modern-dashboard-content inventory-dashboard-page">
      <header className="inventory-page-header">
        <div className="inventory-header-left">
          <div className="inventory-header-title-row">
            <h1>{section}</h1>
            <span className="inventory-live-badge">
              <i /> Live Mode
            </span>
          </div>
          <p className="inventory-header-sub">Business inventory operations for <strong>{business.name}</strong></p>
        </div>
      </header>
      <AsyncBoundary loading={loading} error={error} onRetry={refetch} isEmpty={!products.length} emptyText="No products in this workspace yet.">
        <StockTable products={products} business={business} />
      </AsyncBoundary>
    </div>
  )
}

function StockLedgerView({ products = [], loading, error, refetch, business = {}, onNavigate }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [sortOrder, setSortOrder] = useState('default')
  const [selected, setSelected] = useState([])
  const [page, setPage] = useState(1)
  const [tableOpen, setTableOpen] = useState(true)
  const pageSize = 10

  const categories = useMemo(() => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(), [products])

  const counts = useMemo(() => products.reduce((result, product) => {
    const stock = Number(product.currentStock || 0)
    const minimum = Number(product.minimumStock || 10)
    result.units += stock
    result.value += stock * Number(product.purchasePrice || 0)
    if (stock === 0) result.out += 1
    else if (stock <= minimum) result.low += 1
    else result.in += 1
    return result
  }, { units: 0, value: 0, in: 0, low: 0, out: 0 }), [products])

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    let list = products.filter((product) => {
      const stock = Number(product.currentStock || 0)
      const minimum = Number(product.minimumStock || 10)
      const stockStatus = stock === 0 ? 'out' : stock <= minimum ? 'low' : 'in'
      const matchesSearch = !query || `${product.name} ${product.sku} ${product.category} ${product.brand || ''} ${product.rackLocation || ''}`.toLowerCase().includes(query)
      return matchesSearch && (status === 'all' || status === stockStatus) && (category === 'all' || category === product.category)
    })

    if (sortOrder === 'high') {
      list = [...list].sort((a, b) => Number(b.currentStock || 0) - Number(a.currentStock || 0))
    } else if (sortOrder === 'low') {
      list = [...list].sort((a, b) => Number(a.currentStock || 0) - Number(b.currentStock || 0))
    }

    return list
  }, [products, search, status, category, sortOrder])

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const currentItems = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const allVisibleSelected = currentItems.length > 0 && currentItems.every((product) => selected.includes(product.productId))

  const money = (value) => {
    const currency = business.currency || 'INR'
    const amount = Number(value || 0)
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
    } catch {
      return `${currency} ${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    }
  }

  const exportLedger = () => {
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const rows = [
      ['Product', 'SKU', 'Category', 'Bin / Rack', 'Available Stock', 'Unit', 'Unit Price', 'Status'],
      ...visible.map((product) => {
        const stock = Number(product.currentStock || 0)
        return [
          product.name,
          product.sku,
          product.category,
          product.rackLocation || product.warehouse || 'Unassigned',
          stock,
          product.unit || 'units',
          product.sellingPrice,
          stock === 0 ? 'Out of stock' : stock <= Number(product.minimumStock || 10) ? 'Low stock' : 'In stock',
        ]
      }),
    ]
    const blob = new Blob([rows.map((row) => row.map(escape).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stock-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const toggleAll = () =>
    setSelected(
      allVisibleSelected
        ? selected.filter((id) => !currentItems.some((product) => product.productId === id))
        : [...new Set([...selected, ...currentItems.map((product) => product.productId)])]
    )

  return (
    <div className="modern-dashboard-content inventory-dashboard-page" aria-busy={loading}>
      {/* 1. Header Toolbar */}
      <header className="inventory-page-header">
        <div className="inventory-header-left">
          <div className="inventory-header-title-row">
            <h1>Stock Ledger &amp; Balance</h1>
            <span className={`inventory-live-badge ${error ? 'is-error' : ''}`}>
              <i /> Live Ledger
            </span>
          </div>
          <p className="inventory-header-sub">
            Real-time SKU balances, warehouse cost valuation, and inventory thresholds for <strong>{business.name}</strong>.
          </p>
        </div>

        <div className="inventory-header-actions">
          <button type="button" onClick={exportLedger} disabled={!visible.length}>
            ⇩ Export CSV
          </button>
          <button type="button" onClick={() => onNavigate?.('Adjustments')}>
            ⌁ Audit Count
          </button>
          <button className="primary" type="button" onClick={() => onNavigate?.('Stock In')}>
            ＋ Inward Stock
          </button>
        </div>
      </header>

      {/* 2. Top Metric KPI 4 Cards */}
      <div className="modern-kpi-row">
        {/* KPI 1: Units on hand */}
        <div className="modern-kpi-card" tabIndex={0} role="region" aria-label="Total units on hand">
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Total Units on Hand</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : counts.units.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 500 }}>
              Across {products.length} catalogued SKUs
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-blue" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3 9 5-9 5-9-5 9-5Z" />
              <path d="m3 13 9 5 9-5" />
              <path d="m3 18 9 5 9-5" />
            </svg>
          </div>
        </div>

        {/* KPI 2: Inventory valuation */}
        <div className="modern-kpi-card" tabIndex={0} role="region" aria-label="Inventory valuation">
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Inventory Valuation</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : money(counts.value)}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--success)', fontWeight: 600 }}>
              Weighted purchase cost
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-green" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>

        {/* KPI 3: Critical low stock */}
        <div
          className="modern-kpi-card"
          tabIndex={0}
          role="button"
          onClick={() => {
            setStatus('low')
            setPage(1)
          }}
          aria-label="Filter critical low stock"
        >
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Critical Low Stock</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : counts.low + counts.out}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--danger)', fontWeight: 600 }}>
              {counts.out > 0 ? `${counts.out} out of stock · ${counts.low} low` : 'At or below threshold'}
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-rose" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>

        {/* KPI 4: Catalog density */}
        <div
          className="modern-kpi-card"
          tabIndex={0}
          role="button"
          onClick={() => onNavigate?.('Categories')}
          aria-label="View categories"
        >
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Catalog Density</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : products.length}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 500 }}>
              {categories.length} categories active
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-purple" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. The Stock Ledger Table (Dashboard invoice-style-panel) */}
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
                📊
              </span>
              <span>Stock Ledger &amp; Warehouse Inventory</span>
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
            {/* Controls Row: Search + Filter Selects + Quick Tab Buttons */}
            <div className="invoice-controls-row">
              <div className="invoice-controls-left">
                <div className="invoice-search-wrap">
                  <input
                    type="text"
                    className="invoice-search-input"
                    aria-label="Search stock ledger"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value)
                      setPage(1)
                    }}
                    placeholder="Search product, SKU, tag, rack…"
                  />
                  <span className="invoice-search-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </span>
                </div>

                <select
                  className="invoice-select"
                  aria-label="Filter stock category"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">All categories</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  className="invoice-select"
                  aria-label="Filter stock status"
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">All items ({products.length})</option>
                  <option value="in">In stock ({counts.in})</option>
                  <option value="low">Low stock ({counts.low})</option>
                  <option value="out">Out of stock ({counts.out})</option>
                </select>

                <select
                  className="invoice-select"
                  aria-label="Sort stock ledger"
                  value={sortOrder}
                  onChange={(event) => {
                    setSortOrder(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="default">Default order</option>
                  <option value="high">Stock: High to Low</option>
                  <option value="low">Stock: Low to High</option>
                </select>
              </div>

              <button
                type="button"
                className="invoice-primary-btn"
                onClick={() => onNavigate?.('Stock In')}
              >
                + Inward Stock
              </button>
            </div>

            {/* The Table */}
            <AsyncBoundary
              loading={loading}
              error={error}
              onRetry={refetch}
              isEmpty={!visible.length}
              emptyText={products.length ? 'No products match these filters.' : 'No products in this workspace yet.'}
            >
              <div className="invoice-table-wrap">
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th style={{ width: '42px' }}>
                        <input
                          type="checkbox"
                          className="invoice-checkbox"
                          aria-label="Select all visible products"
                          checked={allVisibleSelected}
                          onChange={toggleAll}
                        />
                      </th>
                      <th style={{ width: '100px' }}>SKU</th>
                      <th>Product &amp; Variant</th>
                      <th>Category</th>
                      <th>Bin Location</th>
                      <th>Available Stock</th>
                      <th>Selling Price</th>
                      <th>Stock Status</th>
                      <th style={{ textAlign: 'right', paddingRight: '20px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((product) => {
                      const stock = Number(product.currentStock || 0)
                      const minimum = Number(product.minimumStock || 10)
                      const state = stock === 0 ? 'out' : stock <= minimum ? 'low' : 'in'
                      const isSelected = selected.includes(product.productId)

                      const pillClass = state === 'out'
                        ? 'pill-out'
                        : state === 'low'
                        ? 'pill-pending'
                        : 'pill-delivered'

                      const statusText = state === 'out'
                        ? 'Out of Stock'
                        : state === 'low'
                        ? 'Low Stock'
                        : 'In Stock'

                      return (
                        <tr
                          key={product.productId}
                          className={isSelected ? 'is-selected' : ''}
                        >
                          <td>
                            <input
                              type="checkbox"
                              className="invoice-checkbox"
                              aria-label={`Select ${product.name}`}
                              checked={isSelected}
                              onChange={() =>
                                setSelected((current) =>
                                  current.includes(product.productId)
                                    ? current.filter((id) => id !== product.productId)
                                    : [...current, product.productId]
                                )
                              }
                            />
                          </td>
                          <td className="invoice-cell-id">
                            <strong>{product.sku || product.productId.slice(-6)}</strong>
                          </td>
                          <td className="invoice-cell-name">
                            <span className="invoice-product-title">{product.name}</span>
                            <small className="invoice-product-sub">
                              {[product.brand, product.color, product.size].filter(Boolean).join(' · ') || 'General catalog'}
                            </small>
                          </td>
                          <td className="invoice-cell-category">
                            {product.category || 'Uncategorised'}
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            <code style={{ padding: '2px 6px', background: 'var(--surface-muted)', borderRadius: '4px', fontSize: '11px' }}>
                              {product.rackLocation || product.warehouse || 'Unassigned'}
                            </code>
                          </td>
                          <td className="invoice-cell-cost">
                            <strong>{stock.toLocaleString('en-IN')}</strong>{' '}
                            <small style={{ color: 'var(--muted)', fontWeight: 500 }}>
                              {product.unit || 'unit'}
                            </small>
                          </td>
                          <td className="invoice-cell-cost">
                            {money(product.sellingPrice)}
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
                                onClick={() => onNavigate?.('Adjustments')}
                                title={`Adjust stock for ${product.name}`}
                              >
                                Reconcile
                              </button>
                              <button
                                type="button"
                                className="invoice-action-btn action-view"
                                onClick={() => onNavigate?.('Products')}
                                title={`View product ${product.name}`}
                                aria-label={`View ${product.name}`}
                              >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <footer className="overview-pagination invoice-pagination">
                <span>
                  Showing {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, visible.length)} of {visible.length} products
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

function StockTable({ products = [], business = {} }) {
  const money = (val) => `${business.currency || 'INR'} ${Number(val || 0).toFixed(2)}`
  return (
    <div className="invoice-table-wrap">
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Selling Price</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const stock = Number(product.currentStock || 0)
            const minimum = Number(product.minimumStock || 10)
            const isOut = stock === 0
            const isLow = stock <= minimum && !isOut
            return (
              <tr key={product.productId}>
                <td className="invoice-cell-name">
                  <span className="invoice-product-title">{product.name}</span>
                  <small className="invoice-product-sub">{product.sku}</small>
                </td>
                <td className="invoice-cell-category">{product.category}</td>
                <td className="invoice-cell-cost">{stock} {product.unit}</td>
                <td className="invoice-cell-cost">{money(product.sellingPrice)}</td>
                <td>
                  <span className={`invoice-pill ${isOut ? 'pill-out' : isLow ? 'pill-pending' : 'pill-delivered'}`}>
                    {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default InventoryOperations
