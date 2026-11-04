import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import {
  platformApi,
  type BusinessAdminStatus,
  type PlatformBusinessAdmin,
  type PlatformPage,
} from './platformApi'
import { PageHeading, Pagination, StatusBadge, TableState } from './components'
import { assertPlatformPage, displayIndustry, formatDate } from './platformUtils'

const INDUSTRIES = [
  'grocery', 'pharmacy', 'electronics', 'clothing', 'hardware',
  'automotive', 'other',
]
const PAGE_SIZE = 20

export function PlatformBusinessAdminsPage() {
  const [admins, setAdmins] = useState<PlatformPage<PlatformBusinessAdmin> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [industry, setIndustry] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [withoutBusiness, setWithoutBusiness] = useState(false)
  const [page, setPage] = useState(1)
  const [pendingStatus, setPendingStatus] = useState<Record<string, BusinessAdminStatus>>({})
  const [savingId, setSavingId] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadAdmins = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await platformApi.businessAdmins({
        page,
        limit: PAGE_SIZE,
        q: query,
        status,
        industry,
        createdFrom,
        createdTo,
        withoutBusiness,
      })
      setAdmins(assertPlatformPage(result))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load Business Admins.')
    } finally {
      setLoading(false)
    }
  }, [page, query, status, industry, createdFrom, createdTo, withoutBusiness])

  useEffect(() => {
    void loadAdmins()
  }, [loadAdmins])

  useEffect(() => {
    window.addEventListener('stockroom:data-changed', loadAdmins)
    return () => window.removeEventListener('stockroom:data-changed', loadAdmins)
  }, [loadAdmins])

  const applyFilter = (setFilter: (value: string) => void, value: string) => {
    setFilter(value)
    setPage(1)
  }

  const updateStatus = async (admin: PlatformBusinessAdmin) => {
    const nextStatus = pendingStatus[admin.id] || admin.status
    if (nextStatus === admin.status) return
    if (
      nextStatus === 'inactive' &&
      !window.confirm(
        `Deactivate ${admin.name}? They will be signed out and will not be able to access their business until reactivated.`,
      )
    ) return

    setSavingId(admin.id)
    setActionError('')
    try {
      await platformApi.setBusinessAdminStatus(admin.id, nextStatus)
      setPendingStatus((current) => {
        const updated = { ...current }
        delete updated[admin.id]
        return updated
      })
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Unable to update Business Admin status.')
    } finally {
      setSavingId('')
    }
  }

  return (
    <>
      <PageHeading
        title="Business Admins"
        description="Review provisioned Business Admin accounts and manage their access."
      />
      <section className="platform-panel" aria-label="Business Admin list">
        <div className="platform-filters">
          <label className="platform-field platform-search">
            Search Business Admins
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or email"
              maxLength={120}
            />
          </label>
          <label className="platform-field">
            Status
            <select value={status} onChange={(event) => applyFilter(setStatus, event.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="platform-field">
            Business industry
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
          <label className="platform-checkbox">
            <input
              type="checkbox"
              checked={withoutBusiness}
              onChange={(event) => {
                setWithoutBusiness(event.target.checked)
                setPage(1)
              }}
            />
            Without a business
          </label>
        </div>
        {actionError && <p className="platform-table-error" role="alert">{actionError}</p>}
        <div className="platform-table-wrap">
          <table className="platform-table">
            <thead>
              <tr>
                <th scope="col">Business Admin</th>
                <th scope="col">Business</th>
                <th scope="col">Industry</th>
                <th scope="col">Status</th>
                <th scope="col">Created</th>
                <th scope="col">Manage status</th>
              </tr>
            </thead>
            <tbody>
              {admins?.items.map((admin) => (
                <tr key={admin.id}>
                  <td>
                    <span className="platform-primary-cell">
                      {admin.name}
                      <span className="platform-secondary-cell">{admin.email}</span>
                    </span>
                  </td>
                  <td>{admin.business?.name || 'No business assigned'}</td>
                  <td>{admin.business ? displayIndustry(admin.business.industry) : '—'}</td>
                  <td><StatusBadge status={admin.status} /></td>
                  <td>{formatDate(admin.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <select
                        className="platform-table-select"
                        aria-label={`Set ${admin.name} status`}
                        value={pendingStatus[admin.id] || admin.status}
                        onChange={(event) => setPendingStatus((current) => ({
                          ...current,
                          [admin.id]: event.target.value as BusinessAdminStatus,
                        }))}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                      <button
                        className="platform-button"
                        type="button"
                        disabled={savingId === admin.id || (pendingStatus[admin.id] || admin.status) === admin.status}
                        onClick={() => void updateStatus(admin)}
                      >
                        {savingId === admin.id ? 'Saving…' : 'Apply'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <TableState
                loading={loading}
                error={error}
                empty={!loading && !error && admins?.items.length === 0}
                columns={6}
              />
            </tbody>
          </table>
        </div>
        {admins && <Pagination meta={admins.meta} loading={loading} onPageChange={setPage} />}
        {!admins && !loading && error && (
          <div className="platform-pagination">
            <button className="platform-button" type="button" onClick={() => void loadAdmins()}>
              <RefreshCw size={15} aria-hidden="true" /> Retry
            </button>
          </div>
        )}
      </section>
    </>
  )
}
