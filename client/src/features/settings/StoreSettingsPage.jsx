import { useState } from 'react'
import { businessApi } from '../../api/businessApi.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { Field, Input, Select } from '../../components/ui/FormControls.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Alert } from '../../components/ui/Feedback.jsx'
import './SettingsPage.css'

const DEFAULT_SETTINGS = {
  lowStockLimit: 10,
  allowNegativeStock: false,
  defaultPaymentMethod: 'Cash',
  taxEnabled: true,
  invoicePrefix: 'INV',
  defaultGstRate: 5,
  upiId: '',
  allowPriceOverride: false,
  paymentOffers: [],
}

export default function StoreSettingsPage({ business, onBusinessUpdate }) {
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS, ...(business?.settings || {}) })
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  const updateSetting = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }))

  const offer = settings.paymentOffers?.[0] || {
    code: '',
    label: '',
    paymentMethod: 'UPI',
    discountType: 'percent',
    value: 0,
    minimumAmount: 0,
    maximumDiscount: 0,
    active: true,
  }

  const updateOffer = (key, value) => updateSetting('paymentOffers', [{ ...offer, [key]: value }])

  const save = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setMessage(null)
    try {
      const updated = await businessApi.update({ settings })
      onBusinessUpdate?.(updated)
      setMessage({ type: 'success', text: 'Settings saved for this business.' })
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not save settings.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="settings-page" aria-label="Store Settings">
      <PageHeader
        title="Settings"
        subtitle={`Rules and defaults for ${business?.name || 'this business'}`}
        breadcrumbs={[
          { label: 'Business', href: '#' },
          { label: 'Settings' },
        ]}
      />

      <form className="settings-card" onSubmit={save}>
        <div className="settings-section-header">
          <h3>Inventory & Invoicing Defaults</h3>
        </div>

        <div className="settings-grid">
          <Field label="Low stock limit" id="settings-low-stock">
            <Input
              id="settings-low-stock"
              type="number"
              min="0"
              value={settings.lowStockLimit}
              onChange={(event) => updateSetting('lowStockLimit', Number(event.target.value))}
            />
          </Field>

          <Field label="Default payment method" id="settings-payment">
            <Select
              id="settings-payment"
              value={settings.defaultPaymentMethod}
              onChange={(event) => updateSetting('defaultPaymentMethod', event.target.value)}
            >
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Bank transfer</option>
              <option>Credit</option>
              <option>Other</option>
            </Select>
          </Field>

          <Field label="Invoice prefix" id="settings-invoice">
            <Input
              id="settings-invoice"
              value={settings.invoicePrefix}
              onChange={(event) => updateSetting('invoicePrefix', event.target.value.toUpperCase())}
            />
          </Field>

          <Field label="Default GST rate %" id="settings-gst">
            <Input
              id="settings-gst"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings.defaultGstRate}
              onChange={(event) => updateSetting('defaultGstRate', Number(event.target.value))}
            />
          </Field>

          <Field label="Business UPI ID" id="settings-upi">
            <Input
              id="settings-upi"
              value={settings.upiId}
              onChange={(event) => updateSetting('upiId', event.target.value)}
              placeholder="merchant@bank"
            />
          </Field>

          <label className="settings-toggle-card">
            <input
              type="checkbox"
              checked={settings.allowPriceOverride}
              onChange={(event) => updateSetting('allowPriceOverride', event.target.checked)}
            />
            Allow authorized POS price override
          </label>

          <div className="pos-offer-box">
            <div className="pos-offer-box-header">POS payment offer</div>
            <Input
              value={offer.code}
              onChange={(event) => updateOffer('code', event.target.value.toUpperCase())}
              placeholder="Offer code"
              aria-label="Offer code"
            />
            <Input
              value={offer.label}
              onChange={(event) => updateOffer('label', event.target.value)}
              placeholder="Offer label"
              aria-label="Offer label"
            />
            <Select
              value={offer.paymentMethod}
              onChange={(event) => updateOffer('paymentMethod', event.target.value)}
              aria-label="Payment method"
            >
              <option value="Any">Any payment method</option>
              <option>UPI</option>
              <option>QR</option>
              <option>Debit Card</option>
              <option>Credit Card</option>
              <option>Bank transfer</option>
              <option>Cash</option>
              <option>Gift Card</option>
              <option>Store Credit</option>
            </Select>
            <Select
              value={offer.discountType}
              onChange={(event) => updateOffer('discountType', event.target.value)}
              aria-label="Discount type"
            >
              <option value="percent">Percent</option>
              <option value="fixed">Fixed</option>
            </Select>
            <Input
              type="number"
              min="0"
              value={offer.value}
              onChange={(event) => updateOffer('value', Number(event.target.value))}
              placeholder="Discount value"
              aria-label="Discount value"
            />
            <Input
              type="number"
              min="0"
              value={offer.minimumAmount}
              onChange={(event) => updateOffer('minimumAmount', Number(event.target.value))}
              placeholder="Minimum bill"
              aria-label="Minimum bill"
            />
            <Input
              type="number"
              min="0"
              value={offer.maximumDiscount}
              onChange={(event) => updateOffer('maximumDiscount', Number(event.target.value))}
              placeholder="Max discount"
              aria-label="Max discount"
            />
          </div>

          <label className="settings-toggle-card">
            <input
              type="checkbox"
              checked={settings.taxEnabled}
              onChange={(event) => updateSetting('taxEnabled', event.target.checked)}
            />
            Enable tax fields
          </label>

          <label className="settings-toggle-card">
            <input
              type="checkbox"
              checked={settings.allowNegativeStock}
              onChange={(event) => updateSetting('allowNegativeStock', event.target.checked)}
            />
            Allow negative stock
          </label>
        </div>

        {message && (
          <Alert variant={message.type === 'error' ? 'error' : 'success'}>
            {message.text}
          </Alert>
        )}

        <div className="settings-actions">
          <Button type="submit" variant="primary" loading={saving} disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      </form>
    </section>
  )
}
