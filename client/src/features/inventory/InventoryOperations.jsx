import { useCallback, useMemo, useState } from 'react'
import { productApi } from '../../api/productApi.js'
import { inventoryApi } from '../../api/inventoryApi.js'
import { useResource } from '../../hooks/useResource.js'
import { PageHeader, Badge, DataTable, Icon } from '../../components/ui/index.js'
import AsyncBoundary from '../../components/feedback/AsyncBoundary.jsx'
import StockInView, { StockOutView } from './StockInView.jsx'
import StockAdjustmentView from './StockAdjustmentView.jsx'
import StockHistoryView from './StockHistoryView.jsx'
import CategoriesView from '../products/CategoriesPage.jsx'
import '../dashboard/overview-dashboard.css'
import './InventoryOperations.css'

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
    <div className="inventory-page">
      <PageHeader
        kicker="Inventory"
        title={section}
        description={`Business inventory operations for ${business.name}`}
      />
      <DataTable
        columns={[
          {
            key: 'name',
            header: 'Product',
            mobileLabel: 'Product',
            render: (p) => (
              <div className="inventory-prod-cell">
                <span className="inventory-prod-avatar">{p.name?.[0]?.toUpperCase()}</span>
                <div className="inventory-prod-info">
                  <span className="inventory-prod-name">{p.name}</span>
                  <span className="inventory-prod-meta">{p.sku}</span>
                </div>
              </div>
            ),
          },
          {
            key: 'category',
            header: 'Category',
            mobileLabel: 'Category',
            render: (p) => <Badge tone="neutral">{p.category}</Badge>,
          },
          {
            key: 'stock',
            header: 'Stock',
            mobileLabel: 'Stock',
            render: (p) => `${p.currentStock} ${p.unit || 'units'}`,
          },
        ]}
        data={products}
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyText="No products in this workspace yet."
      />
    </div>
  )
}

function StockLedgerView({ products = [], loading, error, refetch, business = {}, onNavigate }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [sortOrder, setSortOrder] = useState('default')
  const [page, setPage] = useState(1)
  const pageSize = 8

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort(),
    [products]
  )

  const counts = useMemo(
    () =>
      products.reduce(
        (result, product) => {
          const stock = Number(product.currentStock || 0)
          const minimum = Number(product.minimumStock || 10)
          result.units += stock
          result.value += stock * Number(product.purchasePrice || 0)
          if (stock === 0) {
            result.out += 1
            result.pending += 1
          } else if (stock <= minimum) {
            result.low += 1
            result.pending += 1
          } else if (stock > minimum * 2) {
            result.delivered += 1
            result.in += 1
          } else {
            result.shipped += 1
            result.in += 1
          }
          return result
        },
        { units: 0, value: 0, in: 0, low: 0, out: 0, shipped: 0, delivered: 0, pending: 0 }
      ),
    [products]
  )

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    let list = products.filter((product) => {
      const stock = Number(product.currentStock || 0)
      const minimum = Number(product.minimumStock || 10)

      let itemStatus = 'delivered'
      if (stock === 0) itemStatus = 'out'
      else if (stock <= minimum) itemStatus = 'pending'
      else if (stock > minimum * 2) itemStatus = 'delivered'
      else itemStatus = 'shipped'

      const matchesSearch =
        !query ||
        `${product.name} ${product.sku || ''} ${product.category || ''} ${product.brand || ''} ${product.rackLocation || ''}`
          .toLowerCase()
          .includes(query)

      const matchesStatus =
        status === 'all' ||
        status === itemStatus ||
        (status === 'in' && (itemStatus === 'delivered' || itemStatus === 'shipped')) ||
        (status === 'low' && (itemStatus === 'pending' || itemStatus === 'out'))

      const matchesCategory = category === 'all' || category === product.category

      return matchesSearch && matchesStatus && matchesCategory
    })

    if (sortOrder === 'high') {
      list = [...list].sort((a, b) => Number(b.currentStock || 0) - Number(a.currentStock || 0))
    } else if (sortOrder === 'low') {
      list = [...list].sort((a, b) => Number(a.currentStock || 0) - Number(b.currentStock || 0))
    }

    return list
  }, [products, search, status, category, sortOrder])

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize))
  const effectivePage = Math.min(page, totalPages)
  const pagedItems = useMemo(() => {
    return visible.slice((effectivePage - 1) * pageSize, effectivePage * pageSize)
  }, [visible, effectivePage, pageSize])

  const money = useCallback(
    (value) => {
      const sym = business.currency === 'INR' ? '₹' : business.currency || ''
      return `${sym}${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
    },
    [business.currency]
  )

  const exportLedger = () => {
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const rows = [
      ['Id', 'Bill From', 'Bill To', 'Total Cost', 'Available Stock', 'Unit', 'Status'],
      ...visible.map((product, index) => {
        const stock = Number(product.currentStock || 0)
        const minimum = Number(product.minimumStock || 10)
        let statusLabel = 'Delivered'
        if (stock === 0) statusLabel = 'Out of Stock'
        else if (stock <= minimum) statusLabel = 'Pending'
        else if (stock > minimum * 2) statusLabel = 'Delivered'
        else statusLabel = 'Shipped'

        return [
          product.sku || product.productId || 101 + index,
          product.name,
          [product.category, product.rackLocation || product.warehouse].filter(Boolean).join(' · ') || 'General',
          product.sellingPrice || 90,
          stock,
          product.unit || 'units',
          statusLabel,
        ]
      }),
    ]
    const blob = new Blob([rows.map((row) => row.map(escape).join(',')).join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stock-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="inventory-page">
      {/* 4 Tonal Pastel Top KPI Cards in a Horizontal Row */}
      {!loading && !error && (
        <div className="ledger-kpi-grid">
          {/* Card 1: Total Units in Stock (Sky Blue) */}
          <div
            className={`ledger-kpi-card theme-blue ${status === 'all' ? 'is-active' : ''}`}
            onClick={() => {
              setStatus('all')
              setPage(1)
            }}
            role="button"
            tabIndex={0}
            title="Filter all records"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="box" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Total Units in Stock</span>
              <span className="ledger-kpi-val">{counts.units.toLocaleString('en-IN')} Units</span>
              <span className="ledger-kpi-pill pill-blue">Physical Count</span>
            </div>
          </div>

          {/* Card 2: Inventory Valuation (Emerald Green) */}
          <div
            className="ledger-kpi-card theme-green"
            role="button"
            tabIndex={0}
            title="Total inventory asset value"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="trending-up" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Inventory Valuation</span>
              <span className="ledger-kpi-val">{money(counts.value)}</span>
              <span className="ledger-kpi-pill pill-green">Asset Value</span>
            </div>
          </div>

          {/* Card 3: Reorder Alerts (Warm Amber) */}
          <div
            className={`ledger-kpi-card theme-amber ${status === 'pending' || status === 'low' ? 'is-active' : ''}`}
            onClick={() => {
              setStatus(status === 'low' ? 'all' : 'low')
              setPage(1)
            }}
            role="button"
            tabIndex={0}
            title="Filter low and out of stock items"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="warning" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Reorder Alerts</span>
              <span className="ledger-kpi-val">{counts.pending} SKUs</span>
              <span className="ledger-kpi-pill pill-amber">Action Needed</span>
            </div>
          </div>

          {/* Card 4: Catalog Items (Royal Purple) */}
          <div
            className="ledger-kpi-card theme-purple"
            role="button"
            tabIndex={0}
            title="Total catalogued products"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="list" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Catalog Items</span>
              <span className="ledger-kpi-val">{products.length} SKUs</span>
              <span className="ledger-kpi-pill pill-purple">Active SKUs</span>
            </div>
          </div>
        </div>
      )}

      <div className="modern-panel-card content-list-panel">
        <div className="content-list-header">
          <div className="content-list-title-wrap">
            <h2 className="content-list-title">
              Stock Ledger <span className="content-list-count">({visible.length})</span>
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
                aria-label="Search stock ledger"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search stock, SKU, rack..."
              />
            </div>

            <select
              className="content-list-select"
              aria-label="Filter category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              className="content-list-select"
              aria-label="Filter status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">Status</option>
              <option value="in">In Stock ({counts.in})</option>
              <option value="low">Low Stock ({counts.low})</option>
              <option value="out">Out of Stock ({counts.out})</option>
            </select>

            <select
              className="content-list-select"
              aria-label="Sort stock ledger"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value)
                setPage(1)
              }}
            >
              <option value="default">Default Order</option>
              <option value="high">Stock: High to Low</option>
              <option value="low">Stock: Low to High</option>
            </select>

            <button
              type="button"
              className="content-list-action-btn secondary"
              onClick={exportLedger}
              disabled={loading || !!error || !visible.length}
              title="Export CSV"
            >
              Export CSV
            </button>

            <button
              type="button"
              className="content-list-action-btn secondary"
              onClick={() => onNavigate?.('Stock History')}
              title="Movement History & Audit Log"
            >
              Audit Ledger
            </button>

            <button
              type="button"
              className="content-list-action-btn"
              onClick={() => onNavigate?.('Stock In')}
              title="Record Stock Inward"
            >
              + Inward Stock
            </button>
          </div>
        </div>

        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={refetch}
          isEmpty={!visible.length}
          emptyText={
            products.length
              ? "No stock records match your search or filters."
              : "No stock records yet. Record inward stock to get started."
          }
        >
          <div className="content-list-table-wrap">
            <table className="content-list-table">
              <thead>
                <tr>
                  <th style={{ width: "28%" }}>Product</th>
                  <th style={{ width: "20%" }}>Location & Bin</th>
                  <th style={{ width: "16%" }}>Valuation Basis</th>
                  <th style={{ width: "16%" }}>Available Stock</th>
                  <th style={{ width: "10%" }}>Status</th>
                  <th style={{ width: "10%", textAlign: "right", paddingRight: "16px" }}>Quick Ops</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((product) => {
                  const stock = Number(product.currentStock || 0)
                  const min = Number(product.minimumStock || 10)
                  const isOutOfStock = stock === 0
                  const isLowStock = stock <= min && !isOutOfStock
                  const pillClass = isOutOfStock
                    ? "status-pill-out"
                    : isLowStock
                    ? "status-pill-low"
                    : "status-pill-instock"
                  const statusText = isOutOfStock
                    ? "Out of Stock"
                    : isLowStock
                    ? "Low Stock"
                    : "In Stock"

                  const purchase = Number(product.purchasePrice || 0)
                  const lineVal = stock * purchase
                  const locationText = [product.warehouse || "Main Warehouse", product.rackLocation || "General Storage"].filter(Boolean).join(" · ")

                  return (
                    <tr key={product.productId}>
                      <td className="cl-cell-product">
                        <div className="cl-product-name">{product.name}</div>
                        <div className="cl-product-meta">
                          <span className="cl-product-sku">SKU: {product.sku || (product.productId ? String(product.productId).slice(-6) : "N/A")}</span>
                          {product.category && (
                            <span className="cl-product-brand"> · {product.category}</span>
                          )}
                          {product.brand && (
                            <span className="cl-product-brand"> · {product.brand}</span>
                          )}
                        </div>
                      </td>
                      <td className="cl-cell-category">
                        <span style={{ marginRight: "4px" }}>📍</span>
                        <span>{locationText}</span>
                      </td>
                      <td className="cl-cell-price">
                        <div>{money(lineVal)}</div>
                        <div style={{ fontSize: "11px", color: "var(--muted, #64748b)", fontWeight: "normal" }}>
                          @ {money(purchase)} / {product.unit || "unit"}
                        </div>
                      </td>
                      <td className="cl-cell-stock">
                        <span className="cl-stock-value">{stock.toLocaleString("en-IN")}</span>
                        <span className="cl-stock-label"> {product.unit || "units"}</span>
                      </td>
                      <td className="cl-cell-status">
                        <span className={`content-status-pill ${pillClass}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="cl-cell-actions" style={{ textAlign: "right", paddingRight: "16px" }}>
                        <div className="cl-actions-wrapper">
                          <button
                            type="button"
                            className="ledger-action-icon action-edit"
                            onClick={() => onNavigate?.("Stock In")}
                            aria-label={`Inward ${product.name}`}
                            title="Inward Stock"
                          >
                            <Icon name="plus" size={15} />
                          </button>
                          <button
                            type="button"
                            className="ledger-action-icon action-delete"
                            onClick={() => onNavigate?.("Stock Out")}
                            aria-label={`Dispatch ${product.name}`}
                            title="Issue / Dispatch"
                          >
                            <Icon name="minus" size={15} />
                          </button>
                          <button
                            type="button"
                            className="ledger-action-icon action-view"
                            onClick={() => onNavigate?.("Adjustments")}
                            aria-label={`Reconcile ${product.name}`}
                            title="Reconcile / Adjust"
                          >
                            <Icon name="edit" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {visible.length > 0 && (
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

export default InventoryOperations
