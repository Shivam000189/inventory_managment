import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PageHeader,
  Button,
  Badge,
  StatGrid,
  StatCard,
  Toolbar,
  DataTable,
  Select,
  Input,
  FormStatus,
  Icon,
} from '../../components/ui/index.js'
import { getProductAvatarClass } from './inventoryUtils.js'
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
  const [selectedKeys, setSelectedKeys] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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

  const columns = useMemo(() => {
    return [
      {
        key: 'sku',
        header: 'SKU',
        mobileLabel: 'SKU',
        render: (product) => (
          <code style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            {product.sku || product.productId.slice(-6)}
          </code>
        ),
      },
      {
        key: 'product',
        header: 'Product & Details',
        mobileLabel: 'Product',
        render: (product) => (
          <div className="inventory-prod-cell">
            <span className={`inventory-prod-avatar ${getProductAvatarClass(product.name)}`}>
              {product.name?.[0]?.toUpperCase()}
            </span>
            <div className="inventory-prod-info">
              <span className="inventory-prod-name">{product.name}</span>
              <span className="inventory-prod-meta">
                {[
                  product.brand,
                  product.batchNumber ? `Batch: ${product.batchNumber}` : null,
                  product.expiryDate ? `Exp: ${String(product.expiryDate).slice(0, 10)}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'category',
        header: 'Category',
        mobileLabel: 'Category',
        render: (product) => <Badge tone="neutral">{product.category || 'Unassigned'}</Badge>,
      },
      {
        key: 'stock',
        header: 'Recorded Stock',
        mobileLabel: 'Stock',
        render: (product) => {
          const stock = Number(product.currentStock || 0)
          const minimum = Number(product.minimumStock || 10)
          const state = stock === 0 ? 'out' : stock <= minimum ? 'low' : 'in'
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`inventory-qty-val ${state}`}>
                {stock.toLocaleString('en-IN')}
              </span>
              <small style={{ color: 'var(--text-soft)', fontSize: '11.5px', fontWeight: 600 }}>
                {product.unit || 'units'}
              </small>
            </div>
          )
        },
      },
      {
        key: 'lastAdjust',
        header: 'Last Adjustment',
        mobileLabel: 'Last Adjustment',
        render: (product) => {
          const latest = summary.latest.get(product.productId)
          if (!latest) return <span style={{ color: 'var(--text-soft)', fontSize: '12px' }}>Never</span>
          const variance = Number(latest.newStock || 0) - Number(latest.previousStock || 0)
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`inventory-qty-val ${variance < 0 ? 'out' : variance > 0 ? 'in' : 'adjust'}`}>
                {variance > 0 ? `+${variance}` : variance}
              </span>
              <small style={{ color: 'var(--text-soft)', fontSize: '11px' }}>
                {latest.reason || 'Reconciled'}
              </small>
            </div>
          )
        },
      },
      {
        key: 'status',
        header: 'Status',
        mobileLabel: 'Status',
        render: (product) => {
          const stock = Number(product.currentStock || 0)
          const minimum = Number(product.minimumStock || 10)
          const isOut = stock === 0
          const isLow = stock <= minimum && !isOut
          return (
            <Badge tone={isOut ? 'danger' : isLow ? 'warning' : 'success'} dot>
              {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
            </Badge>
          )
        },
      },
      {
        key: 'actions',
        header: '',
        mobileLabel: 'Actions',
        align: 'right',
        render: (product) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => startAdjustment(product)}
            aria-label={`Adjust ${product.name}`}
          >
            Reconcile
          </Button>
        ),
      },
    ]
  }, [summary.latest, startAdjustment])

  return (
    <div className="inventory-page">
      <PageHeader
        kicker="Inventory"
        title="Stock Adjustments & Reconciliation"
        description={`Reconcile physical stock counts, log damage/shrinkage, and audit inventory for ${business.name}`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={exportAdjustments}
              disabled={!summary.entries.length}
              icon="download"
            >
              Export log
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate?.('Stock')}
              icon="eye"
            >
              View Stock Ledger
            </Button>
          </>
        }
      />

      {!loading && !error && (
        <StatGrid>
          <StatCard
            label="Reconciliations Logged"
            value={summary.entries.length}
            helpText="Total adjustments recorded"
            icon="clock"
            tone="purple"
          />
          <StatCard
            label="Net Variance"
            value={`${summary.netVariance >= 0 ? '+' : ''}${summary.netVariance} units`}
            helpText="Physical count variance"
            icon="variance"
            tone={summary.netVariance < 0 ? 'rose' : summary.netVariance > 0 ? 'green' : 'neutral'}
          />
          <StatCard
            label="Flagged for Audit"
            value={summary.flaggedCount}
            helpText="SKUs with low or zero balance"
            icon="warning"
            tone={summary.flaggedCount > 0 ? 'yellow' : 'neutral'}
          />
          <StatCard
            label="Valuation Impact"
            value={formatMoney(summary.valueImpact)}
            helpText="Net inventory cost difference"
            icon="trending-up"
            tone={summary.valueImpact < 0 ? 'rose' : summary.valueImpact > 0 ? 'green' : 'neutral'}
          />
        </StatGrid>
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
            <div className={`inventory-context-tile ${selectedVariance < 0 ? 'tile-rose' : selectedVariance > 0 ? 'tile-green' : 'tile-yellow'}`}>
              <span className="inventory-context-icon">⚖️</span>
              <div className="inventory-context-details">
                <span className="inventory-context-label">Calculated Variance</span>
                <span
                  className="inventory-context-value"
                  style={{
                    color:
                      selectedVariance === null
                        ? 'inherit'
                        : selectedVariance < 0
                        ? 'var(--danger)'
                        : selectedVariance > 0
                        ? 'var(--success)'
                        : 'var(--text-soft)',
                  }}
                >
                  {selectedVariance === null
                    ? '—'
                    : selectedVariance === 0
                    ? 'No discrepancy (0 change)'
                    : `${selectedVariance > 0 ? '+' : ''}${selectedVariance} ${selectedProduct?.unit || 'units'}`}
                </span>
              </div>
            </div>
            <div className={`inventory-context-tile ${selectedVariance < 0 ? 'tile-rose' : selectedVariance > 0 ? 'tile-green' : 'tile-purple'}`}>
              <span className="inventory-context-icon">💰</span>
              <div className="inventory-context-details">
                <span className="inventory-context-label">Financial Value Variance</span>
                <span className="inventory-context-value">
                  {selectedVariance !== null && selectedProduct
                    ? formatMoney(selectedVariance * Number(selectedProduct.purchasePrice || 0))
                    : '—'}
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
      <Toolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        placeholder="Search product, SKU, barcode, brand…"
        filters={
          <>
            <Select
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
            </Select>

            <Select
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
            </Select>

            <Select
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
            </Select>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={filteredProducts}
        keyField="productId"
        selectable={true}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        page={page}
        pageSize={pageSize}
        total={filteredProducts.length}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize)
          setPage(1)
        }}
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyText={
          products.length
            ? 'No items match your search and filter criteria.'
            : 'No products found to adjust.'
        }
      />
    </div>
  )
}
