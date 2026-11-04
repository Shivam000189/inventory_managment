import { useCallback, useEffect, useState } from 'react'
import { Plus, RefreshCw, Search } from 'lucide-react'
import { platformApi, type BusinessStatus, type PlatformBusiness, type PlatformPage } from './platformApi'
import { PageHeading, Pagination, StatusBadge, TableState } from './components'
import { assertPlatformPage, displayIndustry, formatDate } from './platformUtils'
import { CreateBusinessDialog } from './CreateBusinessDialog'
import { OneTimeCredentialDialog } from './OneTimeCredentialDialog'
import type { CreatedBusinessCredentials } from './platformApi'

const INDUSTRIES = [
  'grocery', 'pharmacy', 'electronics', 'clothing', 'hardware',
  'automotive', 'other',
]
const STATUSES: BusinessStatus[] = ['active', 'suspended', 'deactivated']
const PAGE_SIZE = 20

export function PlatformBusinessesPage() {
  const [businesses, setBusinesses] = useState<PlatformPage<PlatformBusiness> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [industry, setIndustry] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [page, setPage] = useState(1)
  const [pendingStatus, setPendingStatus] = useState<Record<string, BusinessStatus>>({})
  const [savingId, setSavingId] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [credentials, setCredentials] = useState<CreatedBusinessCredentials | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadBusinesses = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await platformApi.businesses({
        page,
        limit: PAGE_SIZE,
        q: query,
        status,
        industry,
        createdFrom,
        createdTo,
      })
      setBusinesses(assertPlatformPage(result))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load businesses.')
    } finally {
      setLoading(false)
    }
  }, [page, query, status, industry, createdFrom, createdTo])

  useEffect(() => {
    void loadBusinesses()
  }, [loadBusinesses])

  useEffect(() => {
    window.addEventListener('stockroom:data-changed', loadBusinesses)
    return () => window.removeEventListener('stockroom:data-changed', loadBusinesses)
  }, [loadBusinesses])

  const updateStatus = async (business: PlatformBusiness) => {
    const nextStatus = pendingStatus[business.id] || business.status
    if (nextStatus === business.status) return
    if (
      nextStatus !== 'active' &&
      !window.confirm(
        nextStatus === 'deactivated'
          ? `Deactivate ${business.name}? Its users will be signed out and cannot access this business until reactivated. Business data will be retained.`
          : `Suspend ${business.name}? Its users will be signed out and cannot access this business until reactivated.`,
      )
    ) return

    setSavingId(business.id)
    setActionError('')
    try {
      await platformApi.setBusinessStatus(business.id, nextStatus)
      setPendingStatus((current) => {
        const updated = { ...current }
        delete updated[business.id]
        return updated
      })
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Unable to update business status.')
    } finally {
      setSavingId('')
    }
  }

  const applyFilter = (setFilter: (value: string) => void, value: string) => {
    setFilter(value)
    setPage(1)
  }

  return (
    <>
      <PageHeading
        title="Businesses"
        description="Provision businesses, review account status, and manage platform access."
        action={
          <button className="platform-button platform-button-primary" type="button" onClick={() => setShowCreate(true)}>
            <Plus size={16} aria-hidden="true" /> Create business
          </button>
        }
      />
      <section className="platform-panel" aria-label="Business list">
        <div className="platform-filters">
          <label className="platform-field platform-search">
            Search businesses
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email, or admin"
              maxLength={120}
            />
          </label>
          <label className="platform-field">
            Status
            <select value={status} onChange={(event) => applyFilter(setStatus, event.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((value) => <option key={value} value={value}>{displayIndustry(value)}</option>)}
            </select>
          </label>
          <label className="platform-field">
            Industry
            <select value={industry} onChange={(event) => applyFilter(setIndustry, event.target.value)}>
              <option value="">All industries</option>
              {INDUSTRIES.map((value) => <option key={value} value={value}>{displayIndustry(value)}</option>)}
            </select>
          </label>
          <label className="platform-field">
            Created from
            <input type="date" value={createdFrom} onChange={(event) => applyFilter(setCreatedFrom, event.target.value)} />
          </label>
          <label className="platform-field">
            Created to
            <input type="date" value={createdTo} onChange={(event) => applyFilter(setCreatedTo, event.target.value)} />
          </label>
        </div>
        {actionError && <p className="platform-table-error" role="alert">{actionError}</p>}
        <div className="platform-table-wrap">
          <table className="platform-table">
            <thead>
              <tr>
                <th scope="col">Business</th>
                <th scope="col">Industry</th>
                <th scope="col">Business Admin</th>
                <th scope="col">Status</th>
                <th scope="col">Created</th>
                <th scope="col">Manage status</th>
              </tr>
            </thead>
            <tbody>
              {businesses?.items.map((business) => (
                <tr key={business.id}>
                  <td>
                    <span className="platform-primary-cell">
                      {business.name}
                      <span className="platform-secondary-cell">{business.email || business.phone || 'No contact details'}</span>
                      <span className="platform-secondary-cell">
                        {[business.city, business.state, business.country].filter(Boolean).join(', ') || 'Location not provided'}
                      </span>
                    </span>
                  </td>
                  <td>{displayIndustry(business.industry)}</td>
                  <td>
                    {business.businessAdmin ? (
                      <span className="platform-primary-cell">
                        {business.businessAdmin.name}
                        <span className="platform-secondary-cell">{business.businessAdmin.email}</span>
                      </span>
                    ) : 'No Business Admin'}
                  </td>
                  <td><StatusBadge status={business.status} /></td>
                  <td>{formatDate(business.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <select
                        className="platform-table-select"
                        aria-label={`Set ${business.name} status`}
                        value={pendingStatus[business.id] || business.status}
                        onChange={(event) => setPendingStatus((current) => ({
                          ...current,
                          [business.id]: event.target.value as BusinessStatus,
                        }))}
                      >
                        {STATUSES.map((value) => <option key={value} value={value}>{displayIndustry(value)}</option>)}
                      </select>
                      <button
                        className="platform-button"
                        type="button"
                        disabled={savingId === business.id || (pendingStatus[business.id] || business.status) === business.status}
                        onClick={() => void updateStatus(business)}
                      >
                        {savingId === business.id ? 'Saving…' : 'Apply'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <TableState
                loading={loading}
                error={error}
                empty={!loading && !error && businesses?.items.length === 0}
                columns={6}
              />
            </tbody>
          </table>
        </div>
        {businesses && (
          <Pagination meta={businesses.meta} loading={loading} onPageChange={setPage} />
        )}
        {!businesses && !loading && error && (
          <div className="platform-pagination">
            <button className="platform-button" type="button" onClick={() => void loadBusinesses()}>
              <RefreshCw size={15} aria-hidden="true" /> Retry
            </button>
          </div>
        )}
      </section>

      {showCreate && (
        <CreateBusinessDialog
          onClose={() => setShowCreate(false)}
          onCreated={(created) => {
            setShowCreate(false)
            setCredentials(created)
          }}
        />
      )}
      {credentials && (
        <OneTimeCredentialDialog credentials={credentials} onClose={() => setCredentials(null)} />
      )}
    </>
  )
}
