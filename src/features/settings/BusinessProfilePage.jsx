import { useEffect, useState } from 'react'
import { businessApi } from '../../api/businessApi.js'
import '../../styles/business-settings.css'

export default function BusinessProfilePage({ business, onBusinessUpdate, onBusinessDeleted }) {
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteName, setDeleteName] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!deleteOpen) return undefined
    const close = (event) => event.key === 'Escape' && !deleting && setDeleteOpen(false)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [deleteOpen, deleting])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    const data = new FormData(event.currentTarget)
    const payload = {
      name: data.get('name').trim(),
      industry: data.get('industry'),
      businessType: data.get('businessType'),
      phone: data.get('phone').trim(),
      email: data.get('email').trim().toLowerCase(),
      address: data.get('address').trim(),
      city: data.get('city').trim(),
      state: data.get('state').trim(),
      country: data.get('country'),
      currency: data.get('currency'),
      gstin: data.get('gstin').trim().toUpperCase(),
    }
    setSaving(true)
    try {
      const updated = await businessApi.update(payload)
      onBusinessUpdate(updated)
      setMessage({ type: 'success', text: 'Business profile saved.' })
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not save the business profile.' })
    } finally {
      setSaving(false)
    }
  }

  const removeBusiness = async () => {
    if (deleteName.trim() !== business.name) return
    setDeleting(true)
    try {
      await businessApi.remove()
      onBusinessDeleted?.()
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not delete the business workspace.' })
      setDeleteOpen(false)
      setDeleting(false)
    }
  }

  return (
    <section className="settings-page">
      <div className="products-toolbar">
        <div>
          <p className="dashboard-kicker">Business / Profile</p>
          <h2>Business Profile</h2>
          <p className="products-count">Identity, industry, contact and regional details for {business.name}</p>
        </div>
        <span className="business-filter">{business.currency} · {business.industry}</span>
      </div>

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="product-form-heading">
          <div>
            <p className="dashboard-kicker">Company information</p>
            <h3>Business details</h3>
          </div>
        </div>

        <div className="settings-grid">
          <div>
            <label htmlFor="business-settings-name">Business name *</label>
            <input id="business-settings-name" name="name" defaultValue={business.name} required />
          </div>
          <div>
            <label htmlFor="business-settings-industry">Industry *</label>
            <select id="business-settings-industry" name="industry" defaultValue={business.industry} required>
              {['grocery', 'clothing', 'electronics', 'hardware', 'pharmacy', 'restaurant', 'automobile', 'manufacturing', 'wholesale', 'retail', 'other'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="business-settings-type">Business type *</label>
            <select id="business-settings-type" name="businessType" defaultValue={business.businessType} required>
              {['retail', 'wholesale', 'manufacturing', 'service', 'other'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="business-settings-phone">Phone</label>
            <input id="business-settings-phone" name="phone" defaultValue={business.phone} />
          </div>
          <div>
            <label htmlFor="business-settings-email">Email</label>
            <input id="business-settings-email" name="email" type="email" defaultValue={business.email} />
          </div>
          <div>
            <label htmlFor="business-settings-country">Country</label>
            <input id="business-settings-country" name="country" defaultValue={business.country} />
          </div>
          <div>
            <label htmlFor="business-settings-currency">Currency</label>
            <select id="business-settings-currency" name="currency" defaultValue={business.currency}>
              <option>INR</option>
              <option>USD</option>
              <option>GBP</option>
              <option>AUD</option>
            </select>
          </div>
          <div>
            <label htmlFor="business-settings-gstin">Business GSTIN</label>
            <input id="business-settings-gstin" name="gstin" defaultValue={business.gstin || ''} placeholder="GST registration number" />
          </div>
          <div className="field-wide">
            <label htmlFor="business-settings-address">Address</label>
            <input id="business-settings-address" name="address" defaultValue={business.address} />
          </div>
          <div>
            <label htmlFor="business-settings-city">City</label>
            <input id="business-settings-city" name="city" defaultValue={business.city} />
          </div>
          <div>
            <label htmlFor="business-settings-state">State</label>
            <input id="business-settings-state" name="state" defaultValue={business.state} />
          </div>
        </div>

        <button className="submit-button settings-save-button" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'} <span>→</span>
        </button>
        {message && <p className={`form-status ${message.type}`}>{message.text}</p>}
      </form>

      <div className="danger-zone">
        <div>
          <p className="dashboard-kicker">Danger zone</p>
          <h3>Delete business workspace</h3>
          <p>Permanently removes this business and all of its inventory, orders, payments, reports and team records.</p>
        </div>
        <button type="button" className="danger-button" onClick={() => setDeleteOpen(true)}>
          Delete business
        </button>
      </div>

      {deleteOpen && (
        <div
          className="supplier-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setDeleteOpen(false)}
        >
          <div className="supplier-modal delete-business-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-business-title">
            <h3 id="delete-business-title">Delete {business.name}?</h3>
            <p>This cannot be undone. Type <strong>{business.name}</strong> to confirm.</p>
            <label htmlFor="delete-business-name">Business name</label>
            <input
              id="delete-business-name"
              autoFocus
              value={deleteName}
              onChange={(event) => setDeleteName(event.target.value)}
            />
            <div className="product-form-actions">
              <button type="button" className="outline-button" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={removeBusiness}
                disabled={deleting || deleteName.trim() !== business.name}
              >
                {deleting ? 'Deleting…' : 'Permanently delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
