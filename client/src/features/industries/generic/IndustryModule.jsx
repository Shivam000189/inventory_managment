import { useCallback, useMemo, useState } from 'react'
import { productApi } from '../../../api/productApi.js'
import { useResource } from '../../../hooks/useResource.js'
import { resolveBusinessCapabilities } from '../../../shared/industryConfig.js'
import AsyncBoundary from '../../../components/feedback/AsyncBoundary.jsx'
import { PageHeader } from '../../../components/ui/PageHeader.jsx'
import { Button } from '../../../components/ui/Button.jsx'
import { Badge } from '../../../components/ui/Badge.jsx'
import './IndustryModule.css'

const moduleField = {
  'Batch Management': 'batchNumber',
  'Expiry Tracking': 'expiryDate',
  'Size Management': 'size',
  'Color Management': 'color',
  'Product Variants': 'size',
  'Serial Numbers': 'serialNumber',
  'Warranty Tracking': 'warrantyMonths',
  'Bulk Pricing': 'wholesalePrice',
}

function displayValue(product, section) {
  if (section === 'Product Variants') return [product.size, product.color].filter(Boolean).join(' / ')
  const field = moduleField[section]
  if (!field) return product.category
  if (field === 'expiryDate') return product[field] ? new Date(product[field]).toLocaleDateString() : ''
  if (field === 'warrantyMonths') return product[field] ? `${product[field]} months` : ''
  return product[field]
}

function VarIcon({ name }) {
  const paths = {
    export: (
      <>
        <path d="M12 3v12m-4-4 4 4 4-4" />
        <path d="M5 17v3h14v-3" />
      </>
    ),
    tune: (
      <>
        <path d="M4 8h11M4 8a2 2 0 1 0 4 0 2 2 0 0 0-4 0Zm16 8H9m11 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    refresh: (
      <>
        <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8m0-4v4h-4M20 12a8 8 0 0 1-13.7 5.7L4 16m0 4v-4h4" />
      </>
    ),
    box: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 13 9 5 9-5" />
      </>
    ),
    alert: (
      <>
        <path d="M12 4 2 20h20L12 4Z" />
        <path d="M12 10v5M12 18h.01" />
      </>
    ),
    swatch: (
      <>
        <rect x="4" y="4" width="7" height="7" rx="1" />
        <rect x="13" y="4" width="7" height="7" rx="1" />
        <rect x="4" y="13" width="7" height="7" rx="1" />
        <rect x="13" y="13" width="7" height="7" rx="1" />
      </>
    ),
    edit: <path d="M4 20h4L18 10l-4-4L4 16v4ZM14 6l4 4" />,
    print: (
      <>
        <path d="M7 8V3h10v5M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z" />
      </>
    ),
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

const COLOR_HEX = {
  maroon: '#7f1d3a',
  navy: '#1e3a8a',
  'navy blue': '#1e3a8a',
  beige: '#e8dcc4',
  black: '#1c1c1c',
  white: '#f4f4f4',
  grey: '#8a8f98',
  gray: '#8a8f98',
  olive: '#5b6236',
  'olive green': '#5b6236',
  blue: '#2563eb',
  red: '#dc2626',
  green: '#16a34a',
  pink: '#ec4899',
  mustard: '#d4a017',
  charcoal: '#36393f',
  tan: '#c9a66b',
  cream: '#f5ecd7',
}
const swatch = (color = '') => COLOR_HEX[color.trim().toLowerCase()] || '#8a9bb0'
const PAGE_SIZE = 12

export default function IndustryModule({ section, business, onNavigate }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sizeF, setSizeF] = useState('all')
  const [colorF, setColorF] = useState('all')
  const [page, setPage] = useState(1)
  const [stableNow] = useState(() => Date.now())

  const isProductView = Boolean(moduleField[section])
  const load = useCallback(() => (isProductView ? productApi.list() : Promise.resolve([])), [isProductView])
  const { data: products, loading, error, refetch } = useResource(load, [isProductView], [])

  const currency = business?.currency || 'INR'
  const productLabel = (business?.capabilities || resolveBusinessCapabilities(business || {})).productLabel || 'Products'
  const money = (value, dp = 0) => {
    const amount = Number(value || 0)
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: dp,
        maximumFractionDigits: dp,
      }).format(amount)
    } catch {
      return `${currency} ${amount.toLocaleString('en-IN')}`
    }
  }

  const rows = useMemo(() => products.filter((product) => displayValue(product, section)), [products, section])
  const categories = useMemo(() => [...new Set(rows.map((product) => product.category).filter(Boolean))].sort(), [rows])
  const sizes = useMemo(() => [...new Set(rows.map((product) => product.size).filter(Boolean))].sort(), [rows])
  const colors = useMemo(() => [...new Set(rows.map((product) => product.color).filter(Boolean))].sort(), [rows])

  const stats = useMemo(() => {
    const totalStock = rows.reduce((sum, product) => sum + Number(product.currentStock || 0), 0)
    const low = rows.filter((product) => Number(product.currentStock || 0) <= Number(product.minimumStock || 10)).length
    return { count: rows.length, totalStock, low, sizes: sizes.length, colors: colors.length }
  }, [rows, sizes, colors])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter((product) => {
      if (category !== 'all' && product.category !== category) return false
      if (sizeF !== 'all' && product.size !== sizeF) return false
      if (colorF !== 'all' && product.color !== colorF) return false
      return `${product.name} ${product.sku} ${product.category} ${product.genericName || ''} ${product.batchNumber || ''} ${product.size || ''} ${product.color || ''} ${product.barcode || ''}`
        .toLowerCase()
        .includes(query)
    })
  }, [rows, search, category, sizeF, colorF])

  const withReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const exportCsv = () => {
    const esc = (v) => {
      const t = String(v ?? '')
      return `"${(/^[=+@\-\t\r]/.test(t) ? `'${t}` : t).replaceAll('"', '""')}"`
    }
    const rowsCsv = [
      ['Product', 'Category', section, 'Stock', 'SKU', 'Retail price', 'Wholesale price'],
      ...filtered.map((p) => [
        p.name,
        p.category,
        displayValue(p, section),
        p.currentStock,
        p.sku,
        p.sellingPrice,
        p.wholesalePrice || '',
      ]),
    ]
    const url = URL.createObjectURL(
      new Blob([rowsCsv.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `${section.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (!isProductView) {
    return (
      <section className="var-page" aria-label={section}>
        <PageHeader
          title={section}
          subtitle={`Configured for ${business?.name || 'this business'}`}
          breadcrumbs={[
            { label: business?.industry || 'Industry', href: '#' },
            { label: section },
          ]}
          actions={
            business?.businessType && (
              <Badge variant="neutral">{business.businessType}</Badge>
            )
          }
        />
        <div className="empty-dashboard">
          <span className="empty-dashboard-icon" aria-hidden="true">◫</span>
          <h2>{section}</h2>
          <p>
            This workflow is enabled by the {business?.industry} / {business?.businessType} configuration and protected by
            your role permissions.
          </p>
        </div>
      </section>
    )
  }

  const isVariants = section === 'Product Variants'

  return (
    <section className="var-page" aria-label={section}>
      <PageHeader
        title={section}
        subtitle={
          isVariants
            ? 'Every size × colour SKU with live stock and price'
            : `Live ${section.toLowerCase()} across the ${business?.name || 'store'} catalog`
        }
        breadcrumbs={[
          { label: business?.industry || 'Catalog', href: '#' },
          { label: section },
        ]}
        actions={
          <div className="var-heading-actions">
            <Button
              variant="outline"
              type="button"
              onClick={exportCsv}
              disabled={loading || Boolean(error) || !rows.length}
              icon={<VarIcon name="export" />}
            >
              Export CSV
            </Button>
            {onNavigate && (
              <Button
                variant="primary"
                type="button"
                onClick={() => onNavigate(productLabel)}
                icon={<VarIcon name="plus" />}
              >
                Add {isVariants ? 'variant' : productLabel === 'Medicines' ? 'medicine' : 'product'}
              </Button>
            )}
          </div>
        }
      />

      <div className="var-kpis" aria-busy={loading}>
        <article className="var-kpi">
          <span>
            Total {isVariants ? 'variants' : 'records'}{' '}
            <i className="blue">
              <VarIcon name="swatch" />
            </i>
          </span>
          <strong>{loading || error ? '—' : stats.count.toLocaleString('en-IN')}</strong>
          <p>
            Across {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
          </p>
        </article>

        <article className="var-kpi">
          <span>
            Total stock qty{' '}
            <i className="blue">
              <VarIcon name="box" />
            </i>
          </span>
          <strong>
            {loading || error ? '—' : stats.totalStock.toLocaleString('en-IN')} <small>units</small>
          </strong>
          <p>Summed across every matching SKU</p>
        </article>

        <article className={`var-kpi${stats.low ? ' var-kpi-alert' : ''}`}>
          <span>
            Low stock reorders{' '}
            <i className="amber">
              <VarIcon name="alert" />
            </i>
          </span>
          <strong>
            {loading || error ? '—' : stats.low} <small>{isVariants ? 'variants' : 'items'}</small>
          </strong>
          <p>At or below the reorder threshold</p>
        </article>

        <article className="var-kpi">
          {section === 'Batch Management' ? (
            <>
              <span>
                Distinct batches{' '}
                <i className="purple">
                  <VarIcon name="box" />
                </i>
              </span>
              <strong>{loading || error ? '—' : new Set(rows.map((p) => p.batchNumber).filter(Boolean)).size}</strong>
              <p>Tracked manufacturing lots</p>
            </>
          ) : section === 'Expiry Tracking' ? (
            <>
              <span>
                Expiring soon{' '}
                <i className="purple">
                  <VarIcon name="alert" />
                </i>
              </span>
              <strong>
                {loading || error
                  ? '—'
                  : rows.filter((p) => p.expiryDate && new Date(p.expiryDate) < new Date(stableNow + 60 * 86400000)).length}
              </strong>
              <p>Within next 60 days</p>
            </>
          ) : (
            <>
              <span>
                Active attributes{' '}
                <i className="purple">
                  <VarIcon name="swatch" />
                </i>
              </span>
              <strong>{loading || error ? '—' : `${stats.sizes} S / ${stats.colors} C`}</strong>
              <p>
                {stats.sizes} size grades · {stats.colors} colourways
              </p>
            </>
          )}
        </article>
      </div>

      <div className="var-filters">
        <label className="var-search">
          <VarIcon name="search" />
          <input
            aria-label={`Search ${section}`}
            value={search}
            onChange={(event) => withReset(setSearch)(event.target.value)}
            placeholder={`Search ${section.toLowerCase()}, SKU, or barcode`}
          />
        </label>
        <select
          value={category}
          onChange={(event) => withReset(setCategory)(event.target.value)}
          aria-label="Filter category"
        >
          <option value="all">All categories</option>
          {categories.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        {sizes.length > 0 && (
          <select
            value={sizeF}
            onChange={(event) => withReset(setSizeF)(event.target.value)}
            aria-label="Filter size"
          >
            <option value="all">All sizes</option>
            {sizes.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        )}
        {colors.length > 0 && (
          <select
            value={colorF}
            onChange={(event) => withReset(setColorF)(event.target.value)}
            aria-label="Filter colour"
          >
            <option value="all">All colourways</option>
            {colors.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        )}
        <button type="button" className="var-refresh" onClick={refetch} aria-label="Refresh">
          <VarIcon name="refresh" />
        </button>
      </div>

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={!filtered.length}
        emptyText={
          rows.length
            ? 'No variants match these filters.'
            : `No products with ${section.toLowerCase()} data yet. Add it from ${productLabel}.`
        }
      >
        <div className="var-table-wrap">
          <div className="var-table-scroll" tabIndex={0} role="region" aria-label={section}>
            <table className="var-table">
              <thead>
                {section === 'Expiry Tracking' ? (
                  <tr>
                    <th>Product & Molecule</th>
                    <th>Batch No</th>
                    <th>Expiry Date</th>
                    <th>Days Left / Status</th>
                    <th className="num">Stock</th>
                    <th className="num">Selling / MRP</th>
                    <th className="num">Actions</th>
                  </tr>
                ) : section === 'Batch Management' ? (
                  <tr>
                    <th>Product & Molecule</th>
                    <th>Batch No</th>
                    <th>Mfg Date</th>
                    <th>Expiry Date</th>
                    <th className="num">Stock</th>
                    <th className="num">Selling / MRP</th>
                    <th className="num">Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Category</th>
                    <th>{isVariants ? 'Product variant' : 'Product'}</th>
                    <th className="num">Stock</th>
                    <th>SKU code</th>
                    <th className="num">Price</th>
                    <th className="num">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {pageRows.map((product) => {
                  const stock = Number(product.currentStock ?? product.stock ?? 0)
                  const state = stock === 0 ? 'out' : stock <= Number(product.minimumStock ?? product.reorderLevel ?? 10) ? 'low' : 'in'
                  const attr = displayValue(product, section)

                  if (section === 'Expiry Tracking') {
                    const expDate = product.expiryDate ? new Date(product.expiryDate) : null
                    const daysLeft = expDate ? Math.ceil((expDate.getTime() - stableNow) / (1000 * 60 * 60 * 24)) : null
                    const expStatus =
                      daysLeft === null
                        ? { badge: 'in', label: 'No date' }
                        : daysLeft < 0
                        ? { badge: 'out', label: 'Expired (' + Math.abs(daysLeft) + 'd ago)' }
                        : daysLeft <= 30
                        ? { badge: 'out', label: 'Critical: ' + daysLeft + 'd left' }
                        : daysLeft <= 90
                        ? { badge: 'low', label: 'Exp in ' + daysLeft + 'd' }
                        : { badge: 'in', label: 'Safe shelf-life' }

                    return (
                      <tr key={product.productId || product.id}>
                        <td>
                          <div>
                            <strong className="var-name" style={{ display: 'block', color: 'var(--text)' }}>
                              {product.name}
                            </strong>
                            {product.genericName && (
                              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                                {product.genericName}
                              </span>
                            )}
                            {product.manufacturer && (
                              <span style={{ fontSize: '11px', color: 'var(--text-soft)', marginLeft: '4px' }}>
                                · {product.manufacturer}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="var-sku" style={{ fontFamily: 'monospace' }}>
                            {product.batchNumber || '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                            {expDate ? expDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                          </span>
                        </td>
                        <td>
                          <span className={'var-badge ' + expStatus.badge}>
                            {expStatus.label}
                          </span>
                        </td>
                        <td className="num var-stock">
                          <strong>{stock.toLocaleString('en-IN')}</strong>
                          <span className={'var-badge ' + state}>
                            {state === 'out' ? 'Out' : state === 'low' ? 'Low' : 'In stock'}
                          </span>
                        </td>
                        <td className="num var-price">
                          <strong>{money(product.sellingPrice)}</strong>
                          {product.mrp && Number(product.mrp) > 0 && (
                            <small style={{ display: 'block', color: 'var(--text-soft)', textDecoration: 'line-through' }}>
                              MRP {money(product.mrp)}
                            </small>
                          )}
                        </td>
                        <td className="num">
                          <div className="var-row-actions">
                            <button
                              type="button"
                              aria-label={'Edit ' + product.name}
                              onClick={() => onNavigate?.(productLabel)}
                            >
                              <VarIcon name="edit" />
                            </button>
                            <button
                              type="button"
                              aria-label={'Print label for ' + product.name}
                              onClick={() => window.print()}
                            >
                              <VarIcon name="print" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  if (section === 'Batch Management') {
                    const expDate = product.expiryDate ? new Date(product.expiryDate) : null
                    const mfgDate = product.manufacturingDate ? new Date(product.manufacturingDate) : null

                    return (
                      <tr key={product.productId || product.id}>
                        <td>
                          <div>
                            <strong className="var-name" style={{ display: 'block', color: 'var(--text)' }}>
                              {product.name}
                            </strong>
                            {product.genericName && (
                              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                                {product.genericName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="var-sku" style={{ fontFamily: 'monospace' }}>
                            {product.batchNumber || '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
                            {mfgDate ? mfgDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                            {expDate ? expDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                          </span>
                        </td>
                        <td className="num var-stock">
                          <strong>{stock.toLocaleString('en-IN')}</strong>
                          <span className={'var-badge ' + state}>
                            {state === 'out' ? 'Out' : state === 'low' ? 'Low' : 'In stock'}
                          </span>
                        </td>
                        <td className="num var-price">
                          <strong>{money(product.sellingPrice)}</strong>
                          {product.mrp && Number(product.mrp) > 0 && (
                            <small style={{ display: 'block', color: 'var(--text-soft)', textDecoration: 'line-through' }}>
                              MRP {money(product.mrp)}
                            </small>
                          )}
                        </td>
                        <td className="num">
                          <div className="var-row-actions">
                            <button
                              type="button"
                              aria-label={'Edit ' + product.name}
                              onClick={() => onNavigate?.(productLabel)}
                            >
                              <VarIcon name="edit" />
                            </button>
                            <button
                              type="button"
                              aria-label={'Print label for ' + product.name}
                              onClick={() => window.print()}
                            >
                              <VarIcon name="print" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={product.productId || product.id}>
                      <td className="var-cat">{product.category || 'Uncategorised'}</td>
                      <td>
                        <div className="var-variant">
                          {product.color && (
                            <span className="var-dot" style={{ background: swatch(product.color) }} />
                          )}
                          <span className="var-chip">{attr || product.name}</span>
                        </div>
                      </td>
                      <td className="num var-stock">
                        <strong>{stock.toLocaleString('en-IN')}</strong>
                        <span className={'var-badge ' + state}>
                          {state === 'out' ? 'Out of stock' : state === 'low' ? 'Low stock' : 'In stock'}
                        </span>
                      </td>
                      <td>
                        <span className="var-sku">{product.sku}</span>
                      </td>
                      <td className="num var-price">
                        <strong>{money(product.sellingPrice)}</strong>
                        {product.wholesalePrice ? (
                          <small>{money(product.wholesalePrice)} whsl</small>
                        ) : (
                          <small>retail only</small>
                        )}
                      </td>
                      <td className="num">
                        <div className="var-row-actions">
                          <button
                            type="button"
                            aria-label={'Edit ' + product.name}
                            onClick={() => onNavigate?.(productLabel)}
                          >
                            <VarIcon name="edit" />
                          </button>
                          <button
                            type="button"
                            aria-label={'Print label for ' + product.name}
                            onClick={() => window.print()}
                          >
                            <VarIcon name="print" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <footer className="var-pagination">
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="var-pagination-controls">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .slice(0, 4)
                .map((number) => (
                  <button
                    type="button"
                    key={number}
                    className={number === currentPage ? 'active' : ''}
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </button>
                ))}
              {totalPages > 5 && (
                <>
                  <span className="var-ellipsis">…</span>
                  <button
                    type="button"
                    className={totalPages === currentPage ? 'active' : ''}
                    onClick={() => setPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </footer>
        </div>
      </AsyncBoundary>

      <footer className="var-statusbar">
        <span>Stockroom · catalog attributes</span>
        <span>
          {stats.count} {isVariants ? 'variants' : 'records'} · {stats.totalStock.toLocaleString('en-IN')} units
        </span>
        <span className="var-statusbar-suite">Enterprise Retail OS</span>
      </footer>
    </section>
  )
}
