import React, { useState } from 'react'
import {
  Car,
  Check,
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
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) {
      setError('Please enter your email and password.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const session = await authApi.login({ email: normalizedEmail, password })
      setPassword('')
      onAuthenticated({ user: session.user, business: session.business })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in. Please verify your credentials.')
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
    <main className="auth-modern-stage">
      <div className="auth-modern-card" role="region" aria-label="Sign in card">
        {/* Left Side: 3D Supply Chain & Automated Warehouse Illustration */}
        <div className="auth-card-media" aria-hidden="true">
          <img
            src="/images/auth-supply-chain.png"
            alt="Stockroom Automated Logistics & Supply Chain"
            className="auth-media-img"
            loading="eager"
          />
          <div className="auth-media-blend-overlay" />
        </div>

        {/* Right Side: Authentication Form & Quick Demos */}
        <div className="auth-card-body">
          {/* Header Bar */}
          <div className="auth-body-top-bar">
            <div className="stockroom-brand-mark" aria-label="Stockroom">
              <span className="stockroom-brand-icon">S</span>
              <div className="stockroom-brand-labels">
                <span className="stockroom-brand-title">STOCKROOM</span>
                <span className="stockroom-brand-sub">SUPPLY CHAIN &amp; POS</span>
              </div>
            </div>

            <div className="auth-top-actions">
              <a href="/pricing" className="auth-aux-link">
                Pricing →
              </a>
              {onBackToHome && (
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="auth-aux-btn"
                  title="Return to homepage"
                >
                  Home
                </button>
              )}
            </div>
          </div>

          {/* Heading */}
          <div className="auth-hero-heading">
            <h1 className="auth-title">Sign in</h1>
            <p className="auth-description">
              Welcome to logistics supply chain platform.<br />
              Sign in to manage your inventory and sales.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="auth-error-banner" role="alert">
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={submit} className="auth-input-form" noValidate>
            <div className="auth-input-group">
              <label htmlFor="auth-email">E-mail</label>
              <div className="auth-field-wrapper">
                <Mail className="auth-field-icon" size={17} />
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  autoComplete="username"
                  required
                  maxLength={254}
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="auth-password">Password</label>
              <div className="auth-field-wrapper">
                <LockKeyhole className="auth-field-icon" size={17} />
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Checkbox Row */}
            <div className="auth-options-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="auth-checkbox"
                />
                <span>Remember this terminal session</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              className="auth-primary-submit-btn"
              type="submit"
              disabled={submitting}
            >
              {submitting && !activeDemoId ? (
                <span className="auth-btn-spinner-wrap">
                  <Loader2 className="auth-spin" size={18} />
                  <span>Signing in…</span>
                </span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Compact 1-Click Demo Section */}
          <div className="auth-demo-wrapper" aria-labelledby="demo-heading">
            <div className="auth-demo-header">
              <span className="auth-demo-rule" />
              <span className="auth-demo-badge" id="demo-heading">
                <Sparkles size={12} className="auth-sparkle" /> Quick 1-Click Demo
              </span>
              <span className="auth-demo-rule" />
            </div>

            <div className="auth-demo-pill-grid">
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.icon
                const isLoggingIn = activeDemoId === account.id && submitting
                return (
                  <button
                    key={account.id}
                    type="button"
                    className={`auth-demo-pill ${activeDemoId === account.id ? 'active' : ''}`}
                    onClick={() => handleDemoLogin(account)}
                    disabled={submitting}
                    title={`Instant login as ${account.name} (${account.email})`}
                    style={{ '--demo-accent': account.accent } as React.CSSProperties}
                  >
                    <span className="auth-demo-pill-icon" style={{ color: account.accent }}>
                      {isLoggingIn ? <Loader2 className="auth-spin" size={14} /> : <Icon size={14} />}
                    </span>
                    <span className="auth-demo-pill-label">{account.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer Subtext */}
          <div className="auth-card-footer">
            <span>Accounts are provisioned by your Business Administrator.</span>
          </div>
        </div>
      </div>
    </main>
  )
}
