import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PageHeader,
  Button,
  Badge,
  StatGrid,
  StatCard,
  Toolbar,
  Tabs,
  DataTable,
  Select,
} from '../../components/ui/index.js'
import '../inventory/InventoryOperations.css'

const TABS = [
  { id: 'all', label: 'All Categories' },
  { id: 'healthy', label: 'Well Stocked' },
  { id: 'attention', label: 'Needs Attention' },
]

const SORTS = {
  count: { label: 'Product Count', fn: (a, b) => b.count - a.count },
  value: { label: 'Stock Valuation', fn: (a, b) => b.stockValue - a.stockValue },
  name: { label: 'Name (A–Z)', fn: (a, b) => a.category.localeCompare(b.category) },
  stock: { label: 'Units in Stock', fn: (a, b) => b.totalStock - a.totalStock },
}

export default function CategoriesView({
  products = [],
  loading,
  error,
  refetch,
  business = {},
  onNavigate,
}) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [view, setView] = useState('list')
  const [sort, setSort] = useState('count')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const searchRef = useRef(null)

  const currency = business.currency || 'INR'
  const money = useCallback(
    (value, dp = 0) => {
      const amount = Number(value || 0)
      try {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency,
          minimumFractionDigits: dp,
          maximumFractionDigits: dp,
        }).format(amount)
      } catch {
        return `${currency} ${amount.toLocaleString('en-IN', {
          minimumFractionDigits: dp,
          maximumFractionDigits: dp,
        })}`
      }
    },
    [currency]
  )

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  )

  const stats = useMemo(
    () =>
      categories.map((category) => {
        const items = products.filter((product) => product.category === category)
        const totalStock = items.reduce(
          (sum, product) => sum + Number(product.currentStock || 0),
          0
        )
        const stockValue = items.reduce(
          (sum, product) =>
            sum + Number(product.currentStock || 0) * Number(product.sellingPrice || 0),
          0
        )
        const outOfStock = items.filter((product) => Number(product.currentStock || 0) <= 0).length
        const lowStock = items.filter(
          (product) =>
            Number(product.currentStock || 0) > 0 &&
            Number(product.currentStock || 0) <= Number(product.minimumStock || 10)
        ).length
        const status =
          items.length > 0 && outOfStock === items.length
            ? 'critical'
            : outOfStock + lowStock > 0
            ? 'attention'
            : 'healthy'

        return { category, count: items.length, totalStock, stockValue, lowStock, outOfStock, status }
      }),
    [categories, products]
  )

  const totalSkus = products.length
  const flagged = stats.filter((stat) => stat.status !== 'healthy')
  const topValue = stats.reduce(
    (max, stat) => (!max || stat.stockValue > max.stockValue ? stat : max),
    null
  )

  const filteredStats = useMemo(
    () =>
      stats
        .filter(
          (stat) =>
            tab === 'all' ||
            (tab === 'healthy' && stat.status === 'healthy') ||
            (tab === 'attention' && stat.status !== 'healthy')
        )
        .filter((stat) => stat.category.toLowerCase().includes(search.trim().toLowerCase()))
        .sort(SORTS[sort].fn),
    [stats, tab, search, sort]
  )

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const exportHierarchy = () => {
    const escapeCell = (value) => {
      const text = String(value ?? '')
      const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text
      return `"${safe.replaceAll('"', '""')}"`
    }
    const rows = [
      [
        'Category',
        'Products',
        'Total Units',
        'Stock Value',
        'Low Stock Items',
        'Out Of Stock Items',
        'Status',
      ],
      ...stats.map((stat) => [
        stat.category,
        stat.count,
        stat.totalStock,
        stat.stockValue,
        stat.lowStock,
        stat.outOfStock,
        stat.status === 'critical'
          ? 'Out of Stock'
          : stat.status === 'attention'
          ? 'Low Stock'
          : 'Healthy',
      ]),
    ]
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `category-hierarchy-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const columns = useMemo(() => {
    return [
      {
        key: 'category',
        header: 'Category Name',
        mobileLabel: 'Category',
        render: (stat) => (
          <div className="inventory-prod-cell">
            <span className="inventory-prod-avatar">{stat.category[0]?.toUpperCase()}</span>
            <div className="inventory-prod-info">
              <strong className="inventory-prod-name">{stat.category}</strong>
              <small className="inventory-prod-meta">{stat.count} products registered</small>
            </div>
          </div>
        ),
      },
      {
        key: 'count',
        header: 'SKUs',
        mobileLabel: 'SKUs',
        render: (stat) => <Badge tone="neutral">{stat.count} items</Badge>,
      },
      {
        key: 'totalStock',
        header: 'Total Units',
        mobileLabel: 'Units',
        render: (stat) => (
          <span className={`inventory-qty-val ${stat.status === 'critical' ? 'out' : stat.status === 'attention' ? 'low' : 'in'}`}>
            {stat.totalStock.toLocaleString('en-IN')}
          </span>
        ),
      },
      {
        key: 'stockValue',
        header: 'Stock Valuation',
        mobileLabel: 'Valuation',
        align: 'right',
        render: (stat) => <strong>{money(stat.stockValue)}</strong>,
      },
      {
        key: 'status',
        header: 'Stock Health',
        mobileLabel: 'Health',
        render: (stat) => {
          const tone =
            stat.status === 'critical'
              ? 'danger'
              : stat.status === 'attention'
              ? 'warning'
              : 'success'
          const label =
            stat.status === 'critical'
              ? 'Out of Stock'
              : stat.status === 'attention'
              ? `${stat.lowStock + stat.outOfStock} Low/Out`
              : 'Well Stocked'
          return <Badge tone={tone} dot>{label}</Badge>
        },
      },
      {
        key: 'actions',
        header: '',
        mobileLabel: 'Actions',
        align: 'right',
        render: (stat) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate?.('Products')}
            aria-label={`View products in ${stat.category}`}
          >
            View SKUs
          </Button>
        ),
      },
    ]
  }, [money, onNavigate])

  return (
    <div className="inventory-page">
      <PageHeader
        kicker="Inventory"
        title="Category Taxonomy & Catalog Health"
        description={`Category structure, SKU distribution, and warehouse valuation for ${business.name}`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={exportHierarchy}
              disabled={loading || !!error || !stats.length}
              icon="download"
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              onClick={() => onNavigate?.('Products')}
              icon="plus"
            >
              + Add to Catalog
            </Button>
          </>
        }
      />

      {!loading && !error && (
        <StatGrid>
          <StatCard
            label="Total Categories"
            value={categories.length}
            helpText={`Across ${business.name} warehouse`}
            icon="layers"
            tone="blue"
          />
          <StatCard
            label="Catalogued SKUs"
            value={totalSkus}
            helpText="Active catalog items"
            icon="box"
            tone="purple"
            onClick={() => onNavigate?.('Products')}
          />
          <StatCard
            label="Highest Valuation"
            value={topValue ? money(topValue.stockValue) : '—'}
            helpText={topValue?.category || 'No categories'}
            icon="trending-up"
            tone="green"
          />
          <StatCard
            label="Needs Attention"
            value={flagged.length}
            helpText="Categories with stock alerts"
            icon="warning"
            tone={flagged.length > 0 ? 'yellow' : 'green'}
            onClick={() => setTab('attention')}
          />
        </StatGrid>
      )}

      <Toolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        placeholder="Search categories…"
        filters={
          <>
            <Select
              aria-label="Sort categories"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setPage(1)
              }}
            >
              {Object.entries(SORTS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </Select>

            <div style={{ display: 'flex', gap: '4px' }}>
              <Button
                variant={view === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setView('list')}
                aria-label="List view"
              >
                List
              </Button>
              <Button
                variant={view === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setView('grid')}
                aria-label="Grid view"
              >
                Cards
              </Button>
            </div>
          </>
        }
      />

      <Tabs
        tabs={TABS.map((t) => ({
          ...t,
          count:
            t.id === 'all'
              ? stats.length
              : t.id === 'healthy'
              ? stats.length - flagged.length
              : flagged.length,
        }))}
        activeId={tab}
        onChange={(id) => {
          setTab(id)
          setPage(1)
        }}
      />

      {view === 'list' ? (
        <DataTable
          columns={columns}
          data={filteredStats}
          keyField="category"
          page={page}
          pageSize={pageSize}
          total={filteredStats.length}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setPage(1)
          }}
          loading={loading}
          error={error}
          onRetry={refetch}
          emptyText="No categories match your filters."
        />
      ) : (
        <div className="categories-grid">
          {filteredStats.map((stat) => (
            <div key={stat.category} className={`category-card status-${stat.status}`}>
              <div className="category-card-header">
                <div className="category-card-title-group">
                  <div className={`category-icon-bubble ${stat.status}`}>
                    <span style={{ fontSize: '18px' }}>📁</span>
                  </div>
                  <div>
                    <h4 className="category-card-title">{stat.category}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
                      {stat.count} products catalogued
                    </span>
                  </div>
                </div>
                <Badge
                  tone={
                    stat.status === 'critical'
                      ? 'danger'
                      : stat.status === 'attention'
                      ? 'warning'
                      : 'success'
                  }
                  dot
                >
                  {stat.status === 'critical'
                    ? 'Out of Stock'
                    : stat.status === 'attention'
                    ? 'Low Stock'
                    : 'Healthy'}
                </Badge>
              </div>

              <div className="category-metric-row">
                <span style={{ color: 'var(--text-soft)', fontWeight: 600 }}>Total Units</span>
                <span className={`inventory-qty-val ${stat.status === 'critical' ? 'out' : stat.status === 'attention' ? 'low' : 'in'}`}>
                  {stat.totalStock.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="category-metric-row">
                <span style={{ color: 'var(--text-soft)', fontWeight: 600 }}>Valuation</span>
                <strong style={{ color: 'var(--ink)' }}>{money(stat.stockValue)}</strong>
              </div>

              <div className="category-card-stats">
                <span>
                  {stat.lowStock + stat.outOfStock > 0
                    ? `${stat.lowStock + stat.outOfStock} items low/out`
                    : 'Stock is healthy'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate?.('Products')}
                >
                  Explore →
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
