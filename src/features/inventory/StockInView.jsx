import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { resolveBusinessCapabilities } from '../../../shared/industryConfig.js'
import {
  PageHeader,
  Button,
  Badge,
  Select,
  Input,
  FormStatus,
  Icon,
  Modal,
} from '../../components/ui/index.js'
import AsyncBoundary from '../../components/feedback/AsyncBoundary.jsx'
import {
  getProductAvatarClass,
} from './inventoryUtils.js'
import '../dashboard/overview-dashboard.css'
import './InventoryOperations.css'

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
  onNavigate: _onNavigate,
  canNavigate: _canNavigate,
  outward = false,
}) {
  const capabilities = useMemo(
    () => business?.capabilities || resolveBusinessCapabilities(business || {}),
    [business]
  )
  const operationLabel = outward ? 'Record Stock Out' : 'Record Stock In'
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [stockStatus, setStockStatus] = useState('all')
  const [sortOrder, setSortOrder] = useState('default')
  const [selectedId, setSelectedId] = useState('')
  const [inputQuantity, setInputQuantity] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 8

  const productRef = useRef(null)
  const quantityRef = useRef(null)
  const formRef = useRef(null)

  const selectedProduct = products.find((product) => product.productId === selectedId)
  const isExceedingStock =
    outward &&
    selectedProduct &&
    inputQuantity !== '' &&
    Number(inputQuantity) > Number(selectedProduct.currentStock || 0)
  const currency = business.currency || 'INR'

  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => {
        setIsModalOpen(false)
        setSelectedId('')
        setInputQuantity('')
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [message])

  const money = (value) => {
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
      lowCount: products.filter(
        (item) =>
          Number(item.currentStock || 0) <= Number(item.minimumStock || 10) &&
          Number(item.currentStock || 0) > 0
      ).length,
      outOfStockCount: products.filter((item) => Number(item.currentStock || 0) === 0).length,
      categories: [...new Set(products.map((item) => item.category).filter(Boolean))].sort(),
      value: products.reduce(
        (sum, item) => sum + Number(item.currentStock || 0) * Number(item.purchasePrice || 0),
        0
      ),
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

      const matchesCategory = category === 'all' || category === 'recent' || product.category === category

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

  const isRecentView = category === 'recent'

  const filteredRecentEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return summary.entries
    return summary.entries.filter((entry) => {
      const prod = products.find((p) => p.productId === entry.productId)
      return (
        (prod?.name || '').toLowerCase().includes(query) ||
        (prod?.sku || entry.variantSku || entry.productId || '').toLowerCase().includes(query) ||
        (entry.reason || '').toLowerCase().includes(query)
      )
    })
  }, [summary.entries, products, search])

  const currentTotal = isRecentView ? filteredRecentEntries.length : filteredProducts.length
  const totalPages = Math.max(1, Math.ceil(currentTotal / pageSize))
  const effectivePage = Math.min(page, totalPages)

  const pagedProducts = useMemo(() => {
    return filteredProducts.slice((effectivePage - 1) * pageSize, effectivePage * pageSize)
  }, [filteredProducts, effectivePage, pageSize])

  const pagedRecentEntries = useMemo(() => {
    return filteredRecentEntries.slice((effectivePage - 1) * pageSize, effectivePage * pageSize)
  }, [filteredRecentEntries, effectivePage, pageSize])

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return
      if (
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key.toLowerCase() === (outward ? 'o' : 'i')
      ) {
        event.preventDefault()
        setIsModalOpen(true)
        setTimeout(() => productRef.current?.focus(), 150)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [outward])

  const startIntake = useCallback((product) => {
    if (saving) return
    setSelectedId(product.productId)
    setInputQuantity('')
    setIsModalOpen(true)
    setTimeout(() => {
      quantityRef.current?.focus()
      quantityRef.current?.select()
    }, 150)
  }, [saving])

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
    <div className="inventory-page">
      <PageHeader
        kicker="Inventory"
        title={outward ? 'Stock Outward / Dispatch Bay' : 'Stock Inward / Receiving Bay'}
        description={
          outward
            ? `Outward goods dispatch, warehouse picking, and sales deduction for ${business.name}`
            : `Record incoming stock shipments, supplier receipts, and purchase orders for ${business.name}`
        }
      />

      {!loading && !error && (
        <div className="ledger-kpi-grid">
          {/* Card 1: Inward / Dispatch */}
          <div
            className={`ledger-kpi-card ${outward ? 'theme-blue' : 'theme-green'} ${category === 'recent' ? 'is-active' : ''}`}
            onClick={() => {
              setCategory(category === 'recent' ? 'all' : 'recent')
              setPage(1)
            }}
            role="button"
            tabIndex={0}
            title={`View ${outward ? 'recent dispatches' : 'recent receipts'}`}
          >
            <div className="ledger-kpi-bubble">
              <Icon name={outward ? 'arrow' : 'box'} />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">{outward ? 'Dispatches Logged' : 'Inward Shipments'}</span>
              <span className="ledger-kpi-val">{summary.inwardCount} Records</span>
              <span className={`ledger-kpi-pill ${outward ? 'pill-blue' : 'pill-green'}`}>
                {summary.inwardUnits.toLocaleString('en-IN')} Units {outward ? 'Issued' : 'Received'}
              </span>
            </div>
          </div>

          {/* Card 2: Low Stock */}
          <div
            className={`ledger-kpi-card theme-amber ${stockStatus === 'low' ? 'is-active' : ''}`}
            onClick={() => {
              setStockStatus(stockStatus === 'low' ? 'all' : 'low')
              setPage(1)
            }}
            role="button"
            tabIndex={0}
            title="Filter low stock items"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="warning" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Critical Low Stock</span>
              <span className="ledger-kpi-val">{summary.lowCount} SKUs</span>
              <span className="ledger-kpi-pill pill-amber">Reorder Needed</span>
            </div>
          </div>

          {/* Card 3: Out of Stock */}
          <div
            className={`ledger-kpi-card theme-red ${stockStatus === 'out' ? 'is-active' : ''}`}
            onClick={() => {
              setStockStatus(stockStatus === 'out' ? 'all' : 'out')
              setPage(1)
            }}
            role="button"
            tabIndex={0}
            title="Filter out of stock items"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="warning" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Out of Stock</span>
              <span className="ledger-kpi-val">{summary.outOfStockCount} SKUs</span>
              <span className="ledger-kpi-pill pill-red">Replenish Urgently</span>
            </div>
          </div>

          {/* Card 4: Warehouse Cost */}
          <div className="ledger-kpi-card theme-purple">
            <div className="ledger-kpi-bubble">
              <Icon name="trending-up" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Warehouse Cost Value</span>
              <span className="ledger-kpi-val">{money(summary.value)}</span>
              <span className="ledger-kpi-pill pill-purple">Purchase Basis</span>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div style={{ marginBottom: '14px' }}>
          <FormStatus
            type={message.type === 'error' ? 'error' : 'success'}
            message={message.text}
          />
        </div>
      )}

      {/* Products list with current stock levels */}
      <div className="modern-panel-card content-list-panel">
        <div className="content-list-header">
          <div className="content-list-title-wrap">
            <h2 className="content-list-title">
              {isRecentView
                ? (outward ? 'Recent Dispatches' : 'Recent Receipts')
                : (outward ? 'Dispatch Catalog' : 'Receiving Catalog')}{' '}
              <span className="content-list-count">
                ({isRecentView ? filteredRecentEntries.length : filteredProducts.length})
              </span>
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
                aria-label="Search catalog"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder={isRecentView ? "Search receipts, order ref, product…" : "Search product, SKU, barcode, brand…"}
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
              <option value="recent">
                {outward ? 'Recent Dispatches' : 'Recent Receipts'} ({summary.entries.length})
              </option>
              {summary.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="content-list-select"
              aria-label="Filter by stock status"
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">All stock levels</option>
              <option value="in">In Stock (Healthy)</option>
              <option value="low">Low Stock Alert ({summary.lowCount})</option>
              <option value="out">Out of Stock ({summary.outOfStockCount})</option>
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
              onClick={exportDispatches}
              disabled={!summary.entries.length}
              title="Export Log"
            >
              Export Log
            </button>

            <button
              type="button"
              className="content-list-action-btn"
              onClick={() => {
                setSelectedId('')
                setInputQuantity('')
                setIsModalOpen(true)
              }}
              title={outward ? 'Record Outward Dispatch' : 'Record Inward Stock'}
            >
              {outward ? '+ Outward' : '+ Inward'}
            </button>
          </div>
        </div>

        <AsyncBoundary
          loading={loading}
          error={error}
          onRetry={refetch}
          isEmpty={isRecentView ? !filteredRecentEntries.length : !filteredProducts.length}
          emptyText={
            isRecentView
              ? `No recent ${outward ? 'dispatches' : 'receipts'} recorded yet.`
              : products.length
              ? 'No items match your search and filter criteria.'
              : `No products found. Add products to begin ${outward ? 'dispatching' : 'receiving'} stock.`
          }
        >
          <div className="content-list-table-wrap">
            {isRecentView ? (
              <table className="content-list-table">
                <thead>
                  <tr>
                    <th style={{ width: '32%' }}>Product & Details</th>
                    <th style={{ width: '18%' }}>Category & Location</th>
                    <th style={{ width: '18%' }}>Date & Time</th>
                    <th style={{ width: '14%' }}>Quantity</th>
                    <th style={{ width: '18%' }}>Reason / Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRecentEntries.map((item, index) => {
                    const prod = products.find((p) => p.productId === item.productId)
                    const avatarClass = getProductAvatarClass(prod?.name || item.productId)
                    const initial = (prod?.name || 'P').charAt(0).toUpperCase()
                    return (
                      <tr key={item.id || item._id || `${item.productId}-${item.createdAt}-${index}`}>
                        <td className="cl-cell-product">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className={`product-avatar ${avatarClass}`}>{initial}</span>
                            <div>
                              <div className="cl-product-name">{prod?.name || item.productId}</div>
                              <div className="cl-product-meta">
                                <span className="cl-product-sku">SKU: {prod?.sku || item.variantSku || (item.productId ? String(item.productId).slice(-6) : 'N/A')}</span>
                                {prod?.brand && (
                                  <span className="cl-product-brand"> · {prod.brand}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="cl-cell-category">
                          <div>
                            <span className="ledger-category-pill">{prod?.category || 'General'}</span>
                            {prod?.rackLocation && (
                              <div style={{ fontSize: '11px', color: 'var(--text-soft)', marginTop: '4px' }}>
                                📍 {prod.rackLocation}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="cl-cell-date">
                          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>
                            {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <div style={{ fontSize: '11px', color: 'var(--text-soft)', marginTop: '2px' }}>
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="cl-cell-stock">
                          <span className={`inventory-qty-val ${outward ? 'out' : 'in'}`} style={{ fontSize: '13px' }}>
                            {outward ? '-' : '+'}{item.quantity} {prod?.unit || 'units'}
                          </span>
                        </td>
                        <td className="cl-cell-details">
                          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>
                            {item.reason || (outward ? 'Dispatch' : 'Inward receipt')}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <table className="content-list-table">
                <thead>
                  <tr>
                    <th style={{ width: '32%' }}>Product & Details</th>
                    <th style={{ width: '16%' }}>Category</th>
                    <th style={{ width: '18%' }}>Available Stock</th>
                    <th style={{ width: '14%' }}>Last {outward ? 'Dispatch' : 'Inward'}</th>
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
                    const pct = Math.min(100, Math.max(8, Math.round((stock / Math.max(min * 2, 10)) * 100)))
                    const stockState = isOutOfStock ? 'out' : isLowStock ? 'low' : 'in'

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
                                {product.expiryDate && (
                                  <span className="cl-product-brand"> · Exp: {String(product.expiryDate).slice(0, 10)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="cl-cell-category">
                          <span className="ledger-category-pill">{product.category || 'General'}</span>
                        </td>
                        <td className="cl-cell-stock">
                          <div className="product-stock-cell">
                            <div className="product-stock-header">
                              <span className={`product-stock-val ${stockState}`}>{stock.toLocaleString('en-IN')}</span>
                              <span className="product-stock-unit">{product.unit || 'units'}</span>
                            </div>
                            <div className="stock-meter-wrap" title={`${stock} units (${pct}% health)`}>
                              <span className={`stock-meter-fill ${stockState}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="cl-cell-date">
                          {latest ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className={`inventory-qty-val ${outward ? 'out' : 'in'}`}>
                                {outward ? '-' : '+'}
                                {latest.quantity}
                              </span>
                              <small style={{ color: 'var(--text-soft)', fontSize: '11px' }}>
                                {new Date(latest.createdAt).toLocaleDateString()}
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
                            className={`ledger-op-btn ${outward ? 'op-out' : 'op-in'}`}
                            onClick={() => startIntake(product)}
                            aria-label={`${outward ? 'Dispatch' : 'Receive'} ${product.name}`}
                          >
                            {outward ? '- Dispatch' : '+ Inward'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="content-list-pagination">
            <span className="content-list-pagination-info">
              Showing {(effectivePage - 1) * pageSize + 1} to{' '}
              {Math.min(effectivePage * pageSize, currentTotal)} of {currentTotal}{' '}
              {isRecentView
                ? (outward ? 'dispatches' : 'receipts')
                : (capabilities.productLabel === 'Medicines' ? 'medicines' : 'products')}
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

      {/* Modal Intake / Dispatch Console */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedId('')
          setInputQuantity('')
        }}
        title={operationLabel}
        kicker={outward ? 'Dispatch Bay' : 'Fast Intake'}
        size="lg"
      >
        <div style={{ marginTop: '4px' }}>
          {/* Terminal Card */}
          <section className={`inventory-terminal-card ${outward ? 'terminal-out' : 'terminal-in'}`} aria-labelledby="terminal-title">
            <div className="inventory-terminal-header">
              <div className="inventory-terminal-title-wrap">
                <div className={`inventory-terminal-icon ${outward ? 'out' : 'in'}`}>
                  <Icon name={outward ? 'arrow' : 'box'} />
                </div>
                <div>
                  <h3 id="terminal-title" className="inventory-terminal-title">
                    {operationLabel}
                    <Badge tone={outward ? 'danger' : 'success'} dot>
                      {outward ? 'Outward Dispatch' : 'Fast Intake'}
                    </Badge>
                  </h3>
                </div>
              </div>
              <kbd className="inventory-kbd">Alt + {outward ? 'O' : 'I'}</kbd>
            </div>

            {/* Live Product Context Card */}
            {selectedProduct && (
              <div className="inventory-live-context-card">
                <span className={`product-avatar ${getProductAvatarClass(selectedProduct.name)}`}>
                  {(selectedProduct.name || 'P').charAt(0).toUpperCase()}
                </span>
                <div className="live-context-info">
                  <div className="live-context-title-row">
                    <span className="live-context-name">{selectedProduct.name}</span>
                    <span className="ledger-sku-pill">{selectedProduct.sku || selectedProduct.productId.slice(-6)}</span>
                    {selectedProduct.brand && (
                      <span className="cl-product-brand" style={{ fontSize: '11.5px', color: 'var(--text-soft)' }}>
                        · {selectedProduct.brand}
                      </span>
                    )}
                  </div>
                  <div className="live-context-meta">
                    <span>Rack: <strong>{selectedProduct.rackLocation || selectedProduct.warehouse || 'Unassigned'}</strong></span>
                    <span>Unit Cost: <strong>{money(selectedProduct.purchasePrice)}</strong></span>
                    {selectedProduct.supplier && <span>Supplier: <strong>{selectedProduct.supplier}</strong></span>}
                  </div>
                </div>
                <div className="live-context-stock">
                  <span className="live-context-stock-label">Current Stock</span>
                  <span className={`live-context-stock-val ${Number(selectedProduct.currentStock || 0) <= Number(selectedProduct.minimumStock || 10) ? 'low' : ''}`}>
                    {selectedProduct.currentStock} {selectedProduct.unit || 'units'}
                  </span>
                </div>
              </div>
            )}

            <form
              ref={formRef}
              onSubmit={onSubmit}
              onReset={() => {
                setSelectedId('')
                setInputQuantity('')
              }}
              className="inventory-form"
            >
              <div className="inventory-form-grid">
                <div className="inventory-field">
                  <label htmlFor="terminal-product">Product / SKU *</label>
                  <Select
                    ref={productRef}
                    id="terminal-product"
                    name="productId"
                    value={selectedId}
                    required
                    disabled={saving}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a {capabilities.productLabel === 'Medicines' ? 'medicine' : 'product'}…
                    </option>
                    {products.map((product) => (
                      <option key={product.productId} value={product.productId}>
                        {product.name} ({product.sku})
                        {product.batchNumber ? ` · Batch: ${product.batchNumber}` : ''} ·{' '}
                        {product.currentStock} {product.unit || 'units'} available
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="inventory-field">
                  <label htmlFor="terminal-quantity">Quantity *</label>
                  <div className="inventory-input-with-suffix">
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
                      value={inputQuantity}
                      onChange={(e) => setInputQuantity(e.target.value)}
                    />
                    <span className="inventory-suffix">
                      {selectedProduct?.unit || 'units'}
                    </span>
                  </div>
                </div>

                <div className="inventory-field">
                  <label htmlFor="terminal-reason">Reason / Type</label>
                  <Input
                    id="terminal-reason"
                    name="reason"
                    list="terminal-reasons"
                    placeholder={
                      outward
                        ? 'e.g. Sale, damage, transfer'
                        : 'e.g. Purchase order, supplier receipt'
                    }
                    disabled={saving}
                  />
                  <datalist id="terminal-reasons">
                    {(outward
                      ? ['Sale', 'Damage', 'Transfer dispatch', 'Internal store use', 'Expired']
                      : [
                          'Purchase order',
                          'Customer return',
                          'Transfer receipt',
                          'Opening stock',
                          'Stock replenishment',
                        ]
                    ).map((reason) => (
                      <option key={reason} value={reason} />
                    ))}
                  </datalist>
                </div>

                <Button
                  type="submit"
                  variant={outward ? 'danger' : 'primary'}
                  loading={saving}
                  disabled={saving || isExceedingStock}
                >
                  {saving ? 'Recording…' : operationLabel}
                </Button>
              </div>

              {/* Live Stock Guard Alert */}
              {isExceedingStock && (
                <div className="inventory-guard-alert" role="alert">
                  <span>⚠️</span>
                  <span>Cannot issue more than available stock (Max: {selectedProduct.currentStock} {selectedProduct.unit || 'units'})</span>
                </div>
              )}

              <div className="inventory-context-row">
                <div className="inventory-context-tile tile-blue">
                  <span className="inventory-context-icon">📍</span>
                  <div className="inventory-context-details">
                    <span className="inventory-context-label">Rack / Bin Location</span>
                    <span className="inventory-context-value">
                      {selectedProduct
                        ? selectedProduct.rackLocation || selectedProduct.warehouse || 'Unassigned'
                        : 'Select a product to view location'}
                    </span>
                  </div>
                </div>
                <div className="inventory-context-tile tile-purple">
                  <span className="inventory-context-icon">💰</span>
                  <div className="inventory-context-details">
                    <span className="inventory-context-label">Unit Purchase Cost ({currency})</span>
                    <span className="inventory-context-value">
                      {selectedProduct ? money(selectedProduct.purchasePrice) : '—'}
                    </span>
                  </div>
                </div>
                <div className={`inventory-context-tile ${outward ? 'tile-rose' : 'tile-green'}`}>
                  <span className="inventory-context-icon">{outward ? '👤' : '🚚'}</span>
                  <div className="inventory-context-details">
                    <span className="inventory-context-label">
                      {outward ? 'Authorized Operator' : 'Assigned Supplier'}
                    </span>
                    <span className="inventory-context-value">
                      {outward
                        ? `${account?.name || account?.email || 'Current user'} (${account?.role || 'Staff'})`
                        : selectedProduct?.supplier || 'Standard Supplier'}
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
        </div>
      </Modal>
    </div>
  )
}
