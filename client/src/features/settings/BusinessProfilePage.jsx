import { useState } from 'react'
import { businessApi } from '../../api/businessApi.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Field, Input, Select } from '../../components/ui/FormControls.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Alert } from '../../components/ui/Feedback.jsx'
import './SettingsPage.css'

export default function BusinessProfilePage({ business, onBusinessUpdate, onBusinessDeleted }) {
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteName, setDeleteName] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    const data = new FormData(event.currentTarget)
    const payload = {
      name: data.get('name')?.trim() || '',
      industry: data.get('industry') || '',
      businessType: data.get('businessType') || '',
      phone: data.get('phone')?.trim() || '',
      email: data.get('email')?.trim().toLowerCase() || '',
      address: data.get('address')?.trim() || '',
      city: data.get('city')?.trim() || '',
      state: data.get('state')?.trim() || '',
      country: data.get('country') || '',
      currency: data.get('currency') || '',
      gstin: data.get('gstin')?.trim().toUpperCase() || '',
    }
    setSaving(true)
    setMessage(null)
    try {
      const updated = await businessApi.update(payload)
      onBusinessUpdate?.(updated)
      setMessage({ type: 'success', text: 'Business profile saved.' })
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not save the business profile.' })
    } finally {
      setSaving(false)
    }
  }

  const removeBusiness = async () => {
    if (deleteName.trim() !== business?.name) return
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
    <section className="settings-page" aria-label="Business Profile">
      <PageHeader
        title="Business Profile"
        subtitle={`Identity, industry, contact and regional details for ${business?.name || 'this business'}`}
        breadcrumbs={[
          { label: 'Business', href: '#' },
          { label: 'Profile' },
        ]}
        actions={
          business && (
            <Badge variant="neutral">
              {business.currency || 'INR'} · {business.industry || 'general'}
            </Badge>
          )
        }
      />

      <form className="settings-card" onSubmit={handleSubmit}>
        <div className="settings-section-header">
          <h3>Company Information & Regional Details</h3>
        </div>

        <div className="settings-grid">
          <Field label="Business name" id="business-settings-name" required>
            <Input
              id="business-settings-name"
              name="name"
              defaultValue={business?.name || ''}
              required
            />
          </Field>

          <Field label="Industry" id="business-settings-industry" required>
            <Select
              id="business-settings-industry"
              name="industry"
              defaultValue={business?.industry || 'retail'}
              required
            >
              {['grocery', 'clothing', 'electronics', 'hardware', 'pharmacy', 'restaurant', 'automobile', 'manufacturing', 'wholesale', 'retail', 'other'].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </Field>

          <Field label="Business type" id="business-settings-type" required>
            <Select
              id="business-settings-type"
              name="businessType"
              defaultValue={business?.businessType || 'retail'}
              required
            >
              {['retail', 'wholesale', 'manufacturing', 'service', 'other'].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </Field>

          <Field label="Phone" id="business-settings-phone">
            <Input
              id="business-settings-phone"
              name="phone"
              defaultValue={business?.phone || ''}
            />
          </Field>

          <Field label="Email" id="business-settings-email">
            <Input
              id="business-settings-email"
              name="email"
              type="email"
              defaultValue={business?.email || ''}
            />
          </Field>

          <Field label="Country" id="business-settings-country">
            <Input
              id="business-settings-country"
              name="country"
              defaultValue={business?.country || ''}
            />
          </Field>

          <Field label="Currency" id="business-settings-currency">
            <Select
              id="business-settings-currency"
              name="currency"
              defaultValue={business?.currency || 'INR'}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="AUD">AUD</option>
            </Select>
          </Field>

          <Field label="Business GSTIN" id="business-settings-gstin">
            <Input
              id="business-settings-gstin"
              name="gstin"
              defaultValue={business?.gstin || ''}
              placeholder="GST registration number"
            />
          </Field>

          <div className="field-wide">
            <Field label="Address" id="business-settings-address">
              <Input
                id="business-settings-address"
                name="address"
                defaultValue={business?.address || ''}
              />
            </Field>
          </div>

          <Field label="City" id="business-settings-city">
            <Input
              id="business-settings-city"
              name="city"
              defaultValue={business?.city || ''}
            />
          </Field>

          <Field label="State" id="business-settings-state">
            <Input
              id="business-settings-state"
              name="state"
              defaultValue={business?.state || ''}
            />
          </Field>
        </div>

        {message && (
          <Alert variant={message.type === 'error' ? 'error' : 'success'}>
            {message.text}
          </Alert>
        )}

        <div className="settings-actions">
          <Button type="submit" variant="primary" loading={saving} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>

      <div className="settings-danger-card">
        <div className="settings-danger-info">
          <span className="settings-danger-kicker">Danger zone</span>
          <h3>Delete business workspace</h3>
          <p>Permanently removes this business and all of its inventory, orders, payments, reports and team records.</p>
        </div>
        <Button variant="danger" type="button" onClick={() => setDeleteOpen(true)}>
          Delete business
        </Button>
      </div>

      <Modal
        isOpen={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title={`Delete ${business?.name || 'workspace'}?`}
      >
        <div className="delete-dialog-content">
          <p>This action cannot be undone. Type <strong>{business?.name}</strong> to confirm deletion.</p>
          <Field label="Business name" id="delete-business-name">
            <Input
              id="delete-business-name"
              autoFocus
              value={deleteName}
              onChange={(event) => setDeleteName(event.target.value)}
              placeholder={business?.name || ''}
            />
          </Field>
          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <Button variant="outline" type="button" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={removeBusiness}
              loading={deleting}
              disabled={deleting || deleteName.trim() !== business?.name}
            >
              Permanently delete
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
