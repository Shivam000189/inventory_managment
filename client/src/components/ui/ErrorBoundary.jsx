import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="ui-error-boundary"
          role="alert"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            maxWidth: '520px',
            margin: '40px auto',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            boxShadow: 'var(--sr-shadow-sm)',
          }}
        >
          <div style={{ fontSize: '42px', marginBottom: '16px' }} aria-hidden="true">
            ⚠️
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--ink)' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--text-soft)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
            {this.state.error?.message || 'An unexpected error occurred while loading this view.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              className="ui-btn ui-btn-primary"
              onClick={this.handleReload}
            >
              Reload Page
            </button>
            <button
              type="button"
              className="ui-btn ui-btn-outline"
              onClick={this.handleRetry}
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
