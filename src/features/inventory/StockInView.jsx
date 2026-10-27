import { useEffect, useMemo, useRef, useState } from 'react'
import AsyncBoundary from '../../components/feedback/AsyncBoundary.jsx'
import { resolveBusinessCapabilities } from '../../../shared/industryConfig.js'
import '../../styles/stock-in.css'
import '../../styles/inventory-dashboard.css'

function InwardIcon({ name, size = 18, className = '', ...props }) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    import: <><path d="M7 17H5a3 3 0 0 1-.5-6A7.5 7.5 0 0 1 19 9a4 4 0 0 1 0 8h-2M12 21V10m-4 4 4-4 4 4" /></>,
    history: <><path d="M7 3h7l4 4v14H6V3h1Zm7 0v5h4M9 12h6M9 16h6" /></>,
    arrow: <path d="M4 12h15m-5-5 5 5-5 5" />,
    box: <><path d="m12 3 9 5v9l-9 5-9-5V8l9-5Zm0 9 9-4M3 8l9 4v10M7.5 5.5l9 5" /></>,
    trend: <path d="M3 17l7-7 4 4 7-7M17 6h4v4" />,
    alert: <><circle cx="12" cy="12" r="9" /><polyline points="12 6 12 12 16 14" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5M3 18l9 5 9-5" /></>,
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

export default function StockInView(props) {
  return <StockMovementView {...props} />
}

export function StockOutView(props) {
  return <StockMovementView {...props} outward />
}

function StockMovementView({
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
  canNavigate,
  outward = false,
}) {
  const capabilities = useMemo(() => business?.capabilities || resolveBusinessCapabilities(business || {}), [business])
  const movementLabel = outward ? 'outward' : 'inward'
  const operationLabel = outward ? 'Record Stock Out' : 'Record Stock In'
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [stockStatus, setStockStatus] = useState('all')
  const [sortOrder, setSortOrder] = useState('default')
  const [selectedId, setSelectedId] = useState('')
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

  const money = (value) => {
    const amount = Number(value || 0)
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
    } catch {
      return `${currency} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }

  const summary = useMemo(() => {
    const entries = transactions.filter((item) => item.type === (outward ? 'stock_out' : 'stock_in'))
    const latest = new Map()
    for (const transaction of entries) {
      const previous = latest.get(transaction.productId)
      if (!previous || new Date(transaction.createdAt) > new Date(previous.createdAt)) {
        latest.set(transaction.productId, transaction)
      }
    }
    return {
      entries,
      inwardCount: entries.length,
      inwardUnits: entries.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      lowCount: products.filter((item) => Number(item.currentStock || 0) <= Number(item.minimumStock || 10) && Number(item.currentStock || 0) > 0).length,
      outOfStockCount: products.filter((item) => Number(item.currentStock || 0) === 0).length,
      categories: [...new Set(products.map((item) => item.category).filter(Boolean))].sort(),
      value: products.reduce((sum, item) => sum + Number(item.currentStock || 0) * Number(item.purchasePrice || 0), 0),
      latest,
    }
  }, [products, transactions, outward])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    let list = products.filter((product) => {
      const stock = Number(product.currentStock || 0)
      const minimum = Number(product.minimumStock || 10)
      const isOutOfStock = stock === 0
      const isLowStock = stock <= minimum && !isOutOfStock

      const matchesSearch = !query || [
        product.name,
        product.sku,
        product.barcode,
        product.category,
        product.genericName,
        product.batchNumber,
        product.manufacturer,
        product.size,
        product.color,
        product.brand,
      ].filter(Boolean).join(' ').toLowerCase().includes(query)

      const matchesCategory = category === 'all' || product.category === category

      const matchesStatus =
        stockStatus === 'all' ||
        (stockStatus === 'in' && stock > minimum) ||
        (stockStatus === 'low' && isLowStock) ||
        (stockStatus === 'out' && isOutOfStock)

      return matchesSearch && matchesCategory && matchesStatus
    })

    if (sortOrder === 'high') {
      list = [...list].sort((a, b) => Number(b.currentStock || 0) - Number(a.currentStock || 0))
    } else if (sortOrder === 'low') {
      list = [...list].sort((a, b) => Number(a.currentStock || 0) - Number(b.currentStock || 0))
    }

    return list
  }, [products, search, category, stockStatus, sortOrder])

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
      } else if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === (outward ? 'o' : 'i')) {
        event.preventDefault()
        productRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [outward])

  const startInward = (product) => {
    if (saving) return
    setSelectedId(product.productId)
    if (productRef.current) productRef.current.value = product.productId
    formRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setTimeout(() => {
      quantityRef.current?.focus()
      quantityRef.current?.select()
    }, 100)
  }

  const exportDispatches = () => {
    const escapeCell = (value) => {
      const text = String(value ?? '')
      const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text
      return `"${safe.replaceAll('"', '""')}"`
    }
    const rows = [
      ['Date', 'Product', 'SKU', 'Quantity', 'Reason'],
      ...summary.entries.map((entry) => {
        const product = products.find((item) => item.productId === entry.productId)
        return [
          entry.createdAt,
          product?.name || entry.productId,
          entry.variantSku || product?.sku || '',
          entry.quantity,
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
    link.download = `${outward ? 'stock-dispatches' : 'stock-inward'}-${new Date().toISOString().slice(0, 10)}.csv`
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
            <h1>{outward ? 'Stock Outward / Dispatch Bay' : 'Stock Inward / Receiving Bay'}</h1>
            <span className={`inventory-live-badge ${error ? 'is-error' : ''}`}>
              <i />
              {loading ? 'Connecting' : error ? 'Connection issue' : outward ? 'Dispatch Bay Active' : 'Dock Active'}
            </span>
          </div>
          <p className="inventory-header-sub">
            {outward
              ? 'Outward goods dispatch, warehouse picking, and sales deduction for'
              : 'Record incoming stock shipments, supplier receipts, and purchase orders for'}{' '}
            <strong>{business.name}</strong>.
          </p>
        </div>

        <div className="inventory-header-actions">
          <button type="button" onClick={() => searchRef.current?.focus()}>
            <InwardIcon name="search" /> Find SKU / Barcode
          </button>
          {!outward && (canNavigate?.('Products') || canNavigate?.('Medicines')) && (
            <button
              type="button"
              onClick={() => onNavigate(canNavigate?.('Medicines') ? 'Medicines' : 'Products')}
            >
              <InwardIcon name="import" /> {capabilities.productLabel || 'Product'} Catalog
            </button>
          )}
          <button
            type="button"
            onClick={exportDispatches}
            disabled={loading || !!error || !summary.entries.length}
          >
            <InwardIcon name="history" /> Export CSV ({summary.entries.length})
          </button>
          {canNavigate?.('Stock History') && (
            <button
              type="button"
              className="primary"
              onClick={() => onNavigate('Stock History')}
            >
              <InwardIcon name="history" /> Movement Audit
            </button>
          )}
        </div>
      </header>

      {/* 2. Top Metric KPI 4 Cards Grid */}
      <div className="modern-kpi-row">
        {/* KPI 1: Inward/Outward Volume */}
        <div className="modern-kpi-card" tabIndex={0} role="region" aria-label="Recent Volume">
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">{outward ? 'Recently Dispatched' : 'Recent Inward'}</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : summary.inwardUnits.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 500 }}>
              Across {summary.inwardCount} {movementLabel} transactions
            </span>
          </div>
          <div className={`modern-kpi-icon-bubble ${outward ? 'bubble-rose' : 'bubble-blue'}`} aria-hidden="true">
            <InwardIcon name="box" />
          </div>
        </div>

        {/* KPI 2: Low Stock Alert */}
        <div
          className="modern-kpi-card"
          tabIndex={0}
          role="button"
          onClick={() => {
            setStockStatus('low')
            setPage(1)
          }}
          aria-label="Filter low stock items"
        >
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Needs Restocking</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : summary.lowCount}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--warning)', fontWeight: 600 }}>
              {summary.outOfStockCount > 0 ? `${summary.outOfStockCount} completely out of stock` : 'At reorder threshold'}
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-yellow" aria-hidden="true">
            <InwardIcon name="alert" />
          </div>
        </div>

        {/* KPI 3: Product Catalog */}
        <div
          className="modern-kpi-card"
          tabIndex={0}
          role="button"
          onClick={() => onNavigate?.('Products')}
          aria-label="View products catalog"
        >
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Product Catalog</span>
            <span className="modern-kpi-value">{products.length}</span>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 500 }}>
              Across {summary.categories.length} active categories
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-purple" aria-hidden="true">
            <InwardIcon name="layers" />
          </div>
        </div>

        {/* KPI 4: Inventory Value */}
        <div className="modern-kpi-card" tabIndex={0} role="region" aria-label="Inventory Value">
          <div className="modern-kpi-texts">
            <span className="modern-kpi-title">Warehouse Cost Value</span>
            <span className="modern-kpi-value">
              {loading || error ? '—' : money(summary.value)}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--success)', fontWeight: 600 }}>
              Live purchase cost balance
            </span>
          </div>
          <div className="modern-kpi-icon-bubble bubble-green" aria-hidden="true">
            <InwardIcon name="trend" />
          </div>
        </div>
      </div>

      {/* 3. Fast Intake / Dispatch Terminal Card */}
      <section className="inventory-terminal-panel" aria-labelledby="terminal-title">
        <div className="inventory-terminal-header">
          <div className="inventory-terminal-title-group">
            <div className={`inventory-terminal-icon ${outward ? 'bubble-rose' : 'bubble-blue'}`}>
              <InwardIcon name="box" />
            </div>
            <div>
              <h3 id="terminal-title">
                {operationLabel}
                <span className="inventory-terminal-badge">
                  {outward ? 'Outward Dispatch' : 'Fast Intake'}
                </span>
              </h3>
            </div>
          </div>
          <kbd className="inventory-kbd-shortcut">Alt + {outward ? 'O' : 'I'}</kbd>
        </div>

        <div className="inventory-terminal-body">
          <form ref={formRef} onSubmit={onSubmit} onReset={() => setSelectedId('')}>
            <div className="inventory-form-grid">
              {/* Product Select */}
              <div className="inventory-field">
                <label htmlFor="terminal-product" className="inventory-field-label">
                  Product / SKU <span className="inventory-field-required">*</span>
                </label>
                <div className="inventory-select-wrap">
                  <select
                    ref={productRef}
                    id="terminal-product"
                    name="productId"
                    value={selectedId}
                    required
                    disabled={saving}
                    className="inventory-select"
                    onChange={(event) => setSelectedId(event.target.value)}
                  >
                    <option value="" disabled>Select a {capabilities.productLabel === 'Medicines' ? 'medicine' : 'product'} to {outward ? 'dispatch' : 'receive'}…</option>
                    {products.map((product) => (
                      <option key={product.productId} value={product.productId}>
                        {product.name} ({product.sku}){product.batchNumber ? ` · Batch: ${product.batchNumber}` : ''}{product.expiryDate ? ` · Exp: ${String(product.expiryDate).slice(0, 10)}` : ''} · {product.currentStock} {product.unit} available
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="inventory-field">
                <label htmlFor="terminal-quantity" className="inventory-field-label">
                  Quantity <span className="inventory-field-required">*</span>
                </label>
                <div className="inventory-input-wrap">
                  <input
                    ref={quantityRef}
                    id="terminal-quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    required
                    disabled={saving}
                    placeholder="0"
                    className="inventory-input inventory-input-qty"
                  />
                  <span className="inventory-input-suffix">
                    {selectedProduct?.unit || 'units'}
                  </span>
                </div>
              </div>

              {/* Reason / Reference */}
              <div className="inventory-field">
                <label htmlFor="terminal-reason" className="inventory-field-label">
                  Reason / Type <span className="inventory-field-optional">(optional)</span>
                </label>
                <div className="inventory-input-wrap">
                  <input
                    id="terminal-reason"
                    name="reason"
                    list="terminal-reasons"
                    placeholder={outward ? 'e.g. Sale, damage, transfer' : 'e.g. Purchase order, supplier receipt'}
                    disabled={saving}
                    className="inventory-input"
                  />
                </div>
                <datalist id="terminal-reasons">
                  {(outward
                    ? ['Sale', 'Damage', 'Transfer dispatch', 'Internal store use', 'Expired']
                    : ['Purchase order', 'Customer return', 'Transfer receipt', 'Opening stock', 'Stock replenishment']
                  ).map((reason) => (
                    <option key={reason} value={reason} />
                  ))}
                </datalist>
              </div>

              {/* Submit Button */}
              <div className="inventory-submit-col">
                <button
                  type="submit"
                  disabled={saving}
                  className={`inventory-submit-btn ${outward ? 'outward' : ''}`}
                >
                  <span>{saving ? 'Recording…' : operationLabel}</span>
                  <InwardIcon name="arrow" size={16} />
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
                      : 'Select a product to view location'}
                  </span>
                </div>
              </div>
              <div className="inventory-context-tile">
                <div className="inventory-context-icon" aria-hidden="true">💰</div>
                <div className="inventory-context-content">
                  <span className="inventory-context-label">Unit Purchase Cost ({currency})</span>
                  <span className={`inventory-context-val ${!selectedProduct ? 'is-placeholder' : ''}`}>
                    {selectedProduct ? money(selectedProduct.purchasePrice) : '—'}
                  </span>
                </div>
              </div>
              <div className="inventory-context-tile">
                <div className="inventory-context-icon" aria-hidden="true">{outward ? '👤' : '🚚'}</div>
                <div className="inventory-context-content">
                  <span className="inventory-context-label">
                    {outward ? 'Authorized Operator' : 'Assigned Supplier'}
                  </span>
                  <span className={`inventory-context-val ${!selectedProduct && !outward ? 'is-placeholder' : ''}`}>
                    {outward
                      ? `${account?.name || account?.email || 'Current user'} (${account?.role || 'Staff'})`
                      : selectedProduct
                      ? selectedProduct.supplier || 'Standard Supplier'
                      : 'Select a product to view supplier'}
                  </span>
                </div>
              </div>
            </div>
          </form>

          {/* Feedback status banner */}
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

      {/* 4. Stock Levels & Movement List (Dashboard invoice-style-panel) */}
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
                {outward ? '📤' : '📥'}
              </span>
              <span>{outward ? 'Stock Outward Ledger & Dispatch Bay' : 'Stock Inward Ledger & Balance'}</span>
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
            {/* Controls Row: Search + Filters + Action Button */}
            <div className="invoice-controls-row">
              <div className="invoice-controls-left">
                <div className="invoice-search-wrap">
                  <input
                    ref={searchRef}
                    type="text"
                    className="invoice-search-input"
                    aria-label={`Search ${movementLabel} products`}
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
                  aria-label="Filter by stock status"
                  value={stockStatus}
                  onChange={(event) => {
                    setStockStatus(event.target.value)
                    setPage(1)
                  }}
                >
                  <option value="all">All stock levels</option>
                  <option value="in">In Stock (Healthy)</option>
                  <option value="low">Low Stock Alert ({summary.lowCount})</option>
                  <option value="out">Out of Stock ({summary.outOfStockCount})</option>
                </select>

                <select
                  className="invoice-select"
                  aria-label="Sort stock"
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
                onClick={() => onNavigate?.(canNavigate?.('Medicines') ? 'Medicines' : 'Products')}
              >
                + New {capabilities.productLabel === 'Medicines' ? 'Medicine' : 'Product'}
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
                  ? 'No items match your search and filter criteria.'
                  : `No products found. Add products to begin ${outward ? 'dispatching' : 'receiving'} stock.`
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
                      <th>Available Stock</th>
                      <th>Last {outward ? 'Dispatch' : 'Inward'}</th>
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
                                  {latest.quantity} {product.unit || 'units'} · {latest.reason || (outward ? 'Dispatch' : 'Receipt')}
                                </small>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--muted)' }}>—</span>
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
                                className={`inventory-row-action-btn ${isLowStock ? 'is-low' : ''}`}
                                disabled={saving}
                                title={`${outward ? 'Dispatch' : 'Inward'} stock for ${product.name}`}
                                onClick={() => startInward(product)}
                              >
                                {outward ? '− Dispatch' : `+ ${isLowStock ? 'Restock' : 'Inward'}`}
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
