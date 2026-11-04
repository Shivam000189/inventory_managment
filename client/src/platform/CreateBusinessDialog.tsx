import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { platformApi, type CreateBusinessInput, type CreatedBusinessCredentials } from './platformApi'
import { InlineError } from './components'

const INDUSTRIES = [
  'grocery', 'pharmacy', 'electronics', 'clothing', 'hardware',
  'automotive', 'other',
]
const BUSINESS_TYPES = ['retail', 'wholesale', 'retailwholesale', 'manufacturing', 'service', 'other']

const EMPTY_FORM: CreateBusinessInput = {
  name: '',
  industry: '',
  businessType: '',
  country: '',
  currency: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  gstin: '',
  adminName: '',
  adminEmail: '',
}

export function CreateBusinessDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (credentials: CreatedBusinessCredentials) => void
}) {
  const [form, setForm] = useState<CreateBusinessInput>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const update = (key: keyof CreateBusinessInput, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setError('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const result = await platformApi.createBusiness(form)
      if (
        !result ||
        typeof result.temporaryPassword !== 'string' ||
        !result.temporaryPassword ||
        !result.business ||
        typeof result.business.id !== 'string' ||
        typeof result.business.name !== 'string' ||
        !result.businessAdmin ||
        typeof result.businessAdmin.id !== 'string' ||
        typeof result.businessAdmin.name !== 'string' ||
        typeof result.businessAdmin.email !== 'string'
      ) {
        throw new Error('The server returned an invalid business-creation response. Contact support before signing in.')
      }
      onCreated(result)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create the business.')
    } finally {
      setSubmitting(false)
    }
  }

  const textField = (
    label: string,
    key: keyof CreateBusinessInput,
    required = false,
    type = 'text',
    maxLength?: number,
  ) => (
    <label className="platform-field" key={key}>
      {label}
      <input
        type={type}
        value={form[key] || ''}
        onChange={(event) => update(key, event.target.value)}
        required={required}
        maxLength={maxLength}
      />
    </label>
  )

  return (
    <div className="platform-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !submitting) onClose()
    }}>
      <section
        className="platform-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-business-title"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !submitting) onClose()
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 id="create-business-title">Create a business</h2>
            <p className="platform-dialog-copy">
              Provision the business and its first Business Admin. The temporary password is shown once.
            </p>
          </div>
          <button className="platform-button" type="button" onClick={onClose} disabled={submitting} aria-label="Close dialog">
            <X size={17} aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="platform-dialog-grid">
            {textField('Business name', 'name', true, 'text', 160)}
            <label className="platform-field">
              Industry
              <select value={form.industry} onChange={(event) => update('industry', event.target.value)} required>
                <option value="">Select industry</option>
                {INDUSTRIES.map((industry) => <option value={industry} key={industry}>{industry.replaceAll('_', ' ')}</option>)}
              </select>
            </label>
            <label className="platform-field">
              Business type
              <select value={form.businessType} onChange={(event) => update('businessType', event.target.value)} required>
                <option value="">Select business type</option>
                {BUSINESS_TYPES.map((type) => <option value={type} key={type}>{type.replaceAll('_', ' ')}</option>)}
              </select>
            </label>
            {textField('Country', 'country', true, 'text', 100)}
            {textField('Currency (3-letter code)', 'currency', true, 'text', 3)}
            {textField('Business email', 'email', false, 'email', 254)}
            {textField('Phone', 'phone', false, 'tel', 40)}
            {textField('Address', 'address', false, 'text', 240)}
            {textField('City', 'city', false, 'text', 100)}
            {textField('State / region', 'state', false, 'text', 100)}
            {textField('GSTIN', 'gstin', false, 'text', 40)}
            {textField('Business Admin name', 'adminName', true, 'text', 120)}
            {textField('Business Admin email', 'adminEmail', true, 'email', 254)}
          </div>
          {error && <InlineError message={error} />}
          <div className="platform-dialog-actions">
            <button className="platform-button" type="button" onClick={onClose} disabled={submitting}>Cancel</button>
            <button className="platform-button platform-button-primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create business'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
