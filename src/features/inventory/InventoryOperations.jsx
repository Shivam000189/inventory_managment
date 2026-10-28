import { useCallback, useMemo, useState } from 'react'
import { productApi } from '../../api/productApi.js'
import { inventoryApi } from '../../api/inventoryApi.js'
import { useResource } from '../../hooks/useResource.js'
import {
  PageHeader,
  Button,
  Badge,
  StatGrid,
  StatCard,
  Toolbar,
  DataTable,
  Select,
} from '../../components/ui/index.js'
import StockInView, { StockOutView } from './StockInView.jsx'
import StockAdjustmentView from './StockAdjustmentView.jsx'
import StockHistoryView from './StockHistoryView.jsx'
import CategoriesView from '../products/CategoriesPage.jsx'
import { getProductAvatarClass } from './inventoryUtils.js'
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
  const [selected, setSelected] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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
          if (stock === 0) result.out += 1
          else if (stock <= minimum) result.low += 1
          else result.in += 1
          return result
        },
        { units: 0, value: 0, in: 0, low: 0, out: 0 }
      ),
    [products]
  )

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    let list = products.filter((product) => {
      const stock = Number(product.currentStock || 0)
      const minimum = Number(product.minimumStock || 10)
      const stockStatus = stock === 0 ? 'out' : stock <= minimum ? 'low' : 'in'
      const matchesSearch =
        !query ||
        `${product.name} ${product.sku} ${product.category} ${product.brand || ''} ${product.rackLocation || ''}`
          .toLowerCase()
          .includes(query)
      return (
        matchesSearch &&
        (status === 'all' || status === stockStatus) &&
        (category === 'all' || category === product.category)
      )
    })

    if (sortOrder === 'high') {
      list = [...list].sort((a, b) => Number(b.currentStock || 0) - Number(a.currentStock || 0))
    } else if (sortOrder === 'low') {
      list = [...list].sort((a, b) => Number(a.currentStock || 0) - Number(b.currentStock || 0))
    }

    return list
  }, [products, search, status, category, sortOrder])

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
                {[product.brand, product.unit ? `Unit: ${product.unit}` : null].filter(Boolean).join(' · ')}
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
        key: 'location',
        header: 'Bin Location',
        mobileLabel: 'Location',
        render: (product) => (
          <Badge tone="neutral">
            {product.rackLocation || product.warehouse || 'Unassigned'}
          </Badge>
        ),
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`inventory-qty-val ${state}`}>{stock.toLocaleString('en-IN')}</span>
              <small style={{ color: 'var(--text-soft)', fontSize: '11.5px', fontWeight: 600 }}>
                {product.unit || 'units'}
              </small>
            </div>
          )
        },
      },
      {
        key: 'price',
        header: 'Price',
        mobileLabel: 'Price',
        align: 'right',
        render: (product) => <strong>{money(product.sellingPrice)}</strong>,
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
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate?.('Adjustments')}
              aria-label={`Reconcile ${product.name}`}
            >
              Reconcile
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate?.('Stock In')}
              aria-label={`Stock In ${product.name}`}
            >
              + In
            </Button>
          </div>
        ),
      },
    ]
  }, [money, onNavigate])

  return (
    <div className="inventory-page">
      <PageHeader
        kicker="Inventory"
        title="Stock Ledger & Balance"
        description={`Real-time SKU balances, warehouse cost valuation, and inventory thresholds for ${business.name}`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={exportLedger}
              disabled={!visible.length}
              icon="download"
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate?.('Adjustments')}
              icon="refresh"
            >
              Audit Count
            </Button>
            <Button
              variant="primary"
              onClick={() => onNavigate?.('Stock In')}
              icon="plus"
            >
              Inward Stock
            </Button>
          </>
        }
      />

      {!loading && !error && (
        <StatGrid>
          <StatCard
            label="Total Units on Hand"
            value={counts.units.toLocaleString('en-IN')}
            helpText={`Across ${products.length} catalogued SKUs`}
            icon="box"
            tone="blue"
          />
          <StatCard
            label="Inventory Valuation"
            value={money(counts.value)}
            helpText="Weighted purchase cost"
            icon="trending-up"
            tone="green"
          />
          <StatCard
            label="Critical Low Stock"
            value={counts.low + counts.out}
            helpText={
              counts.out > 0
                ? `${counts.out} out of stock · ${counts.low} low`
                : 'At or below threshold'
            }
            icon="warning"
            tone={counts.low + counts.out > 0 ? 'rose' : 'green'}
            onClick={() => {
              setStatus('low')
              setPage(1)
            }}
          />
          <StatCard
            label="Catalog Density"
            value={`${products.length} SKUs`}
            helpText={`${categories.length} categories active`}
            icon="layers"
            tone="purple"
            onClick={() => onNavigate?.('Categories')}
          />
        </StatGrid>
      )}

      <Toolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        placeholder="Search product, SKU, category, bin location…"
        filters={
          <>
            <Select
              aria-label="Filter stock category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>

            <Select
              aria-label="Filter stock status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="all">All items ({products.length})</option>
              <option value="in">In stock ({counts.in})</option>
              <option value="low">Low stock ({counts.low})</option>
              <option value="out">Out of stock ({counts.out})</option>
            </Select>

            <Select
              aria-label="Sort stock ledger"
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
        data={visible}
        keyField="productId"
        selectable={true}
        selectedKeys={selected}
        onSelectionChange={setSelected}
        page={page}
        pageSize={pageSize}
        total={visible.length}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize)
          setPage(1)
        }}
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyText={products.length ? 'No products match these filters.' : 'No products in this workspace yet.'}
      />
    </div>
  )
}

export default InventoryOperations
