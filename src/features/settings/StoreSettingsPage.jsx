import { useState } from 'react'
import { businessApi } from '../../api/businessApi.js'
import '../../styles/business-settings.css'

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

  const updateSetting = (key, value) => setSettings({ ...settings, [key]: value })
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
    <section className="settings-page">
      <div className="products-toolbar">
        <div>
          <p className="dashboard-kicker">Business / Settings</p>
          <h2>Settings</h2>
          <p className="products-count">Rules and defaults for {business?.name}</p>
        </div>
      </div>

      <form className="settings-form compact-settings" onSubmit={save}>
        <div className="settings-grid">
          <div>
            <label htmlFor="settings-low-stock">Low stock limit</label>
            <input
              id="settings-low-stock"
              type="number"
              min="0"
              value={settings.lowStockLimit}
              onChange={(event) => updateSetting('lowStockLimit', Number(event.target.value))}
            />
          </div>

          <div>
            <label htmlFor="settings-payment">Default payment method</label>
            <select
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
            </select>
          </div>

          <div>
            <label htmlFor="settings-invoice">Invoice prefix</label>
            <input
              id="settings-invoice"
              value={settings.invoicePrefix}
              onChange={(event) => updateSetting('invoicePrefix', event.target.value.toUpperCase())}
            />
          </div>

          <div>
            <label htmlFor="settings-gst">Default GST rate %</label>
            <input
              id="settings-gst"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={settings.defaultGstRate}
              onChange={(event) => updateSetting('defaultGstRate', Number(event.target.value))}
            />
          </div>

          <div>
            <label htmlFor="settings-upi">Business UPI ID</label>
            <input
              id="settings-upi"
              value={settings.upiId}
              onChange={(event) => updateSetting('upiId', event.target.value)}
              placeholder="merchant@bank"
            />
          </div>

          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={settings.allowPriceOverride}
              onChange={(event) => updateSetting('allowPriceOverride', event.target.checked)}
            />
            Allow authorized POS price override
          </label>

          <div className="field-wide pos-offer-settings">
            <strong>POS payment offer</strong>
            <input
              value={offer.code}
              onChange={(event) => updateOffer('code', event.target.value.toUpperCase())}
              placeholder="Offer code"
            />
            <input
              value={offer.label}
              onChange={(event) => updateOffer('label', event.target.value)}
              placeholder="Offer label"
            />
            <select
              value={offer.paymentMethod}
              onChange={(event) => updateOffer('paymentMethod', event.target.value)}
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
            </select>
            <select
              value={offer.discountType}
              onChange={(event) => updateOffer('discountType', event.target.value)}
            >
              <option value="percent">Percent</option>
              <option value="fixed">Fixed</option>
            </select>
            <input
              type="number"
              min="0"
              value={offer.value}
              onChange={(event) => updateOffer('value', Number(event.target.value))}
              placeholder="Discount value"
            />
            <input
              type="number"
              min="0"
              value={offer.minimumAmount}
              onChange={(event) => updateOffer('minimumAmount', Number(event.target.value))}
              placeholder="Minimum bill"
            />
            <input
              type="number"
              min="0"
              value={offer.maximumDiscount}
              onChange={(event) => updateOffer('maximumDiscount', Number(event.target.value))}
              placeholder="Max discount"
            />
          </div>

          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={settings.taxEnabled}
              onChange={(event) => updateSetting('taxEnabled', event.target.checked)}
            />
            Enable tax fields
          </label>

          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={settings.allowNegativeStock}
              onChange={(event) => updateSetting('allowNegativeStock', event.target.checked)}
            />
            Allow negative stock
          </label>
        </div>

        <button className="submit-button settings-save-button" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'} <span>→</span>
        </button>
        {message && <p className={`form-status ${message.type}`} role="status">{message.text}</p>}
      </form>
    </section>
  )
}
