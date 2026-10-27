import { useCallback, useMemo, useState } from 'react'
import { userApi } from '../../api/userApi.js'
import { useResource } from '../../hooks/useResource.js'
import { PageHeader } from '../../components/ui/PageHeader.jsx'
import { StatGrid, StatCard, Card } from '../../components/ui/Card.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Field, Input, Select, Textarea } from '../../components/ui/FormControls.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Modal } from '../../components/ui/Modal.jsx'
import './UserManagementPage.css'

const PERMISSION_META = {
  view_dashboard: ['View dashboard', 'Access KPI store revenue telemetry'],
  view_inventory: ['View inventory', 'Browse product SKUs and stock registers'],
  create_product: ['Create product', 'Generate new item listings and barcodes'],
  edit_product: ['Edit product', 'Change prices, tags, and variants'],
  delete_product: ['Delete product', 'Archive or soft-delete items'],
  stock_in: ['Stock in', 'Receive warehouse purchase consignments'],
  stock_out: ['Stock out', 'Write-off damage or outbound transfers'],
  create_order: ['Create order', 'Create wholesale and counter invoices'],
  process_pos_sale: ['Process POS sale', 'Ring up transactions at retail checkouts'],
  override_pos_price: ['Override POS price', 'Manually adjust item sale prices at checkout'],
  view_reports: ['View reports', 'Export profit & loss, tax, and sales stats'],
  view_returns: ['View returns', 'View return orders and credit logs'],
  create_returns: ['Create returns', 'Initiate customer return slips'],
  complete_returns: ['Complete returns', 'Approve warehouse intake of returns'],
  process_refunds: ['Process refunds', 'Release refund payouts to customers'],
  adjust_refunds: ['Adjust refunds', 'Change refund amounts within policy'],
  cancel_returns: ['Cancel returns', 'Void an in-progress return'],
  view_variants: ['View variants', 'See size / colour variant grids'],
  manage_variants: ['Manage variants', 'Create and edit variant inventory'],
  view_replenishment: ['View replenishment', 'See reorder suggestions'],
  manage_replenishment: ['Manage replenishment', 'Raise replenishment purchase orders'],
  manage_promotions: ['Manage promotions', 'Configure discounts and offers'],
  manage_loyalty: ['Manage loyalty', 'Adjust loyalty points and tiers'],
  manage_coupons: ['Manage coupons', 'Issue and revoke coupon codes'],
  manage_gift_cards: ['Manage gift cards', 'Sell and top up store gift cards'],
  view_clothing_reports: ['View clothing reports', 'Access apparel-specific analytics'],
  manage_cashier_shift: ['Manage cashier shift', 'Open and close counter registers'],
  manage_users: ['Manage users', 'Add staff, assign roles, reset access'],
}
const PERMISSION_CATALOG = Object.keys(PERMISSION_META)

const roleTone = (name = '') => {
  const key = name.toLowerCase()
  if (key.includes('admin') || key.includes('owner')) return 'info'
  if (key.includes('manager') || key.includes('lead')) return 'success'
  if (key.includes('account')) return 'warning'
  if (key.includes('staff') || key.includes('cashier') || key.includes('sales')) return 'neutral'
  return 'neutral'
}

const scopeFor = (count) => {
  if (count >= 22) return ['Super administrator', 'Unrestricted access to every store module']
  if (count >= 12) return ['Operations manager', 'Purchases, inventory, orders and vendor reconciliation']
  if (count >= 6) return ['Store staff', 'Products, stock movement and order handling']
  if (count >= 3) return ['POS cashier', 'POS billing, credit notes and cash drawer only']
  return ['Limited access', 'Read-only visibility into assigned screens']
}

function UserManagement({ section = 'Users', business = {}, account = {} }) {
  const load = useCallback(() => Promise.all([userApi.listMembers(), userApi.listRoles()]), [])
  const { data, loading, error, refetch, setData } = useResource(load, [], [[], []])
  const [users = [], roles = []] = data

  const [selectedRoleId, setSelectedRoleId] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const getRoleId = (role) => role?.roleId || role?.role || role?.name || role?.id || ''
  const activeRole =
    selectedRoleId === '__new__'
      ? null
      : roles.find((role) => getRoleId(role) === selectedRoleId) || roles[0] || null
  const activeRoleId = selectedRoleId === '__new__' ? '__new__' : getRoleId(activeRole)
  const setActiveRoleId = setSelectedRoleId
  const roleNames = roles.map((role) => role.name)
  const currentRole = (roleId) => {
    const found = roles.find((role) => getRoleId(role) === roleId)
    return found?.name || roleId || 'Staff'
  }
  const setUsers = (updater) => setData((current) => [updater(current[0]), current[1]])
  const setRoles = (updater) => setData((current) => [current[0], updater(current[1])])

  const usersByRole = useMemo(() => {
    const map = new Map()
    for (const user of users) {
      const rId = user.roleId || user.role
      map.set(rId, (map.get(rId) || 0) + 1)
    }
    return map
  }, [users])

  const handleUserSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    const formData = new FormData(event.currentTarget)
    const payload = {
      name: formData.get('name').trim(),
      email: formData.get('email').trim().toLowerCase(),
      role: formData.get('role'),
    }
    if (!payload.name || !payload.email) {
      setMessage({ type: 'error', text: 'Name and email are required.' })
      return
    }
    setSaving(true)
    try {
      const saved = editingUser
        ? await userApi.updateMember(editingUser.userId, payload)
        : await userApi.createMember(payload)
      setUsers((list) =>
        editingUser
          ? list.map((item) => (item.userId === saved.userId ? saved : item))
          : [...list, saved]
      )
      setFormOpen(false)
      setEditingUser(null)
      setMessage({ type: 'success', text: editingUser ? 'User updated.' : 'Team member added.' })
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not save the user.' })
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (user) => {
    try {
      const saved = await userApi.updateMember(user.userId, {
        status: user.status === 'active' ? 'inactive' : 'active',
      })
      setUsers((list) => list.map((item) => (item.userId === saved.userId ? saved : item)))
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not update the user.' })
    }
  }

  const handleRoleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const payload = {
      roleId: activeRole?.roleId,
      name: formData.get('name').trim(),
      description: formData.get('description').trim(),
      permissions: activeRole?.permissions || [],
    }
    if (!payload.name) return
    try {
      const saved = await userApi.saveRole(payload)
      setRoles((list) =>
        list.some((role) => role.roleId === saved.roleId)
          ? list.map((role) => (role.roleId === saved.roleId ? saved : role))
          : [...list, saved]
      )
      setActiveRoleId(saved.roleId)
      setMessage({ type: 'success', text: 'Role saved.' })
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not save the role.' })
    }
  }

  const togglePermission = async (permission) => {
    if (!activeRole) return
    const currentPerms = activeRole.permissions || []
    const permissions = currentPerms.includes(permission)
      ? currentPerms.filter((item) => item !== permission)
      : [...currentPerms, permission]
    try {
      const rId = getRoleId(activeRole)
      const saved = await userApi.setRolePermissions(rId, permissions)
      setRoles((list) => list.map((role) => (getRoleId(role) === getRoleId(saved) ? saved : role)))
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not update permissions.' })
    }
  }

  const setAllPermissions = async (all) => {
    if (!activeRole) return
    try {
      const rId = getRoleId(activeRole)
      const saved = await userApi.setRolePermissions(
        rId,
        all ? [...PERMISSION_CATALOG] : []
      )
      setRoles((list) => list.map((role) => (getRoleId(role) === getRoleId(saved) ? saved : role)))
    } catch (caught) {
      setMessage({ type: 'error', text: caught.message || 'Could not update permissions.' })
    }
  }

  /* ---- Roles / Permissions view ---- */
  if (section === 'Roles' || section === 'Permissions') {
    const permissionMode = section === 'Permissions'
    return (
      <div className="um-page um-container">
        <PageHeader
          kicker={`Users • ${section}`}
          title={permissionMode ? 'Role Permissions Matrix' : 'Manage Roles'}
          badge={`${roles.length} roles configured`}
          description={`Reusable access controls and operational privilege matrix for ${business.name || 'your business'}.`}
          actions={
            permissionMode ? (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="secondary" onClick={() => setAllPermissions(false)} icon="arrow-path">
                  Reset to None
                </Button>
                <Button variant="primary" onClick={() => setAllPermissions(true)} icon="check">
                  Grant All
                </Button>
              </div>
            ) : null
          }
        />

        <div className="um-note-card">
          <div className="um-note-icon">i</div>
          <p>
            <strong>Role permission propagation:</strong> Changes reflect on staff accounts during their next active session heartbeat. Unchecked privileges hide associated navigation routes and disallow backend actions.
          </p>
        </div>

        {message && (
          <div className={`um-alert-box ${message.type === 'error' ? 'um-alert-error' : 'um-alert-success'}`}>
            {message.text}
          </div>
        )}

        <div className="um-roles-grid">
          {/* Left: Roles list */}
          <Card title="Available Roles" subtitle="Select a role to configure">
            {roles.map((role, idx) => {
              const rId = getRoleId(role) || `role-${idx}`
              const count = role.permissions?.length || 0
              const isActive = activeRoleId === rId
              return (
                <button
                  type="button"
                  key={rId}
                  className={`um-role-card-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveRoleId(rId)}
                >
                  <div className="um-role-card-header">
                    <strong>{role.name}</strong>
                    {isActive && <Badge tone="info">Active</Badge>}
                  </div>
                  <small>{role.description || 'No description set'}</small>
                  <div className="um-role-card-meta">
                    <span>{count} permissions</span>
                    <span>{usersByRole.get(rId) || 0} users assigned</span>
                  </div>
                </button>
              )
            })}
            <div style={{ marginTop: 'var(--space-3)' }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setActiveRoleId('__new__')
                  setMessage(null)
                }}
                icon="plus"
              >
                Create Role
              </Button>
            </div>
          </Card>

          {/* Right: Permission matrix or Role details */}
          <div>
            {permissionMode ? (
              <Card
                title={`${activeRole?.name || 'Role'} Permissions`}
                subtitle="Toggle specific privileges for this operational role"
                actions={
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <Button variant="secondary" size="sm" onClick={() => setAllPermissions(true)} disabled={!activeRole}>
                      Select All
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setAllPermissions(false)} disabled={!activeRole}>
                      Deselect All
                    </Button>
                  </div>
                }
              >
                <div className="um-perm-grid">
                  {PERMISSION_CATALOG.map((permission) => {
                    const [label, description] = PERMISSION_META[permission]
                    const checked = Boolean(activeRole?.permissions?.includes(permission))
                    return (
                      <label key={permission} className={`um-perm-item ${checked ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!activeRole}
                          onChange={() => togglePermission(permission)}
                        />
                        <div>
                          <strong>{label}</strong>
                          <small>{description}</small>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </Card>
            ) : (
              <Card
                title={activeRole ? `Edit ${activeRole.name}` : 'Create a New Role'}
                subtitle="Configure the role title and summary"
              >
                <form onSubmit={handleRoleSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <Field label="Role Name" required htmlFor="role-name">
                      <Input
                        id="role-name"
                        name="name"
                        defaultValue={activeRole?.name || ''}
                        placeholder="e.g. Warehouse Lead"
                        key={activeRole?.roleId || 'new'}
                        required
                      />
                    </Field>

                    <Field label="Description" htmlFor="role-description">
                      <Textarea
                        id="role-description"
                        name="description"
                        defaultValue={activeRole?.description || ''}
                        placeholder="What operational duties does this role handle?"
                        key={`${activeRole?.roleId || 'new'}-desc`}
                        rows={3}
                      />
                    </Field>

                    <p className="text-muted text-xs" style={{ margin: 0 }}>
                      {activeRole?.permissions?.length || 0} permissions attached. Tune fine-grained capabilities under the Permissions section.
                    </p>

                    <div>
                      <Button variant="primary" type="submit" icon="check">
                        Save Role
                      </Button>
                    </div>
                  </div>
                </form>
              </Card>
            )}
          </div>
        </div>

        <footer className="um-statusbar">
          <span>
            <i className="um-statusbar-indicator" />
            Stockroom · Access Control
          </span>
          <span>{roles.length} roles · {users.length} accounts</span>
          <span className="um-statusbar-suite">Enterprise Retail OS</span>
        </footer>
      </div>
    )
  }

  /* ---- Users view ---- */
  const activeUsers = users.filter((user) => user.status === 'active').length
  const cashierRoleUsers = users.filter(
    (user) => /staff|cashier|sales/i.test(currentRole(user.roleId)) && user.status === 'active'
  ).length
  const rolesInUse = new Set(users.map((user) => currentRole(user.roleId))).size
  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase()
    if (roleFilter !== 'all' && currentRole(user.roleId) !== roleFilter) return false
    if (statusFilter !== 'all' && user.status !== statusFilter) return false
    return `${user.name} ${user.email} ${currentRole(user.roleId)}`.toLowerCase().includes(query)
  })

  const columns = [
    {
      key: 'user',
      header: 'Team Member',
      render: (user) => {
        const owner = user.email === account.email || user.role === 'owner'
        return (
          <div className="um-user-cell">
            <span className="um-avatar-badge">{user.name ? user.name[0].toUpperCase() : 'U'}</span>
            <div>
              <span className="font-semibold text-main">
                {user.name}
                {owner && <span className="um-tag owner">Owner</span>}
                {user.status !== 'active' && <span className="um-tag deactivated">Inactive</span>}
              </span>
              <small className="block text-muted">{user.email}</small>
            </div>
          </div>
        )
      },
      mobileLabel: 'User',
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (user) => {
        const role = currentRole(user.roleId)
        return <Badge tone={roleTone(role)}>{role}</Badge>
      },
      mobileLabel: 'Role',
    },
    {
      key: 'scope',
      header: 'Access Scope',
      render: (user) => {
        const roleObj = roles.find((entry) => entry.roleId === user.roleId)
        const [scopeTitle, scopeDesc] = scopeFor(
          roleObj?.permissions?.length || (user.role === 'owner' ? 28 : 4)
        )
        return (
          <div>
            <strong className="text-main text-xs">{scopeTitle}</strong>
            <small className="block text-muted">{scopeDesc}</small>
          </div>
        )
      },
      mobileLabel: 'Scope',
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <Badge tone={user.status === 'active' ? 'success' : 'warning'}>
          {user.status}
        </Badge>
      ),
      mobileLabel: 'Status',
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (user) => {
        const owner = user.email === account.email || user.role === 'owner'
        return (
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setEditingUser(user)
                setFormOpen(true)
              }}
            >
              Edit
            </Button>
            {!owner && (
              <Button
                variant={user.status === 'active' ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => toggleStatus(user)}
              >
                {user.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            )}
          </div>
        )
      },
      mobileLabel: 'Actions',
    },
  ]

  return (
    <div className="um-page um-container">
      <PageHeader
        kicker="Users • Team Members"
        title="Users"
        badge={`${users.length} members registered`}
        description="Control employee access levels, terminal PINs, and cashier role assignments."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditingUser(null)
              setFormOpen(true)
              setMessage(null)
            }}
            icon="plus"
          >
            Add User
          </Button>
        }
      />

      <StatGrid columns={4}>
        <StatCard
          title="Total User Accounts"
          value={users.length}
          subtext={`${activeUsers} active · ${users.length - activeUsers} inactive`}
          icon="users"
        />
        <StatCard
          title="POS Cashiers"
          value={cashierRoleUsers}
          subtext="Cleared for counter billing"
          deltaType="positive"
          icon="monitor"
        />
        <StatCard
          title="Roles In Use"
          value={rolesInUse}
          subtext={`${roles.length} total roles configured`}
          icon="shield"
        />
        <StatCard
          title="Access Guard"
          value="100%"
          subtext="Credentials & role enforced"
          deltaType="positive"
          icon="lock"
        />
      </StatGrid>

      <div className="um-note-card">
        <div className="um-note-icon">i</div>
        <p>
          <strong>Enterprise role guard:</strong> Only administrators can edit purchase prices, approve stock write-offs, or export tax sheets. Cashiers are restricted to POS billing and receiving orders.
        </p>
      </div>

      {message && (
        <div className={`um-alert-box ${message.type === 'error' ? 'um-alert-error' : 'um-alert-success'}`}>
          {message.text}
        </div>
      )}

      {/* User Form Modal */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingUser ? `Edit ${editingUser.name}` : 'Add a Team Member'}
        kicker="Employee Setup"
      >
        <form onSubmit={handleUserSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Field label="Full Name" required htmlFor="member-name">
              <Input
                id="member-name"
                name="name"
                defaultValue={editingUser?.name || ''}
                placeholder="e.g. Rahul Sharma"
                required
              />
            </Field>

            <Field label="Email Address" required htmlFor="member-email">
              <Input
                id="member-email"
                name="email"
                type="email"
                defaultValue={editingUser?.email || ''}
                placeholder="rahul@business.com"
                required
              />
            </Field>

            <Field label="Role" required htmlFor="member-role">
              <Select
                id="member-role"
                name="role"
                defaultValue={currentRole(editingUser?.roleId)}
              >
                {roleNames.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </Select>
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={saving} disabled={saving} icon="check">
                {saving ? 'Saving…' : 'Save User'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      <Card title="Team Directory" subtitle="Manage employee access status and privileges">
        <div className="um-filter-bar">
          <Input
            aria-label="Search users"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, or role..."
          />
          <Select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Filter by role"
          >
            <option value="all">All roles ({roleNames.join(', ') || '—'})</option>
            {roleNames.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Button variant="secondary" onClick={refetch} icon="arrow-path">
            Refresh
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={filteredUsers}
          loading={loading}
          error={error}
          onRetry={refetch}
          emptyTitle="No team members match"
          emptyDescription={
            users.length
              ? 'No members match these filters.'
              : 'No team members registered yet. Add your first user.'
          }
        />
      </Card>

      <footer className="um-statusbar">
        <span>
          <i className="um-statusbar-indicator" />
          Stockroom Server Node Online
        </span>
        <span>
          {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} local
        </span>
        <span>{rolesInUse} roles · {activeUsers} active</span>
        <span className="um-statusbar-suite">Enterprise Retail OS</span>
      </footer>
    </div>
  )
}

export default UserManagement
