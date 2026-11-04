import { useState, type FormEvent } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { ApiError } from '../api/client'
import { authApi } from '../api/authApi'
import { useAuth } from '../hooks/useAuth'
import type { UserSession } from '../types'
import './platform.css'

export function PasswordChangePage({ onComplete }: { onComplete: (session: UserSession) => void }) {
  const { account, updateSession, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const session = await authApi.changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      updateSession(session)
      onComplete(session)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        setError('Your sign-in has expired. Sign in again to continue.')
        await logout()
      } else {
        setError(caught instanceof Error ? caught.message : 'Unable to update your password.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="platform-password-stage">
      <section className="platform-dialog" style={{ width: 'min(460px, 100%)' }} aria-labelledby="password-change-title">
        <div className="platform-brand-mark" aria-hidden="true"><LockKeyhole size={20} /></div>
        <h1 id="password-change-title" style={{ marginTop: 16 }}>Choose a new password</h1>
        <p className="platform-dialog-copy">
          {account?.name ? `Welcome, ${account.name}. ` : ''}
          Change your temporary password to continue to Stockroom.
        </p>
        <form onSubmit={submit}>
          <label className="platform-field">
            Temporary password
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label className="platform-field" style={{ marginTop: 14 }}>
            New password
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              maxLength={72}
              required
            />
          </label>
          <label className="platform-field" style={{ marginTop: 14 }}>
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              maxLength={72}
              required
            />
          </label>
          <p className="platform-dialog-copy" style={{ margin: '10px 0 0' }}>
            Use at least 8 characters. Avoid common or predictable passwords.
          </p>
          {error && <p className="platform-table-error" role="alert">{error}</p>}
          <div className="platform-dialog-actions">
            <button
              className="platform-button"
              type="button"
              disabled={submitting}
              onClick={() => void logout()}
            >
              Sign out
            </button>
            <button className="platform-button platform-button-primary" type="submit" disabled={submitting}>
              <ShieldCheck size={16} aria-hidden="true" />
              {submitting ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
