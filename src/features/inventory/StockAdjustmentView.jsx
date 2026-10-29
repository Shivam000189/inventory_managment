import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PageHeader,
  Button,
  Badge,
  Select,
  Input,
  FormStatus,
  Icon,
} from '../../components/ui/index.js'
import AsyncBoundary from '../../components/feedback/AsyncBoundary.jsx'
import { getProductAvatarClass } from './inventoryUtils.js'
import '../dashboard/overview-dashboard.css'
import './InventoryOperations.css'

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
  const [page, setPage] = useState(1)
  const pageSize = 8

  const productRef = useRef(null)
  const quantityRef = useRef(null)
  const formRef = useRef(null)

  const selectedProduct = products.find((product) => product.productId === selectedId)
  const currency = business.currency || 'INR'

  const formatMoney = (value) => {
    const amount = Number(value || 0)
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
      }).format(amount)
    } catch {
      return `${currency} ${amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
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
        [
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
        ]
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
  const effectivePage = Math.min(page, totalPages)
  const pagedProducts = useMemo(() => {
    return filteredProducts.slice((effectivePage - 1) * pageSize, effectivePage * pageSize)
  }, [filteredProducts, effectivePage, pageSize])

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return
      if (
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key.toLowerCase() === 'j'
      ) {
        event.preventDefault()
        productRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const startAdjustment = useCallback((product) => {
    if (saving) return
    setSelectedId(product.productId)
    setNewQuantity(String(product.currentStock ?? 0))
    formRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setTimeout(() => {
      quantityRef.current?.focus()
      quantityRef.current?.select()
    }, 100)
  }, [saving])

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
    <div className="inventory-page">
      <PageHeader
        kicker="Inventory"
        title="Stock Adjustments & Reconciliation"
        description={`Reconcile physical stock counts, log damage/shrinkage, and audit inventory for ${business.name}`}
      />

      {!loading && !error && (
        <div className="ledger-kpi-grid">
          {/* Card 1: Net Quantity Variance */}
          <div className={`ledger-kpi-card ${summary.netVariance < 0 ? 'theme-red' : summary.netVariance > 0 ? 'theme-green' : 'theme-blue'}`}>
            <div className="ledger-kpi-bubble">
              <Icon name="variance" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Net Quantity Variance</span>
              <span className="ledger-kpi-val">{summary.netVariance >= 0 ? '+' : ''}{summary.netVariance} Units</span>
              <span className={`ledger-kpi-pill ${summary.netVariance < 0 ? 'pill-red' : summary.netVariance > 0 ? 'pill-green' : 'pill-blue'}`}>
                Physical vs System
              </span>
            </div>
          </div>

          {/* Card 2: Valuation Impact */}
          <div className="ledger-kpi-card theme-purple">
            <div className="ledger-kpi-bubble">
              <Icon name="trending-up" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Valuation Impact</span>
              <span className="ledger-kpi-val">{formatMoney(summary.valueImpact)}</span>
              <span className="ledger-kpi-pill pill-purple">Cost Adjustment</span>
            </div>
          </div>

          {/* Card 3: Audit Reconciliations */}
          <div className="ledger-kpi-card theme-amber">
            <div className="ledger-kpi-bubble">
              <Icon name="clock" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Audit Reconciliations</span>
              <span className="ledger-kpi-val">{summary.entries.length} Logged</span>
              <span className="ledger-kpi-pill pill-amber">Total Audit Logs</span>
            </div>
          </div>

          {/* Card 4: Flagged for Audit */}
          <div
            className={`ledger-kpi-card theme-red ${stockStatus === 'flagged' ? 'is-active' : ''}`}
            onClick={() => {
              setStockStatus(stockStatus === 'flagged' ? 'all' : 'flagged')
              setPage(1)
            }}
            role="button"
            tabIndex={0}
            title="Filter items flagged for audit"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="warning" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Flagged for Audit</span>
              <span className="ledger-kpi-val">{summary.flaggedCount} SKUs</span>
              <span className="ledger-kpi-pill pill-red">Low or Zero Stock</span>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Terminal Card */}
      <section className="inventory-terminal-card terminal-adjust" aria-labelledby="adjust-title">
        <div className="inventory-terminal-header">
          <div className="inventory-terminal-title-wrap">
            <div className="inventory-terminal-icon adjust">
              <Icon name="warning" />
            </div>
            <div>
              <h3 id="adjust-title" className="inventory-terminal-title">
                Record Stock Count Adjustment
                <Badge tone="warning" dot>Audit Reconciliation</Badge>
              </h3>
            </div>
          </div>
          <kbd className="inventory-kbd">Alt + J</kbd>
        </div>

        <form
          ref={formRef}
          onSubmit={onSubmit}
          onReset={() => {
            setSelectedId('')
            setNewQuantity('')
          }}
          className="inventory-form"
        >
          <div className="inventory-form-grid">
            <div className="inventory-field">
              <label htmlFor="adjust-product">Product to Reconcile *</label>
              <Select
                ref={productRef}
                id="adjust-product"
                name="productId"
                value={selectedId}
                required
                disabled={saving}
                onChange={(e) => {
                  const id = e.target.value
                  setSelectedId(id)
                  const prod = products.find((p) => p.productId === id)
                  setNewQuantity(prod ? String(prod.currentStock ?? 0) : '')
                }}
              >
                <option value="" disabled>
                  Select product to adjust…
                </option>
                {products.map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.name} ({product.sku}) · {product.currentStock} {product.unit || 'units'} on hand
                  </option>
                ))}
              </Select>
            </div>

            <div className="inventory-field">
              <label htmlFor="adjust-quantity">New Physical Count *</label>
              <div className="inventory-input-with-suffix">
                <input
                  ref={quantityRef}
                  id="adjust-quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  step="1"
                  required
                  disabled={saving}
                  placeholder="0"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                />
                <span className="inventory-suffix">
                  {selectedProduct?.unit || 'units'}
                </span>
              </div>
            </div>

            <div className="inventory-field">
              <label htmlFor="adjust-reason">Discrepancy Reason *</label>
              <Input
                id="adjust-reason"
                name="reason"
                list="adjustment-reasons"
                placeholder="Physical count, damage, expired…"
                required
                disabled={saving}
              />
              <datalist id="adjustment-reasons">
                {[
                  'Physical count verification',
                  'Damaged during handling',
                  'Expired stock write-off',
                  'Spillage / leakage',
                  'Unrecorded customer return',
                  'Shrinkage / discrepancy',
                  'Initial stock setup',
                ].map((reason) => (
                  <option key={reason} value={reason} />
                ))}
              </datalist>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={saving}
              icon="check"
            >
              {saving ? 'Adjusting…' : 'Record Adjustment'}
            </Button>
          </div>

          <div className="inventory-context-row">
            <div className={`inventory-context-tile ${selectedVariance < 0 ? 'tile-rose' : selectedVariance > 0 ? 'tile-green' : 'tile-blue'}`}>
              <span className="inventory-context-icon">⚖️</span>
              <div className="inventory-context-details">
                <span className="inventory-context-label">Calculated Variance (Live)</span>
                <span className="inventory-context-value">
                  {selectedVariance === null ? (
                    '—'
                  ) : selectedVariance > 0 ? (
                    <span style={{ color: '#059669', fontWeight: 800 }}>
                      +{selectedVariance} {selectedProduct?.unit || 'units'} (Surplus)
                    </span>
                  ) : selectedVariance < 0 ? (
                    <span style={{ color: '#e11d48', fontWeight: 800 }}>
                      {selectedVariance} {selectedProduct?.unit || 'units'} (Deficit / Shrinkage)
                    </span>
                  ) : (
                    <span style={{ color: '#0284c7', fontWeight: 800 }}>
                      0 {selectedProduct?.unit || 'units'} (Exact Match)
                    </span>
                  )}
                </span>
              </div>
            </div>
            <div className={`inventory-context-tile ${selectedVariance < 0 ? 'tile-rose' : selectedVariance > 0 ? 'tile-green' : 'tile-purple'}`}>
              <span className="inventory-context-icon">💰</span>
              <div className="inventory-context-details">
                <span className="inventory-context-label">Valuation Impact</span>
                <span className="inventory-context-value">
                  {selectedVariance !== null && selectedProduct ? (
                    <>
                      <strong>{formatMoney(selectedVariance * Number(selectedProduct.purchasePrice || 0))}</strong>
                      <small style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-soft)', marginTop: '2px' }}>
                        Based on unit purchase cost
                      </small>
                    </>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
            </div>
            <div className="inventory-context-tile tile-blue">
              <span className="inventory-context-icon">👤</span>
              <div className="inventory-context-details">
                <span className="inventory-context-label">Auditing User</span>
                <span className="inventory-context-value">
                  {account?.name || account?.email || 'Current user'} ({account?.role || 'Staff'})
                </span>
              </div>
            </div>
          </div>
        </form>

        {message && (
          <FormStatus
            type={message.type === 'error' ? 'error' : 'success'}
            message={message.text}
          />
        )}
      </section>

      {/* Products list */}
      <div className="modern-panel-card content-list-panel">
        <div className="content-list-header">
          <div className="content-list-title-wrap">
            <h2 className="content-list-title">
              Reconciliation Catalog <span className="content-list-count">({filteredProducts.length})</span>
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
                type="text"
                className="content-list-search-input"
                aria-label="Search catalog for reconciliation"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search product, SKU, barcode, brand…"
              />
            </div>

            <select
              className="content-list-select"
              aria-label="Filter by category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
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
              className="content-list-select"
              aria-label="Filter by audit status"
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">All stock items</option>
              <option value="flagged">Flagged for Audit ({summary.flaggedCount})</option>
              <option value="adjusted">Recently Adjusted</option>
              <option value="out">Out of Stock</option>
            </select>

            <select
              className="content-list-select"
              aria-label="Sort stock"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value)
                setPage(1)
              }}
            >
              <option value="default">Default order</option>
              <option value="high">Stock: High to Low</option>
              <option value="low">Stock: Low to High</option>
            </select>

            <button
              type="button"
              className="content-list-action-btn secondary"
              onClick={exportAdjustments}
              disabled={!summary.entries.length}
              title="Export CSV"
            >
              Export Log
            </button>

            <button
              type="button"
              className="content-list-action-btn"
              onClick={() => onNavigate?.('Stock')}
              title="View Stock Ledger"
            >
              View Stock Ledger
            </button>
          </div>
        </div>

        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={refetch}
          isEmpty={!filteredProducts.length}
          emptyText={
            products.length
              ? 'No items match your search and filter criteria.'
              : 'No products found to adjust.'
          }
        >
          <div className="content-list-table-wrap">
            <table className="content-list-table">
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>Product & Details</th>
                  <th style={{ width: '16%' }}>Category & Location</th>
                  <th style={{ width: '16%' }}>Recorded Stock</th>
                  <th style={{ width: '16%' }}>Last Adjustment</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '10%', textAlign: 'right', paddingRight: '16px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedProducts.map((product) => {
                  const stock = Number(product.currentStock || 0)
                  const min = Number(product.minimumStock || 10)
                  const isOutOfStock = stock === 0
                  const isLowStock = stock <= min && !isOutOfStock
                  const pillClass = isOutOfStock
                    ? 'status-pill-out'
                    : isLowStock
                    ? 'status-pill-low'
                    : 'status-pill-instock'
                  const statusLabel = isOutOfStock
                    ? 'Out of Stock'
                    : isLowStock
                    ? 'Low Stock'
                    : 'In Stock'

                  const latest = summary.latest.get(product.productId)
                  const avatarClass = getProductAvatarClass(product.name)
                  const initial = (product.name || 'P').charAt(0).toUpperCase()
                  const variance = latest
                    ? Number(latest.newStock || 0) - Number(latest.previousStock || 0)
                    : null

                  return (
                    <tr key={product.productId}>
                      <td className="cl-cell-product">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className={`product-avatar ${avatarClass}`}>{initial}</span>
                          <div>
                            <div className="cl-product-name">{product.name}</div>
                            <div className="cl-product-meta">
                              <span className="cl-product-sku">SKU: {product.sku || (product.productId ? String(product.productId).slice(-6) : 'N/A')}</span>
                              {product.brand && (
                                <span className="cl-product-brand"> · {product.brand}</span>
                              )}
                              {product.batchNumber && (
                                <span className="cl-product-brand"> · Batch: {product.batchNumber}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="cl-cell-category">
                        <div>
                          <span className="ledger-category-pill">{product.category || 'General'}</span>
                          <div style={{ fontSize: '11px', color: 'var(--text-soft)', marginTop: '4px' }}>
                            📍 {product.rackLocation || product.warehouse || 'Unassigned'}
                          </div>
                        </div>
                      </td>
                      <td className="cl-cell-stock">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`inventory-qty-val ${isOutOfStock ? 'out' : isLowStock ? 'low' : 'in'}`}>
                            {stock.toLocaleString('en-IN')}
                          </span>
                          <span style={{ color: 'var(--text-soft)', fontSize: '11.5px', fontWeight: 600 }}>
                            {product.unit || 'units'}
                          </span>
                        </div>
                      </td>
                      <td className="cl-cell-date">
                        {latest ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`inventory-qty-val ${variance < 0 ? 'out' : variance > 0 ? 'in' : 'adjust'}`}>
                              {variance > 0 ? `+${variance}` : variance}
                            </span>
                            <small style={{ color: 'var(--text-soft)', fontSize: '11px' }}>
                              {latest.reason || 'Reconciled'}
                            </small>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-soft)', fontSize: '12px' }}>Never</span>
                        )}
                      </td>
                      <td className="cl-cell-status">
                        <span className={`content-status-pill ${pillClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="cl-cell-actions" style={{ textAlign: 'right', paddingRight: '16px' }}>
                        <button
                          type="button"
                          className="ledger-op-btn op-adjust"
                          onClick={() => startAdjustment(product)}
                          aria-label={`Adjust ${product.name}`}
                        >
                          Reconcile
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="content-list-pagination">
            <span className="content-list-pagination-info">
              Showing {(effectivePage - 1) * pageSize + 1} to{' '}
              {Math.min(effectivePage * pageSize, filteredProducts.length)} of {filteredProducts.length} products
            </span>
            <div className="content-list-pagination-controls">
              <button
                type="button"
                className="content-list-pagination-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={effectivePage <= 1}
              >
                Previous
              </button>
              <span className="content-list-page-number">
                {effectivePage} / {totalPages}
              </span>
              <button
                type="button"
                className="content-list-pagination-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={effectivePage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </AsyncBoundary>
      </div>
    </div>
  )
}
