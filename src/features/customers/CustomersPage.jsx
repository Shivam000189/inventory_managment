import { useCallback, useMemo, useState } from 'react'
import { customerApi } from '../../api/customerApi.js'
import { salesOrderApi } from '../../api/salesOrderApi.js'
import { useResource } from '../../hooks/useResource.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { StatGrid, StatCard } from '../../components/ui/Card.jsx'
import { Toolbar } from '../../components/ui/Toolbar.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Field, Input, Select, Textarea } from '../../components/ui/FormControls.jsx'
import { FormStatus } from '../../components/ui/Feedback.jsx'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx'
import { Icon } from '../../components/ui/icons.jsx'
import './CustomersPage.css'

const PHONE_PATTERN = /^[+\d][\d\s()-]{6,}$/

function CustLocalIcon({ name }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    export: <><path d="M12 3v12m-4-4 4 4 4-4" /><path d="M5 17v3h14v-3" /></>,
    whatsapp: <><path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z" /><path d="M9 9c0 4 2 6 6 6" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    refresh: <><path d="M4 12a8 8 0 0 1 13.7-5.7L20 8m0-4v4h-4M20 12a8 8 0 0 1-13.7 5.7L4 16m0 4v-4h4" /></>,
    users: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.6M20.5 20a5.2 5.2 0 0 0-3.5-4.9" /></>,
    repeat: <><path d="M4 12a8 8 0 0 1 13.7-5.7L20 8m0-4v4h-4M20 12a8 8 0 0 1-13.7 5.7L4 16m0 4v-4h4" /></>,
    wallet: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 14h2" /></>,
    alert: <><path d="M12 4 2 20h20L12 4Z" /><path d="M12 10v5M12 18h.01" /></>,
    phone: <path d="M6 3h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2Z" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    pin: <><path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="3" /></>,
    edit: <path d="M4 20h4L18 10l-4-4L4 16v4ZM14 6l4 4" />,
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 16, height: 16 }}
    >
      {paths[name]}
    </svg>
  )
}

const TYPE_LABEL = {
  retail: 'Retail',
  wholesale: 'Wholesale B2B',
  dealer: 'Dealer',
  contractor: 'Contractor',
}

function Customers({ business, onNavigate }) {
  const load = useCallback(() => Promise.all([customerApi.list(), salesOrderApi.list()]), [])
  const { data, loading, error, refetch, setData } = useResource(load, [], [[], []])
  const [customers, salesOrders] = data

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [cityFilter, setCityFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [viewingCustomer, setViewingCustomer] = useState(null)
  const [message, setMessage] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const currency = business?.currency || 'INR'
  const money = useCallback(
    (value, dp = 2) => {
      const amount = Number(value || 0)
      try {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency,
          minimumFractionDigits: dp,
          maximumFractionDigits: dp,
        }).format(amount)
      } catch {
        return `${currency} ${amount.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`
      }
    },
    [currency],
  )

  const setCustomers = (updater) => setData((current) => [updater(current[0]), current[1]])

  const orderCountByCustomer = useMemo(() => {
    const map = new Map()
    for (const order of salesOrders) {
      if (!order.customerId || order.status === 'Cancelled') continue
      map.set(order.customerId, (map.get(order.customerId) || 0) + 1)
    }
    return map
  }, [salesOrders])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    const formData = new FormData(event.currentTarget)
    const customer = {
      name: (formData.get('name') || '').trim(),
      phone: (formData.get('phone') || '').trim(),
      email: (formData.get('email') || '').trim().toLowerCase(),
      address: (formData.get('address') || '').trim(),
      city: (formData.get('city') || '').trim(),
      state: (formData.get('state') || '').trim(),
      gstin: (formData.get('gstin') || '').trim().toUpperCase(),
      customerType: formData.get('customerType'),
      notes: (formData.get('notes') || '').trim(),
    }
    if (!customer.name) {
      setMessage({ type: 'error', text: 'Customer name is required.' })
      return
    }
    if (customer.email && !/^\S+@\S+\.\S+$/.test(customer.email)) {
      setMessage({ type: 'error', text: 'Enter a valid customer email.' })
      return
    }
    if (customer.phone && !PHONE_PATTERN.test(customer.phone)) {
      setMessage({ type: 'error', text: 'Enter a valid customer phone number.' })
      return
    }

    setSaving(true)
    try {
      const saved = editingCustomer
        ? await customerApi.update(editingCustomer.customerId, customer)
        : await customerApi.create(customer)
      setCustomers((list) =>
        editingCustomer
          ? list.map((item) => (item.customerId === saved.customerId ? saved : item))
          : [saved, ...list],
      )
      setFormOpen(false)
      setEditingCustomer(null)
      setMessage({ type: 'success', text: editingCustomer ? 'Customer updated.' : 'Customer added.' })
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not save the customer.' })
    } finally {
      setSaving(false)
    }
  }

  const archiveCustomer = (customer) => {
    setArchiveTarget(customer)
  }

  const handleConfirmArchive = async () => {
    const customer = archiveTarget
    setArchiveTarget(null)
    if (!customer) return
    try {
      const saved = await customerApi.archive(customer.customerId)
      setCustomers((list) =>
        list.map((item) => (item.customerId === saved.customerId ? saved : item)),
      )
      setMessage({ type: 'success', text: `${customer.name} was archived.` })
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not archive the customer.' })
    }
  }

  const openForm = (customer = null) => {
    setEditingCustomer(customer)
    setFormOpen(true)
    setMessage(null)
  }

  const cities = useMemo(
    () => [...new Set(customers.map((customer) => customer.city).filter(Boolean))].sort(),
    [customers],
  )

  const stats = useMemo(() => {
    const active = customers.filter((customer) => customer.status === 'active')
    const wholesale = active.filter(
      (customer) => customer.customerType && customer.customerType !== 'retail',
    ).length
    const totalSpend = customers.reduce(
      (sum, customer) => sum + Number(customer.totalPurchases || 0),
      0,
    )
    const withOrders = customers.filter(
      (customer) => (orderCountByCustomer.get(customer.customerId) || 0) > 1,
    ).length
    const dueAccounts = customers.filter((customer) => Number(customer.outstandingBalance || 0) > 0)
    return {
      total: customers.length,
      active: active.length,
      retail: active.length - wholesale,
      wholesale,
      repeatRate: customers.length ? Math.round((withOrders / customers.length) * 1000) / 10 : 0,
      totalSpend,
      avgSpend: customers.length ? totalSpend / customers.length : 0,
      pendingDue: dueAccounts.reduce(
        (sum, customer) => sum + Number(customer.outstandingBalance || 0),
        0,
      ),
      dueCount: dueAccounts.length,
    }
  }, [customers, orderCountByCustomer])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return customers.filter((customer) => {
      if (statusFilter !== 'all' && customer.status !== statusFilter) return false
      if (typeFilter !== 'all' && (customer.customerType || 'retail') !== typeFilter) return false
      if (cityFilter !== 'all' && customer.city !== cityFilter) return false
      return `${customer.name} ${customer.phone} ${customer.email} ${customer.city} ${customer.gstin}`
        .toLowerCase()
        .includes(query)
    })
  }, [customers, statusFilter, typeFilter, cityFilter, search])

  const exportCsv = () => {
    const escapeCell = (value) => {
      const text = String(value ?? '')
      const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text
      return `"${safe.replaceAll('"', '""')}"`
    }
    const rows = [
      [
        'Name',
        'Type',
        'Phone',
        'Email',
        'City',
        'GSTIN',
        'Status',
        'Lifetime Purchases',
        'Outstanding',
        'Orders',
      ],
      ...filtered.map((customer) => [
        customer.name,
        TYPE_LABEL[customer.customerType] || 'Retail',
        customer.phone,
        customer.email,
        customer.city,
        customer.gstin,
        customer.status,
        customer.totalPurchases || 0,
        customer.outstandingBalance || 0,
        orderCountByCustomer.get(customer.customerId) || 0,
      ]),
    ]
    const url = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8',
      }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const tierOf = (customer) => {
    if (customer.customerType && customer.customerType !== 'retail')
      return { label: 'Wholesale B2B', tone: 'info' }
    if (Number(customer.totalPurchases || 0) >= 25000) return { label: 'VIP · loyal', tone: 'warning' }
    return { label: 'Retail', tone: 'neutral' }
  }

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Customer Details',
        render: (customer) => {
          const tier = tierOf(customer)
          return (
            <div className="cust-name">
              <span className="cust-avatar">{customer.name[0].toUpperCase()}</span>
              <div>
                <strong>
                  {customer.name}
                  <Badge tone={tier.tone}>{tier.label}</Badge>
                </strong>
                <small>
                  <CustLocalIcon name="pin" />
                  {customer.city || 'City not set'}
                  {customer.gstin
                    ? ` · GSTIN ${customer.gstin}`
                    : ` · ID ${(customer.customerId || '').slice(-6).toUpperCase()}`}
                </small>
              </div>
            </div>
          )
        },
      },
      {
        key: 'contact',
        header: 'Contact Info',
        render: (customer) => (
          <div>
            <strong className="cust-contact">
              <CustLocalIcon name="phone" />
              {customer.phone || 'No phone'}
            </strong>
            <small style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-soft)', fontSize: 'var(--fs-xs)', marginTop: 2 }}>
              <CustLocalIcon name="mail" />
              {customer.email || 'No email'}
            </small>
          </div>
        ),
      },
      {
        key: 'totalPurchases',
        header: 'Lifetime Purchases',
        align: 'right',
        render: (customer) => {
          const orders = orderCountByCustomer.get(customer.customerId) || 0
          return (
            <div className="cust-spend" style={{ textAlign: 'right' }}>
              <strong>{money(customer.totalPurchases)}</strong>
              <small style={{ display: 'block' }}>
                {orders} order{orders === 1 ? '' : 's'}
              </small>
            </div>
          )
        },
      },
      {
        key: 'outstandingBalance',
        header: 'Credit / Dues',
        render: (customer) => {
          const due = Number(customer.outstandingBalance || 0)
          return (
            <Badge tone={due > 0 ? 'warning' : 'success'}>
              {due > 0 ? `${money(due)} due` : `${money(0)} clear`}
            </Badge>
          )
        },
      },
      {
        key: 'status',
        header: 'Status',
        render: (customer) => (
          <Badge tone={customer.status === 'active' ? 'success' : 'neutral'}>{customer.status}</Badge>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (customer) => {
          const due = Number(customer.outstandingBalance || 0)
          return (
            <div className="cust-row-actions">
              {due > 0 ? (
                <Button size="sm" variant="secondary" onClick={() => onNavigate?.('Payments')}>
                  Collect Due
                </Button>
              ) : (
                <Button size="sm" variant="primary" onClick={() => onNavigate?.('POS / Billing')}>
                  New Sale
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                icon={<CustLocalIcon name="eye" />}
                aria-label={`View ${customer.name}`}
                onClick={() => setViewingCustomer(customer)}
              />
              <Button
                size="sm"
                variant="secondary"
                icon={<CustLocalIcon name="edit" />}
                aria-label={`Edit ${customer.name}`}
                onClick={() => openForm(customer)}
              />
              {customer.status === 'active' && (
                <Button
                  size="sm"
                  variant="danger"
                  aria-label={`Archive ${customer.name}`}
                  onClick={() => archiveCustomer(customer)}
                >
                  ×
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderCountByCustomer, money],
  )

  return (
    <section className="cust-page" aria-labelledby="cust-title">
      <PageHeader
        kicker={`Manage your customers • ${business?.name || 'Workspace'} CRM`}
        title="Customers"
        badge={<Badge tone="warning">{stats.active} active profiles</Badge>}
        subtitle="Every retail shopper and B2B wholesale buyer you sell to — contact details, lifetime spend, and open credit lines."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<CustLocalIcon name="export" />}
              onClick={exportCsv}
              disabled={loading || !!error || !customers.length}
            >
              Export CSV
            </Button>
            <Button
              variant="secondary"
              icon={<CustLocalIcon name="whatsapp" />}
              onClick={() => onNavigate?.('POS / Billing')}
            >
              Notify Customers
            </Button>
            <Button variant="primary" icon={<CustLocalIcon name="plus" />} onClick={() => openForm()}>
              Add Customer
            </Button>
          </>
        }
      />

      {message && <FormStatus status={message.type} message={message.text} />}

      <StatGrid>
        <StatCard
          icon="cart"
          label="Total Customers"
          value={loading || error ? '—' : stats.total}
          helpText={`${stats.retail} retail walk-in · ${stats.wholesale} wholesale B2B`}
          tone="info"
        />
        <StatCard
          icon="check"
          label="Repeat Purchase Rate"
          value={loading || error ? '—' : `${stats.repeatRate}%`}
          helpText="Customers with more than one order"
          tone="success"
        />
        <StatCard
          icon="currency"
          label="Total Customer Spend"
          value={loading || error ? '—' : money(stats.totalSpend, 0)}
          helpText={`Across all sales · avg ${money(stats.avgSpend, 0)} / cust`}
          tone="success"
        />
        <StatCard
          icon="alert"
          label="Pending Credit / Dues"
          value={loading || error ? '—' : money(stats.pendingDue, 0)}
          helpText={`${stats.dueCount} accounts carrying open balance`}
          tone={stats.pendingDue > 0 ? 'warning' : 'success'}
        />
      </StatGrid>

      <Toolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by name, mobile, email, or city..."
        filters={
          <>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by type"
            >
              <option value="all">All types ({customers.length})</option>
              {['retail', 'wholesale', 'dealer', 'contractor'].map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABEL[type]}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="active">Active customers</option>
              <option value="archived">Archived customers</option>
              <option value="all">All customers</option>
            </Select>
            <Select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              aria-label="Filter by city"
            >
              <option value="all">All cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </Select>
            <Button
              size="md"
              variant="secondary"
              icon={<Icon name="refresh" />}
              onClick={refetch}
              aria-label="Refresh"
            />
          </>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={loading}
        pagination={{
          page,
          pageSize,
          total: filtered.length,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size)
            setPage(1)
          },
        }}
        emptyState={{
          title: 'No customers found',
          description: customers.length
            ? 'No customers match your active filter.'
            : 'No customers yet. Add your first customer or ring up a POS sale.',
        }}
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingCustomer ? `Edit ${editingCustomer.name}` : 'Add a Customer'}
        subtitle="Manage customer profile, billing address, and tax IDs"
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="cust-form-grid">
            <Field label="Customer Name" required>
              <Input
                id="customer-name"
                name="name"
                defaultValue={editingCustomer?.name || ''}
                placeholder="e.g. Priya Sharma"
                required
              />
            </Field>

            <Field label="Phone">
              <Input
                id="customer-phone"
                name="phone"
                type="tel"
                defaultValue={editingCustomer?.phone || ''}
                placeholder="+91 98765 43210"
              />
            </Field>

            <Field label="Email">
              <Input
                id="customer-email"
                name="email"
                type="email"
                defaultValue={editingCustomer?.email || ''}
                placeholder="customer@example.com"
              />
            </Field>

            <Field label="City">
              <Input
                id="customer-city"
                name="city"
                defaultValue={editingCustomer?.city || ''}
                placeholder="City"
              />
            </Field>

            <Field label="State">
              <Input
                id="customer-state"
                name="state"
                defaultValue={editingCustomer?.state || ''}
                placeholder="State"
              />
            </Field>

            <Field label="GSTIN">
              <Input
                id="customer-gstin"
                name="gstin"
                defaultValue={editingCustomer?.gstin || ''}
                placeholder="GST registration number"
              />
            </Field>

            <Field label="Customer Type">
              <Select
                id="customer-type"
                name="customerType"
                defaultValue={editingCustomer?.customerType || 'retail'}
              >
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="dealer">Dealer</option>
                <option value="contractor">Contractor</option>
              </Select>
            </Field>

            <div className="field-wide">
              <Field label="Address">
                <Input
                  id="customer-address"
                  name="address"
                  defaultValue={editingCustomer?.address || ''}
                  placeholder="Street and building name"
                />
              </Field>
            </div>

            <div className="field-wide">
              <Field label="Notes">
                <Textarea
                  id="customer-notes"
                  name="notes"
                  defaultValue={editingCustomer?.notes || ''}
                  placeholder="Add customer notes"
                  rows={2}
                />
              </Field>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              {saving ? 'Saving…' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Profile Modal */}
      <Modal
        isOpen={!!viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        title={viewingCustomer?.name || 'Customer Profile'}
        subtitle="Full customer contact and transaction history"
        size="md"
      >
        {viewingCustomer && (
          <div>
            <div className="cust-detail-grid">
              <div>
                <small>Phone</small>
                <strong>{viewingCustomer.phone || 'Not provided'}</strong>
              </div>
              <div>
                <small>Email</small>
                <strong>{viewingCustomer.email || 'Not provided'}</strong>
              </div>
              <div>
                <small>Type</small>
                <strong>{TYPE_LABEL[viewingCustomer.customerType] || 'Retail'}</strong>
              </div>
              <div>
                <small>Payment terms</small>
                <strong>{viewingCustomer.paymentTerms || 'Due on receipt'}</strong>
              </div>
              <div>
                <small>Lifetime purchases</small>
                <strong>{money(viewingCustomer.totalPurchases)}</strong>
              </div>
              <div>
                <small>Outstanding balance</small>
                <strong>{money(viewingCustomer.outstandingBalance)}</strong>
              </div>
              <div>
                <small>Orders placed</small>
                <strong>{orderCountByCustomer.get(viewingCustomer.customerId) || 0}</strong>
              </div>
              <div>
                <small>Credit limit</small>
                <strong>{money(viewingCustomer.creditLimit)}</strong>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <small>Address</small>
                <strong>
                  {[viewingCustomer.address, viewingCustomer.city, viewingCustomer.state]
                    .filter(Boolean)
                    .join(', ') || 'Not provided'}
                </strong>
              </div>
              <div>
                <small>GSTIN</small>
                <strong>{viewingCustomer.gstin || 'Not provided'}</strong>
              </div>
            </div>
            <div className="cust-action-hint">
              <strong>Ring up a sale or collect a payment</strong>
              <span>Start a new sale at the POS terminal, or record a credit collection under Payments.</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        title="Archive Customer"
        message={
          archiveTarget
            ? `Archive ${archiveTarget.name}? Their purchase history stays intact.`
            : ''
        }
        confirmText="Archive"
        onConfirm={handleConfirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </section>
  )
}

export default Customers
