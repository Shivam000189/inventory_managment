import React, { useState } from 'react'
import {
  Car,
  Cpu,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Pill,
  Shirt,
  ShoppingCart,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { authApi } from '../../api/authApi'
import './AuthPage.css'

export interface AuthPageProps {
  onAuthenticated: (session: any) => void
  onBackToHome?: () => void
}

interface DemoAccount {
  id: string
  name: string
  email: string
  password: string
  accent: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'clothing',
    name: 'Clothing',
    email: 'rohit@gmail.com',
    password: 'Password#123',
    accent: '#8C6D4F',
    icon: Shirt,
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy',
    email: 'pharmacy@gmail.com',
    password: 'Password#123',
    accent: '#059669',
    icon: Pill,
  },
  {
    id: 'electronics',
    name: 'Electronics',
    email: 'electronics@gmail.com',
    password: 'Password#123',
    accent: '#2563EB',
    icon: Cpu,
  },
  {
    id: 'hardware',
    name: 'Hardware',
    email: 'hardware@gmail.com',
    password: 'Password#123',
    accent: '#D97706',
    icon: Wrench,
  },
  {
    id: 'automobile',
    name: 'Automobile',
    email: 'automobile@gmail.com',
    password: 'Password#123',
    accent: '#DC2626',
    icon: Car,
  },
  {
    id: 'grocery',
    name: 'Grocery',
    email: 'grocery@gmail.com',
    password: 'Password#123',
    accent: '#10B981',
    icon: ShoppingCart,
  },
]

export default function AuthPage({ onAuthenticated, onBackToHome }: AuthPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) {
      setError('Enter your email and password.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const session = await authApi.login({ email: normalizedEmail, password })
      setPassword('')
      onAuthenticated({ user: session.user, business: session.business })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDemoLogin = async (account: DemoAccount) => {
    if (submitting) return
    setEmail(account.email)
    setPassword(account.password)
    setError('')
    setSubmitting(true)
    setActiveDemoId(account.id)
    try {
      const session = await authApi.login({ email: account.email, password: account.password })
      setPassword('')
      onAuthenticated({ user: session.user, business: session.business })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Unable to sign in as ${account.name}.`)
    } finally {
      setSubmitting(false)
      setActiveDemoId(null)
    }
  }

  return (
    <main className="auth-single-stage">
      <div className="auth-single-card">
        {/* Top Header Row with Brand & Return Link */}
        <div className="auth-single-header">
          <div className="aflix-brand-header" aria-label="Stockroom">
            <span className="aflix-brand-mark" aria-hidden="true">S</span>
            <span className="aflix-brand-text">
              <span className="aflix-name">STOCKROOM</span>
              <span className="aflix-sub">INVENTORY MANAGEMENT</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a href="/pricing" className="auth-single-back-link">
              Plans &amp; Pricing →
            </a>
            {onBackToHome && (
              <button type="button" onClick={onBackToHome} className="auth-single-back-link">
                ← Back to Home
              </button>
            )}
          </div>
        </div>

        {/* Welcome Heading */}
        <div className="auth-card-header">
          <h1 className="auth-title" id="auth-title">Welcome</h1>
          <p className="auth-subtitle">Sign in to your account or choose a demo below.</p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={submit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <div className="auth-input-wrap with-leading-icon">
              <span className="auth-input-leading-icon email-icon" aria-hidden="true">
                <Mail />
              </span>
              <input
                id="auth-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setError('')
                }}
                autoComplete="username"
                required
                maxLength={254}
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <div className="auth-input-wrap with-leading-icon has-toggle">
              <span className="auth-input-leading-icon lock-icon" aria-hidden="true">
                <LockKeyhole />
              </span>
              <input
                id="auth-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError('')
                }}
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
              />
              <button
                type="button"
                className="auth-eye-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          {error && <p className="form-status error" role="alert">{error}</p>}

          <div className="auth-action-row">
            <button className="auth-submit-btn" type="submit" disabled={submitting}>
              {submitting && !activeDemoId ? 'Signing in…' : 'LOG IN'}
            </button>
          </div>
        </form>

        {/* Quick Demo Logins Section */}
        <div className="auth-demo-section" aria-labelledby="demo-logins-heading">
          <div className="auth-demo-divider">
            <span className="auth-demo-divider-line" />
            <span className="auth-demo-divider-text" id="demo-logins-heading">
              <Sparkles className="auth-demo-sparkle" /> Quick Demo Login (1-Click)
            </span>
            <span className="auth-demo-divider-line" />
          </div>

          <p className="auth-demo-hint">
            Click any industry to log in instantly:
          </p>

          <div className="auth-demo-grid">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon
              const isLoggingIn = activeDemoId === account.id && submitting
              return (
                <button
                  key={account.id}
                  type="button"
                  className={`auth-demo-card ${activeDemoId === account.id ? 'active' : ''}`}
                  onClick={() => handleDemoLogin(account)}
                  disabled={submitting}
                  style={{ '--account-accent': account.accent } as React.CSSProperties}
                  title={`Click to log in as ${account.name} (${account.email})`}
                >
                  <span className="auth-demo-card-icon" style={{ color: account.accent }}>
                    {isLoggingIn ? <Loader2 className="auth-spinner" /> : <Icon />}
                  </span>
                  <div className="auth-demo-card-info">
                    <span className="auth-demo-card-title">{account.name}</span>
                    <span className="auth-demo-card-email">{account.email}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer Note */}
        <p className="auth-switch-line">
          Accounts are provisioned by your Super Admin or Business Admin.
        </p>
      </div>
    </main>
  )
}
