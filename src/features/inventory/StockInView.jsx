import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { resolveBusinessCapabilities } from '../../../shared/industryConfig.js'
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
  onNavigate,
  canNavigate,
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
  const [selectedKeys, setSelectedKeys] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const productRef = useRef(null)
  const quantityRef = useRef(null)
  const formRef = useRef(null)

  const selectedProduct = products.find((product) => product.productId === selectedId)
  const currency = business.currency || 'INR'

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
        productRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [outward])

  const startIntake = useCallback((product) => {
    if (saving) return
    setSelectedId(product.productId)
    formRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setTimeout(() => {
      quantityRef.current?.focus()
      quantityRef.current?.select()
    }, 100)
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
            <span className="inventory-prod-avatar">{product.name?.[0]?.toUpperCase()}</span>
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
        header: 'Available Stock',
        mobileLabel: 'Stock',
        render: (product) => {
          const stock = Number(product.currentStock || 0)
          const minimum = Number(product.minimumStock || 10)
          const state = stock === 0 ? 'out' : stock <= minimum ? 'low' : 'in'
          return (
            <div>
              <span className={`inventory-qty-val ${state}`}>{stock.toLocaleString('en-IN')}</span>{' '}
              <small style={{ color: 'var(--text-soft)', fontSize: '11px' }}>
                {product.unit || 'units'}
              </small>
            </div>
          )
        },
      },
      {
        key: 'lastMovement',
        header: `Last ${outward ? 'Dispatch' : 'Inward'}`,
        mobileLabel: 'Last Movement',
        render: (product) => {
          const latest = summary.latest.get(product.productId)
          if (!latest) return <span style={{ color: 'var(--text-soft)', fontSize: '12px' }}>Never</span>
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>
                {outward ? '-' : '+'}
                {latest.quantity} {product.unit || 'units'}
              </span>
              <small style={{ color: 'var(--text-soft)', fontSize: '11px' }}>
                {new Date(latest.createdAt).toLocaleDateString()}
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
            <Badge tone={isOut ? 'danger' : isLow ? 'warning' : 'success'}>
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
            onClick={() => startIntake(product)}
            aria-label={`${outward ? 'Dispatch' : 'Receive'} ${product.name}`}
          >
            {outward ? 'Dispatch' : 'Receive'}
          </Button>
        ),
      },
    ]
  }, [outward, summary.latest, startIntake])

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
        actions={
          <>
            <Button
              variant="outline"
              onClick={exportDispatches}
              disabled={!summary.entries.length}
              icon="download"
            >
              Export log
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate?.(canNavigate?.('Medicines') ? 'Medicines' : 'Products')}
              icon="plus"
            >
              + New {capabilities.productLabel === 'Medicines' ? 'Medicine' : 'Product'}
            </Button>
          </>
        }
      />

      {!loading && !error && (
        <StatGrid>
          <StatCard
            label={outward ? 'Dispatches Logged' : 'Inward Shipments'}
            value={summary.inwardCount}
            helpText={`${summary.inwardUnits.toLocaleString('en-IN')} units logged`}
            icon="clock"
            tone="blue"
          />
          <StatCard
            label="Critical Low Stock"
            value={summary.lowCount}
            helpText="SKUs at or below reorder level"
            icon="warning"
            tone={summary.lowCount > 0 ? 'warning' : 'neutral'}
          />
          <StatCard
            label="Out of Stock"
            value={summary.outOfStockCount}
            helpText="Immediate replenishment required"
            icon="alert"
            tone={summary.outOfStockCount > 0 ? 'danger' : 'neutral'}
          />
          <StatCard
            label="Warehouse Cost Value"
            value={money(summary.value)}
            helpText="Live purchase cost balance"
            icon="trending-up"
            tone="success"
          />
        </StatGrid>
      )}

      {/* Intake / Dispatch Terminal Card */}
      <section className="inventory-terminal-card" aria-labelledby="terminal-title">
        <div className="inventory-terminal-header">
          <div className="inventory-terminal-title-wrap">
            <div className={`inventory-terminal-icon ${outward ? 'out' : 'in'}`}>
              <Icon name="box" />
            </div>
            <div>
              <h3 id="terminal-title" className="inventory-terminal-title">
                {operationLabel}
                <Badge tone={outward ? 'danger' : 'info'}>
                  {outward ? 'Outward Dispatch' : 'Fast Intake'}
                </Badge>
              </h3>
            </div>
          </div>
          <kbd className="inventory-kbd">Alt + {outward ? 'O' : 'I'}</kbd>
        </div>

        <form
          ref={formRef}
          onSubmit={onSubmit}
          onReset={() => setSelectedId('')}
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
              icon={outward ? 'arrow' : 'plus'}
            >
              {saving ? 'Recording…' : operationLabel}
            </Button>
          </div>

          <div className="inventory-context-row">
            <div className="inventory-context-tile">
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
            <div className="inventory-context-tile">
              <span className="inventory-context-icon">💰</span>
              <div className="inventory-context-details">
                <span className="inventory-context-label">Unit Purchase Cost ({currency})</span>
                <span className="inventory-context-value">
                  {selectedProduct ? money(selectedProduct.purchasePrice) : '—'}
                </span>
              </div>
            </div>
            <div className="inventory-context-tile">
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

      {/* Products list with current stock levels */}
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
            : `No products found. Add products to begin ${outward ? 'dispatching' : 'receiving'} stock.`
        }
      />
    </div>
  )
}
