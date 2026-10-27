import { useEffect, useMemo, useRef, useState } from 'react'
import AsyncBoundary from '../../components/feedback/AsyncBoundary.jsx'
import '../../styles/stock-adjustments.css'
import '../../styles/inventory-dashboard.css'

function AdjustmentIcon({ name, size = 18, className = '', ...props }) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    export: <><path d="M12 3v12m-4-4 4 4 4-4" /><path d="M5 18v3h14v-3" /></>,
    log: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    arrow: <path d="M4 12h15m-5-5 5 5-5 5" />,
    scale: <><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></>,
    variance: <><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></>,
    alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    money: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}

export default function StockAdjustmentView({
  products = [],
  transactions = [],
  business = {},
  account,
  loading,
  error,
  refetch,
  saving,
  message,
  onSubmit,
  onNavigate,
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [stockStatus, setStockStatus] = useState('all')
  const [sortOrder, setSortOrder] = useState('default')
  const [selectedId, setSelectedId] = useState('')
  const [newQuantity, setNewQuantity] = useState('')
  const [selectedKeys, setSelectedKeys] = useState([])
  const [page, setPage] = useState(1)
  const [tableOpen, setTableOpen] = useState(true)
  const pageSize = 10

  const productRef = useRef(null)
  const quantityRef = useRef(null)
  const searchRef = useRef(null)
  const formRef = useRef(null)

  const selectedProduct = products.find((product) => product.productId === selectedId)
  const currency = business.currency || 'INR'

  const formatMoney = (value) => {
    const amount = Number(value || 0)
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
    } catch {
      return `${currency} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }

  const summary = useMemo(() => {
    const entries = transactions.filter((item) => item.type === 'adjustment')
    const latest = new Map()
    for (const entry of entries) {
      const previous = latest.get(entry.productId)
      if (!previous || new Date(entry.createdAt) > new Date(previous.createdAt)) {
        latest.set(entry.productId, entry)
      }
    }
    const netVariance = entries.reduce(
      (sum, item) => sum + Number(item.newStock || 0) - Number(item.previousStock || 0),
      0
    )
    const valueImpact = entries.reduce((sum, item) => {
      const product = products.find((candidate) => candidate.productId === item.productId)
      return (
        sum +
        (Number(item.newStock || 0) - Number(item.previousStock || 0)) *
          Number(product?.purchasePrice || 0)
      )
    }, 0)
    return {
      entries,
      latest,
      netVariance,
      valueImpact,
      categories: [...new Set(products.map((item) => item.category).filter(Boolean))].sort(),
      flaggedCount: products.filter(
        (item) => Number(item.currentStock || 0) <= Number(item.minimumStock || 10)
      ).length,
    }
  }, [products, transactions])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    let list = products.filter((product) => {
      const stock = Number(product.currentStock || 0)
      const minimum = Number(product.minimumStock || 10)
      const isOutOfStock = stock === 0
      const isLowStock = stock <= minimum && !isOutOfStock
      const hasAdjustment = summary.latest.has(product.productId)

      const matchesSearch =
        !query ||
        [product.name, product.sku, product.barcode, product.category, product.genericName, product.batchNumber, product.manufacturer, product.size, product.color, product.brand]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)

      const matchesCategory = category === 'all' || product.category === category

      const matchesStatus =
        stockStatus === 'all' ||
        (stockStatus === 'flagged' && (isLowStock || isOutOfStock)) ||
        (stockStatus === 'adjusted' && hasAdjustment) ||
        (stockStatus === 'in' && stock > minimum) ||
        (stockStatus === 'out' && isOutOfStock)

      return matchesSearch && matchesCategory && matchesStatus
    })

    if (sortOrder === 'high') {
      list = [...list].sort((a, b) => Number(b.currentStock || 0) - Number(a.currentStock || 0))
    } else if (sortOrder === 'low') {
      list = [...list].sort((a, b) => Number(a.currentStock || 0) - Number(b.currentStock || 0))
    }

    return list
  }, [products, search, category, stockStatus, sortOrder, summary.latest])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const currentItems = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const allCurrentSelected =
    currentItems.length > 0 && currentItems.every((product) => selectedKeys.includes(product.productId))

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedKeys((prev) => [
        ...new Set([...prev, ...currentItems.map((p) => p.productId)]),
      ])
    } else {
      setSelectedKeys((prev) =>
        prev.filter((id) => !currentItems.some((p) => p.productId === id))
      )
    }
  }

  const toggleSelectItem = (id) => {
    setSelectedKeys((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      } else if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'j') {
        event.preventDefault()
        productRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const startAdjustment = (product) => {
    if (saving) return
    setSelectedId(product.productId)
    setNewQuantity(String(product.currentStock ?? 0))
    if (productRef.current) productRef.current.value = product.productId
    formRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setTimeout(() => {
      quantityRef.current?.focus()
      quantityRef.current?.select()
    }, 100)
  }

  const exportAdjustments = () => {
    const escapeCell = (value) => {
      const text = String(value ?? '')
      const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text
      return `"${safe.replaceAll('"', '""')}"`
    }
    const rows = [
      ['Date', 'Product', 'SKU', 'Previous Stock', 'New Stock', 'Variance', 'Reason'],
      ...summary.entries.map((entry) => {
        const product = products.find((item) => item.productId === entry.productId)
        return [
          entry.createdAt,
          product?.name || entry.productId,
          product?.sku || '',
          entry.previousStock,
          entry.newStock,
          Number(entry.newStock || 0) - Number(entry.previousStock || 0),
          entry.reason,
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
    link.download = `inventory-adjustments-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const selectedVariance =
    selectedProduct && newQuantity !== ''
      ? Number(newQuantity) - Number(selectedProduct.currentStock || 0)
      : null

  return (
    <div className="modern-dashboard-content inventory-dashboard-page" aria-busy={loading}>
      {/* 1. Header Toolbar */}
      <header className="inventory-page-header">
        <div className="inventory-header-left">
          <div className="inventory-header-title-row">
            <h1>Stock Adjustments &amp; Reconciliation</h1>
            <span className={`inventory-live-badge ${error ? 'is-error' : ''}`}>
              <i /> Live Reconciliation
            </span>
          </div>
          <p className="inventory-header-sub">
            Reconcile physical counts with digital balances and maintain an immutable discrepancy audit trail for{' '}
            <strong>{business.name}</strong>.
          </p>
        </div>

        <div className="inventory-header-actions">
          <button type="button" onClick={() => searchRef.current?.focus()}>
            <AdjustmentIcon name="search" /> Find Product
          </button>
          <button
            type="button"
            onClick={exportAdjustments}
            disabled={loading || !!error || !summary.entries.length}
          >
            <AdjustmentIcon name="export" /> Export CSV ({summary.entries.length})
          </button>
          {onNavigate && (
            <button
              type="button"
              className="primary"
              onClick={() => onNavigate('Stock History')}
            >
              <AdjustmentIcon name="log" /> Audit Log
            </button>
          )}
        </div>
      </header>

      {/* 2. Top Metric KPI 4 Cards Grid */}
      <div className="modern-kpi-row">
        {/* KPI 1: Recent Adjustments Logged */}
        <div className="modern-kpi-card" tabIndex={0} role="region" aria-label="Recent adjustments">
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Adjustments Logged</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : summary.entries.length}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 500 }}>
              Across {summary.latest.size} distinct items
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-blue" aria-hidden="true">
            <AdjustmentIcon name="scale" />
          </div>
        </div>

        {/* KPI 2: Net Quantity Variance */}
        <div className="modern-kpi-card" tabIndex={0} role="region" aria-label="Net variance">
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Net Unit Variance</span>
            <span className="modern-kpi-value">
              {loading || error
                ? '—'
                : `${summary.netVariance > 0 ? '+' : ''}${summary.netVariance}`}
            </span>
            <span
              style={{
                fontSize: '11.5px',
                color: summary.netVariance >= 0 ? 'var(--success)' : 'var(--danger)',
                fontWeight: 600,
              }}
            >
              {summary.netVariance >= 0 ? 'Net positive discrepancy' : 'Net shrinkage / deduction'}
            </span>
          </div>
          <div
            className={`modern-kpi-icon-bubble ${
              summary.netVariance >= 0 ? 'bubble-yellow' : 'bubble-rose'
            }`}
            aria-hidden="true"
          >
            <AdjustmentIcon name="variance" />
          </div>
        </div>

        {/* KPI 3: Cost Impact */}
        <div className="modern-kpi-card" tabIndex={0} role="region" aria-label="Cost impact">
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Estimated Cost Impact</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : formatMoney(summary.valueImpact)}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 500 }}>
              Variance × unit cost
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-green" aria-hidden="true">
            <AdjustmentIcon name="money" />
          </div>
        </div>

        {/* KPI 4: Needing Review */}
        <div
          className="modern-kpi-card"
          tabIndex={0}
          role="button"
          onClick={() => {
            setStockStatus('flagged')
            setPage(1)
          }}
          aria-label="Filter items needing review"
        >
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Needing Review</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : summary.flaggedCount}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--danger)', fontWeight: 600 }}>
              At or below minimum threshold
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-rose" aria-hidden="true">
            <AdjustmentIcon name="alert" />
          </div>
        </div>
      </div>

      {/* 3. Fast Adjustment / Reconciliation Terminal Card */}
      <section className="inventory-terminal-panel" aria-labelledby="adjustment-terminal-title">
        <div className="inventory-terminal-header">
          <div className="inventory-terminal-title-group">
            <div className="inventory-terminal-icon bubble-yellow">
              <AdjustmentIcon name="scale" />
            </div>
            <div>
              <h3 id="adjustment-terminal-title">
                Record Inventory Adjustment
                <span className="inventory-terminal-badge">Audit Reconciliation</span>
              </h3>
            </div>
          </div>
          <kbd className="inventory-kbd-shortcut">Alt + J</kbd>
        </div>

        <div className="inventory-terminal-body">
          <form
            ref={formRef}
            onSubmit={onSubmit}
            onReset={() => {
              setSelectedId('')
              setNewQuantity('')
            }}
          >
            <div className="inventory-form-grid" style={{ gridTemplateColumns: 'minmax(220px, 1.5fr) minmax(130px, 0.7fr) minmax(150px, 0.9fr) minmax(170px, 1.1fr) minmax(140px, 0.8fr)' }}>
              {/* Product Select */}
              <div className="inventory-field">
                <label htmlFor="adj-product" className="inventory-field-label">
                  Product / SKU <span className="inventory-field-required">*</span>
                </label>
                <div className="inventory-select-wrap">
                  <select
                    ref={productRef}
                    id="adj-product"
                    name="productId"
                    value={selectedId}
                    required
                    disabled={saving}
                    className="inventory-select"
                    onChange={(event) => {
                      const id = event.target.value
                      const product = products.find((item) => item.productId === id)
                      setSelectedId(id)
                      setNewQuantity(product ? String(product.currentStock ?? 0) : '')
                    }}
                  >
                    <option value="" disabled>Select product to reconcile…</option>
                    {products.map((product) => (
                      <option key={product.productId} value={product.productId}>
                        {product.name} ({product.sku}){product.batchNumber ? ` · Batch: ${product.batchNumber}` : ''}{product.expiryDate ? ` · Exp: ${String(product.expiryDate).slice(0, 10)}` : ''} · {product.currentStock} {product.unit} current
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Current Stock Preview */}
              <div className="inventory-field">
                <label className="inventory-field-label">Current Stock</label>
                <div
                  className="inventory-input"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                  }}
                >
                  <strong>{selectedProduct ? Number(selectedProduct.currentStock || 0).toLocaleString('en-IN') : '—'}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>{selectedProduct?.unit || 'units'}</span>
                </div>
              </div>

              {/* New Physical Count Quantity */}
              <div className="inventory-field">
                <label htmlFor="adj-quantity" className="inventory-field-label">
                  New Quantity <span className="inventory-field-required">*</span>
                </label>
                <div className="inventory-input-wrap">
                  <input
                    ref={quantityRef}
                    id="adj-quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    step="1"
                    value={newQuantity}
                    onChange={(event) => setNewQuantity(event.target.value)}
                    required
                    disabled={saving}
                    placeholder="0"
                    className="inventory-input inventory-input-qty"
                    style={{ paddingRight: selectedVariance !== null ? '75px' : '40px' }}
                  />
                  {selectedVariance !== null && (
                    <span
                      className={`inventory-variance-tag ${
                        selectedVariance >= 0 ? 'positive' : 'negative'
                      }`}
                    >
                      {selectedVariance > 0 ? `+${selectedVariance}` : selectedVariance}
                    </span>
                  )}
                </div>
              </div>

              {/* Reason / Audit Note */}
              <div className="inventory-field">
                <label htmlFor="adj-reason" className="inventory-field-label">
                  Reason / Note <span className="inventory-field-optional">(optional)</span>
                </label>
                <div className="inventory-input-wrap">
                  <input
                    id="adj-reason"
                    name="reason"
                    list="adj-reasons"
                    placeholder="Physical count correction"
                    disabled={saving}
                    className="inventory-input"
                  />
                </div>
                <datalist id="adj-reasons">
                  {[
                    'Physical count correction',
                    'Damaged stock',
                    'Shrinkage / discrepancy',
                    'Opening balance correction',
                    'Audit reconciliation',
                    'Found unrecorded stock',
                  ].map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>

              {/* Submit Button */}
              <div className="inventory-submit-col">
                <button
                  type="submit"
                  disabled={saving}
                  className="inventory-submit-btn"
                >
                  <span>{saving ? 'Recording…' : 'Record'}</span>
                  <AdjustmentIcon name="arrow" size={16} />
                </button>
              </div>
            </div>

            {/* Context Meta Row */}
            <div className="inventory-context-row">
              <div className="inventory-context-tile">
                <div className="inventory-context-icon" aria-hidden="true">📍</div>
                <div className="inventory-context-content">
                  <span className="inventory-context-label">Rack / Bin Location</span>
                  <span className={`inventory-context-val ${!selectedProduct ? 'is-placeholder' : ''}`}>
                    {selectedProduct
                      ? selectedProduct.rackLocation || selectedProduct.warehouse || 'Unassigned'
                      : 'Select product to inspect location'}
                  </span>
                </div>
              </div>
              <div className="inventory-context-tile">
                <div className="inventory-context-icon" aria-hidden="true">💰</div>
                <div className="inventory-context-content">
                  <span className="inventory-context-label">Unit Cost Value ({currency})</span>
                  <span className={`inventory-context-val ${!selectedProduct ? 'is-placeholder' : ''}`}>
                    {selectedProduct ? formatMoney(selectedProduct.purchasePrice) : '—'}
                  </span>
                </div>
              </div>
              <div className="inventory-context-tile">
                <div className="inventory-context-icon" aria-hidden="true">⚖️</div>
                <div className="inventory-context-content">
                  <span className="inventory-context-label">Authorized Auditor</span>
                  <span className="inventory-context-val">
                    {account?.name || account?.email || 'Current Auditor'} ({account?.role || 'Staff'})
                  </span>
                </div>
              </div>
            </div>
          </form>

          {/* Feedback Status */}
          {message && (
            <div
              className={`inventory-status-alert ${message.type}`}
              role={message.type === 'error' ? 'alert' : 'status'}
            >
              <span>{message.type === 'error' ? '⚠️' : '✅'}</span>
              <span>{message.text}</span>
            </div>
          )}
        </div>
      </section>

      {/* 4. Physical Count & Reconciliation Ledger (Dashboard invoice-style-panel) */}
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
                ⚖️
              </span>
              <span>Stock Reconciliation Ledger &amp; Discrepancy Audit</span>
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
            {/* Controls Row: Search + Filter Selects */}
            <div className="invoice-controls-row">
              <div className="invoice-controls-left">
                <div className="invoice-search-wrap">
                  <input
                    ref={searchRef}
                    type="text"
                    className="invoice-search-input"
                    aria-label="Search adjustment products"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value)
                      setPage(1)
                    }}
                    placeholder="Search product, SKU, barcode, brand…"
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
                  aria-label="Filter by category"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">All categories ({products.length})</option>
                  {summary.categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  className="invoice-select"
                  aria-label="Filter by reconciliation status"
                  value={stockStatus}
                  onChange={(event) => {
                    setStockStatus(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">All items</option>
                  <option value="flagged">Needs Review / Low Stock ({summary.flaggedCount})</option>
                  <option value="adjusted">Adjusted in History ({summary.latest.size})</option>
                  <option value="in">In Stock (Healthy)</option>
                  <option value="out">Out of Stock</option>
                </select>

                <select
                  className="invoice-select"
                  aria-label="Sort products"
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
                onClick={exportAdjustments}
                disabled={!summary.entries.length}
              >
                Export CSV
              </button>
            </div>

            {/* The Table */}
            <AsyncBoundary
              loading={loading}
              error={error}
              onRetry={refetch}
              isEmpty={!filteredProducts.length}
              emptyText={
                products.length
                  ? 'No items match your filter criteria.'
                  : 'No products in this workspace yet.'
              }
            >
              <div className="invoice-table-wrap">
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th style={{ width: '42px' }}>
                        <input
                          type="checkbox"
                          className="invoice-checkbox"
                          aria-label="Select all products"
                          checked={allCurrentSelected}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th style={{ width: '100px' }}>SKU</th>
                      <th>Product &amp; Details</th>
                      <th>Category</th>
                      <th>Current Balance</th>
                      <th>Last Adjustment</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right', paddingRight: '20px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((product) => {
                      const stock = Number(product.currentStock || 0)
                      const minimum = Number(product.minimumStock || 10)
                      const isOutOfStock = stock === 0
                      const isLowStock = stock <= minimum && !isOutOfStock
                      const latest = summary.latest.get(product.productId)
                      const isSelected = selectedKeys.includes(product.productId)

                      const pillClass = isOutOfStock
                        ? 'pill-out'
                        : isLowStock
                        ? 'pill-pending'
                        : 'pill-delivered'

                      const statusText = isOutOfStock
                        ? 'Out of Stock'
                        : isLowStock
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
                              onChange={() => toggleSelectItem(product.productId)}
                            />
                          </td>
                          <td className="invoice-cell-id">
                            <strong>{product.sku || product.productId.slice(-6)}</strong>
                          </td>
                          <td className="invoice-cell-name">
                            <span className="invoice-product-title">{product.name}</span>
                            <small className="invoice-product-sub">
                              {[
                                product.genericName,
                                product.batchNumber ? `Batch ${product.batchNumber}` : '',
                                product.expiryDate ? `Exp: ${String(product.expiryDate).slice(0, 10)}` : '',
                                product.brand,
                                product.size ? `Size: ${product.size}` : '',
                                product.color,
                              ]
                                .filter(Boolean)
                                .join(' · ') || 'Standard variant'}
                            </small>
                          </td>
                          <td className="invoice-cell-category">
                            {product.category || 'General'}
                          </td>
                          <td className="invoice-cell-cost">
                            <strong>{stock.toLocaleString('en-IN')}</strong>{' '}
                            <small style={{ color: 'var(--muted)', fontWeight: 500 }}>
                              {product.unit || 'units'}
                            </small>
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            {latest ? (
                              <div>
                                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                                  {new Date(latest.createdAt).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                                <small style={{ display: 'block', color: 'var(--muted)', fontSize: '11px' }}>
                                  {latest.previousStock} → {latest.newStock} · {latest.reason || 'Reconciliation'}
                                </small>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--muted)' }}>No prior adjustment</span>
                            )}
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
                                disabled={saving}
                                title={`Reconcile physical stock for ${product.name}`}
                                onClick={() => startAdjustment(product)}
                              >
                                Reconcile
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
                  {Math.min(currentPage * pageSize, filteredProducts.length)} of{' '}
                  {filteredProducts.length} products
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
