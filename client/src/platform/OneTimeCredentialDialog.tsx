import { useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import type { CreatedBusinessCredentials } from './platformApi'

export function OneTimeCredentialDialog({
  credentials,
  onClose,
}: {
  credentials: CreatedBusinessCredentials
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')

  const copyPassword = async () => {
    setCopyError('')
    try {
      await navigator.clipboard.writeText(credentials.temporaryPassword)
      setCopied(true)
    } catch {
      setCopied(false)
      setCopyError('Clipboard access failed. Select and copy the password manually.')
    }
  }

  return (
    <div className="platform-dialog-backdrop">
      <section className="platform-dialog" role="dialog" aria-modal="true" aria-labelledby="one-time-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <h2 id="one-time-title">Business Admin created</h2>
          <button className="platform-button" type="button" onClick={onClose} aria-label="Dismiss credentials">
            <X size={17} aria-hidden="true" />
          </button>
        </div>
        <p className="platform-dialog-copy">
          Share these credentials securely with {credentials.businessAdmin.name}. The temporary password will not be available again, and must be changed at first sign-in.
        </p>
        <div className="platform-field">
          Business
          <strong>{credentials.business.name}</strong>
        </div>
        <div className="platform-field" style={{ marginTop: 14 }}>
          Business Admin
          <strong>{credentials.businessAdmin.name} · {credentials.businessAdmin.email}</strong>
        </div>
        <div className="platform-field" style={{ marginTop: 14 }}>
          Temporary password
          <div className="platform-one-time-password">
            <code>{credentials.temporaryPassword}</code>
            <button className="platform-button" type="button" onClick={() => void copyPassword()} aria-label="Copy temporary password">
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            </button>
          </div>
        </div>
        {copied && <p className="platform-card-detail" role="status">Temporary password copied.</p>}
        {copyError && <p className="platform-table-error" role="alert">{copyError}</p>}
        <div className="platform-dialog-actions">
          <button className="platform-button platform-button-primary" type="button" onClick={onClose}>
            Done and dismiss
          </button>
        </div>
      </section>
    </div>
  )
}
