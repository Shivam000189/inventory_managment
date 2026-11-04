import { useCallback, useEffect, useState } from 'react'
import { Building2, RefreshCw, Store, Users } from 'lucide-react'
import { platformApi, type PlatformOverview } from './platformApi'
import { PageHeading } from './components'

function assertOverview(value: PlatformOverview): PlatformOverview {
  const counts = [
    value?.businesses?.total,
    value?.businesses?.active,
    value?.businesses?.suspended,
    value?.businesses?.deactivated,
    value?.businesses?.createdThisMonth,
    value?.businessAdmins?.total,
    value?.businessAdmins?.active,
    value?.businessAdmins?.inactive,
    value?.salespeople?.total,
    value?.salespeople?.active,
    value?.salespeople?.pending,
    value?.salespeople?.inactive,
  ]
  if (!counts.every((count) => Number.isInteger(count) && count >= 0)) {
    throw new Error('The server returned invalid dashboard metrics. Refresh the page or contact support.')
  }
  return value
}

export function PlatformDashboardPage() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setOverview(assertOverview(await platformApi.overview()))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load platform metrics.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  useEffect(() => {
    window.addEventListener('stockroom:data-changed', loadOverview)
    return () => window.removeEventListener('stockroom:data-changed', loadOverview)
  }, [loadOverview])

  const cards = overview
    ? [
        {
          title: 'Businesses',
          value: overview.businesses.total,
          icon: <Building2 size={18} aria-hidden="true" />,
          detail: `${overview.businesses.active} active · ${overview.businesses.suspended} suspended · ${overview.businesses.deactivated} deactivated`,
        },
        {
          title: 'Business Admins',
          value: overview.businessAdmins.total,
          icon: <Users size={18} aria-hidden="true" />,
          detail: `${overview.businessAdmins.active} active · ${overview.businessAdmins.inactive} inactive`,
        },
        {
          title: 'Salespeople',
          value: overview.salespeople.total,
          icon: <Store size={18} aria-hidden="true" />,
          detail: `${overview.salespeople.active} active · ${overview.salespeople.pending} pending · ${overview.salespeople.inactive} inactive`,
        },
      ]
    : []

  return (
    <>
      <PageHeading
        title="Platform dashboard"
        description="A current overview of businesses and accounts on Stockroom."
        action={
          <button className="platform-button" type="button" onClick={() => void loadOverview()} disabled={loading}>
            <RefreshCw size={15} aria-hidden="true" /> Refresh
          </button>
        }
      />
      {error && <div className="platform-table-error" role="alert">{error}</div>}
      <section className="platform-card-grid" aria-label="Platform metrics" aria-busy={loading}>
        {loading && !overview
          ? ['Businesses', 'Business Admins', 'Salespeople'].map((title) => (
              <div className="platform-card" key={title} role="status">
                <span className="platform-card-label">{title}</span>
                <span className="platform-card-value">—</span>
                <span className="platform-card-detail">Loading metrics…</span>
              </div>
            ))
          : cards.map((card) => (
              <article className="platform-card" key={card.title}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#667085' }}>
                  <span className="platform-card-label">{card.title}</span>
                  {card.icon}
                </div>
                <strong className="platform-card-value">{card.value.toLocaleString()}</strong>
                <span className="platform-card-detail">{card.detail}</span>
                {card.title === 'Businesses' && (
                  <span className="platform-card-detail" style={{ display: 'block' }}>
                    {overview?.businesses.createdThisMonth.toLocaleString()} created this month
                  </span>
                )}
              </article>
            ))}
      </section>
      {!loading && overview && overview.businesses.total === 0 &&
        overview.businessAdmins.total === 0 && overview.salespeople.total === 0 && (
          <section className="platform-panel platform-state" aria-label="Empty platform">
            No businesses or user accounts have been provisioned yet.
          </section>
        )}
    </>
  )
}
