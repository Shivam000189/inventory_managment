import { useCallback, useEffect, useState } from 'react'
import { colorApi } from '../../../api/colorApi.js'
import { useResource } from '../../../hooks/useResource.js'
import AsyncBoundary from '../../../components/feedback/AsyncBoundary.jsx'
import { PageHeader } from '../../../components/ui/PageHeader.jsx'
import { Button } from '../../../components/ui/Button.jsx'
import { Badge } from '../../../components/ui/Badge.jsx'
import { Modal } from '../../../components/ui/Modal.jsx'
import { Field, Input, Select } from '../../../components/ui/FormControls.jsx'
import { Alert } from '../../../components/ui/Feedback.jsx'
import './ColorManagementPage.css'

export default function ColorManagement({ business, account }) {
  const [search, setSearch] = useState('')
  const loadColors = useCallback(() => colorApi.list({ search }), [search])
  const { data: colors, loading, error, refetch } = useResource(loadColors, [search], [])
  const [editing, setEditing] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const canManage = account?.role === 'owner' || account?.permissions?.includes('edit_product')

  useEffect(() => {
    if (!selectedColor) return undefined
    document.body.classList.add('color-modal-open')
    const close = (event) => {
      if (event.key === 'Escape') setSelectedColor(null)
    }
    window.addEventListener('keydown', close)
    return () => {
      document.body.classList.remove('color-modal-open')
      window.removeEventListener('keydown', close)
    }
  }, [selectedColor])

  const openForm = (color = null) => {
    setEditing(color)
    setFormOpen(true)
    setMessage(null)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const data = new FormData(event.currentTarget)
    const payload = {
      name: data.get('name').trim(),
      hexCode: data.get('hexCode').trim(),
      status: data.get('status'),
    }
    setSaving(true)
    setMessage(null)
    try {
      if (editing) {
        await colorApi.update(editing.colorId, payload)
      } else {
        await colorApi.create(payload)
      }
      await refetch()
      setFormOpen(false)
      setEditing(null)
      setMessage({ type: 'success', text: editing ? 'Color updated.' : 'Color added.' })
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not save the color.' })
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (color) => {
    setMessage(null)
    try {
      await colorApi.update(color.colorId, { status: color.status === 'active' ? 'inactive' : 'active' })
      await refetch()
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not update the color.' })
    }
  }

  return (
    <section className="color-page" aria-label="Color Management">
      <PageHeader
        title="Color Management"
        subtitle={`Reusable colors and live color-wise stock for ${business?.name || 'this business'}`}
        breadcrumbs={[
          { label: 'Clothing', href: '#' },
          { label: 'Color Management' },
        ]}
        actions={
          canManage && (
            <Button variant="primary" type="button" onClick={() => openForm()}>
              Add color +
            </Button>
          )
        }
      />

      <div className="color-controls">
        <div className="color-search-box">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            aria-label="Search colors and products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by color, product name or SKU..."
          />
        </div>
        <Badge variant="neutral">{colors.length} colors</Badge>
      </div>

      {formOpen && (
        <form className="color-form-card" onSubmit={submit}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700 }}>
              {editing ? 'Edit Color' : 'Add New Color'}
            </h3>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-soft)' }}
              aria-label="Close form"
            >
              ×
            </button>
          </div>

          <div className="color-form-grid">
            <Field label="Color name" id="color-name" required>
              <Input
                id="color-name"
                name="name"
                defaultValue={editing?.name || ''}
                placeholder="e.g. Navy Blue"
                required
              />
            </Field>

            <Field label="Hex code" id="color-code">
              <Input
                id="color-code"
                name="hexCode"
                defaultValue={editing?.hexCode || ''}
                placeholder="#000080"
                pattern="^#?[0-9a-fA-F]{6}$"
              />
            </Field>

            <Field label="Status" id="color-status">
              <Select id="color-status" name="status" defaultValue={editing?.status || 'active'}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
          </div>

          <div className="color-form-actions">
            <Button variant="outline" type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving} disabled={saving}>
              {saving ? 'Saving…' : 'Save color'}
            </Button>
          </div>
        </form>
      )}

      {message && (
        <Alert variant={message.type === 'error' ? 'error' : 'success'}>
          {message.text}
        </Alert>
      )}

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={!colors.length}
        emptyText={search ? 'No colors found.' : 'No colors found. Add your first reusable color.'}
      >
        <div className="color-table-card">
          <div className="color-table-scroll" tabIndex={0} role="region" aria-label="Colors list">
            <table className="color-table">
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Status</th>
                  <th>Stock</th>
                  <th>Products</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {colors.map((color, index) => (
                  <tr key={color.colorId || color.id || `color-${index}`}>
                    <td>
                      <div className="color-name-cell">
                        <i
                          className="color-swatch-circle"
                          style={{ background: color.hexCode || '#d8ded9' }}
                          aria-hidden="true"
                        />
                        <div className="color-name-meta">
                          <strong>{color.name}</strong>
                          <small>{color.hexCode || 'No hex code'}</small>
                          {color.matchedProducts?.map((product) => (
                            <small className="color-match-tag" key={product.productId}>
                              Matched: {product.name} — {product.currentStock} units
                            </small>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={color.status === 'active' ? 'success' : 'neutral'}>
                        {color.status}
                      </Badge>
                    </td>
                    <td>
                      <strong>{Number(color.stockUnits || 0).toLocaleString()} units</strong>
                    </td>
                    <td>
                      <button
                        className="color-products-btn"
                        type="button"
                        onClick={() => setSelectedColor(color)}
                      >
                        {color.productCount} {color.productCount === 1 ? 'Product' : 'Products'}
                      </button>
                    </td>
                    {canManage && (
                      <td>
                        <div className="color-actions">
                          <Button variant="ghost" size="sm" type="button" onClick={() => openForm(color)}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" type="button" onClick={() => toggle(color)}>
                            {color.status === 'active' ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AsyncBoundary>

      <Modal
        isOpen={Boolean(selectedColor)}
        onClose={() => setSelectedColor(null)}
        title={selectedColor ? `${selectedColor.name} Products` : ''}
      >
        {selectedColor && (
          <div>
            <p style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-soft)' }}>
              Color-wise inventory breakdown
            </p>
            {selectedColor.products?.length ? (
              <div className="color-modal-product-list">
                {selectedColor.products.map((product) => (
                  <div className="color-modal-product-item" key={product.productId}>
                    <div className="color-modal-product-info">
                      <strong>{product.name}</strong>
                      <small>SKU: {product.sku}</small>
                      <small>
                        Category: {product.category}
                        {product.size ? ` · Size: ${product.size}` : ''}
                      </small>
                    </div>
                    <b>{Number(product.currentStock || 0).toLocaleString()} units</b>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 'var(--space-4) 0', color: 'var(--text-soft)' }}>
                No products currently use this color.
              </p>
            )}
            <div className="color-modal-footer">
              <span>
                {selectedColor.productCount} {selectedColor.productCount === 1 ? 'Product' : 'Products'}
              </span>
              <span>{Number(selectedColor.stockUnits || 0).toLocaleString()} units total</span>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}
