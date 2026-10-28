import { useCallback, useMemo, useState } from 'react'
import { productApi } from '../../api/productApi.js'
import { inventoryApi } from '../../api/inventoryApi.js'
import { useResource } from '../../hooks/useResource.js'
import { PageHeader, Badge, DataTable, Icon } from '../../components/ui/index.js'
import StockInView, { StockOutView } from './StockInView.jsx'
import StockAdjustmentView from './StockAdjustmentView.jsx'
import StockHistoryView from './StockHistoryView.jsx'
import CategoriesView from '../products/CategoriesPage.jsx'
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

  const columns = useMemo(() => {
    return [
      {
        key: 'sku',
        header: 'Id',
        mobileLabel: 'Id',
        width: '80px',
        render: (product, index) => (
          <span className="ledger-cell-id">
            {product.sku || (product.productId ? String(product.productId).replace(/\D/g, '').slice(-3) || String(product.productId).slice(-5) : 101 + index)}
          </span>
        ),
      },
      {
        key: 'product',
        header: 'Bill From',
        mobileLabel: 'Product',
        render: (product) => (
          <div>
            <span className="ledger-cell-primary">{product.name}</span>
            {product.brand && (
              <div className="ledger-cell-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>
                {product.brand}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'location',
        header: 'Bill To',
        mobileLabel: 'Location',
        render: (product) => (
          <span className="ledger-cell-secondary">
            {[product.category, product.rackLocation || product.warehouse].filter(Boolean).join(' · ') || 'General Warehouse'}
          </span>
        ),
      },
      {
        key: 'cost',
        header: 'Total Cost',
        mobileLabel: 'Cost',
        render: (product) => {
          const stock = Number(product.currentStock || 0)
          return (
            <div>
              <span className="ledger-cell-cost">
                {product.sellingPrice ? money(product.sellingPrice) : '90'}
              </span>
              <div className="ledger-cell-secondary" style={{ fontSize: '11px', marginTop: '2px' }}>
                {stock} {product.unit || 'units'}
              </div>
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
          let statusType = 'delivered'
          let statusLabel = 'Delivered'

          if (stock === 0) {
            statusType = 'danger'
            statusLabel = 'Out of Stock'
          } else if (stock <= minimum) {
            statusType = 'pending'
            statusLabel = 'Pending'
          } else if (stock > minimum * 2) {
            statusType = 'delivered'
            statusLabel = 'Delivered'
          } else {
            statusType = 'shipped'
            statusLabel = 'Shipped'
          }

          return (
            <span className={`ledger-status-pill status-${statusType}`}>
              {statusLabel}
            </span>
          )
        },
      },
      {
        key: 'actions',
        header: 'Action',
        mobileLabel: 'Action',
        align: 'right',
        render: (product) => (
          <div className="ledger-actions-group">
            <button
              type="button"
              className="ledger-action-icon action-edit"
              onClick={() => onNavigate?.('Adjustments')}
              aria-label={`Reconcile ${product.name}`}
              title="Audit / Reconcile"
            >
              <Icon name="edit" size={17} />
            </button>
            <button
              type="button"
              className="ledger-action-icon action-view"
              onClick={() => onNavigate?.('History')}
              aria-label={`View history of ${product.name}`}
              title="View History"
            >
              <Icon name="eye" size={17} />
            </button>
            <button
              type="button"
              className="ledger-action-icon action-delete"
              onClick={() => onNavigate?.('Stock Out')}
              aria-label={`Dispatch or Stock Out ${product.name}`}
              title="Stock Out / Adjust"
            >
              <Icon name="trash" size={17} />
            </button>
          </div>
        ),
      },
    ]
  }, [money, onNavigate])

  return (
    <div className="inventory-page">
      {/* 4 Pastel Top KPI Cards in a Horizontal Row (Matching user screenshot) */}
      {!loading && !error && (
        <div className="ledger-kpi-grid">
          {/* Card 1: Total */}
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
              <Icon name="list" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Total</span>
              <span className="ledger-kpi-val">{products.length} Invoices</span>
            </div>
          </div>

          {/* Card 2: Shipped */}
          <div
            className={`ledger-kpi-card theme-slate ${status === 'shipped' ? 'is-active' : ''}`}
            onClick={() => {
              setStatus(status === 'shipped' ? 'all' : 'shipped')
              setPage(1)
            }}
            role="button"
            tabIndex={0}
            title="Filter shipped stock"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="bag" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Shipped</span>
              <span className="ledger-kpi-val">{counts.shipped} Invoices</span>
            </div>
          </div>

          {/* Card 3: Delivered */}
          <div
            className={`ledger-kpi-card theme-green ${status === 'delivered' ? 'is-active' : ''}`}
            onClick={() => {
              setStatus(status === 'delivered' ? 'all' : 'delivered')
              setPage(1)
            }}
            role="button"
            tabIndex={0}
            title="Filter delivered stock"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="truck" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Delivered</span>
              <span className="ledger-kpi-val">{counts.delivered} Invoices</span>
            </div>
          </div>

          {/* Card 4: Pending */}
          <div
            className={`ledger-kpi-card theme-amber ${status === 'pending' ? 'is-active' : ''}`}
            onClick={() => {
              setStatus(status === 'pending' ? 'all' : 'pending')
              setPage(1)
            }}
            role="button"
            tabIndex={0}
            title="Filter pending stock"
          >
            <div className="ledger-kpi-bubble">
              <Icon name="pending" />
            </div>
            <div className="ledger-kpi-content">
              <span className="ledger-kpi-label">Pending</span>
              <span className="ledger-kpi-val">{counts.pending} Invoices</span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Action Toolbar (Pill Capsule + New Invoice Button) */}
      <div className="ledger-toolbar">
        <div className="ledger-toolbar-left">
          <div className="ledger-search-box">
            <input
              type="text"
              className="ledger-search-input"
              placeholder="Search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              aria-label="Search invoices and products"
            />
            <span className="ledger-search-icon">
              <Icon name="search" size={16} />
            </span>
          </div>

          <select
            className="ledger-pill-select"
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
            className="ledger-pill-select"
            aria-label="Filter status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">All Statuses ({products.length})</option>
            <option value="shipped">Shipped ({counts.shipped})</option>
            <option value="delivered">Delivered ({counts.delivered})</option>
            <option value="pending">Pending ({counts.pending})</option>
            <option value="out">Out of Stock ({counts.out})</option>
          </select>

          <select
            className="ledger-pill-select"
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
        </div>

        <div className="ledger-toolbar-right">
          <button
            type="button"
            className="ledger-btn-secondary"
            onClick={exportLedger}
            disabled={!visible.length}
            title="Export CSV"
          >
            <Icon name="download" size={15} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="ledger-btn-secondary"
            onClick={() => onNavigate?.('Adjustments')}
            title="Audit Reconciliation"
          >
            <Icon name="refresh" size={15} />
            <span>Audit Count</span>
          </button>

          <button
            type="button"
            className="ledger-btn-primary"
            onClick={() => onNavigate?.('Stock In')}
            title="Create New Invoice or Inward Stock"
          >
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Ledger Data Table */}
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
        emptyText={products.length ? 'No invoices match these filters.' : 'No invoices in this workspace yet.'}
      />
    </div>
  )
}

export default InventoryOperations
