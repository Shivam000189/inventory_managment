import React, { useCallback, useMemo, useState, useEffect } from 'react'
import {
  Shield,
  Users,
  UserCheck,
  KeyRound,
  Check,
  X,
  Plus,
  Search,
  CheckCircle2,
  Lock,
  RotateCcw,
  Package,
  ShoppingBag,
  FileText,
  BarChart3,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  CheckSquare,
  Square,
  Sliders,
  Filter,
} from 'lucide-react'
import { StatCard } from '../../dashboard/components/common/StatCard.tsx'
import { Badge } from '../../dashboard/components/common/Badge.tsx'
import { TableSkeleton } from '../../components/ui/Feedback.tsx'
import { userApi } from '../../api/userApi.js'
import { useResource } from '../../hooks/useResource.js'

const PERMISSION_META = {
  view_dashboard: ['View Dashboard', 'Access KPI store telemetry and overview analytics'],
  view_inventory: ['View Inventory', 'Browse product SKUs, stock levels, and item listings'],
  create_product: ['Create Product', 'Generate new item listings, barcodes, and pricing'],
  edit_product: ['Edit Product', 'Modify prices, barcodes, tags, categories, and attributes'],
  delete_product: ['Delete Product', 'Archive or permanently remove catalog items'],
  stock_in: ['Stock In', 'Receive warehouse purchase consignments and stock increments'],
  stock_out: ['Stock Out', 'Record outbound transfers, damages, and wastage write-offs'],
  create_order: ['Create Order', 'Generate wholesale sales invoices and draft orders'],
  process_pos_sale: ['Process POS Sale', 'Ring up cashier transactions and generate sales bills'],
  override_pos_price: ['Override POS Price', 'Manually adjust retail prices or discount lines at checkout'],
  view_reports: ['View Reports', 'Export profit & loss, GST tax records, and analytics'],
  view_returns: ['View Returns', 'Access customer sales returns and credit notes log'],
  create_returns: ['Create Returns', 'Initiate customer return slips and replacement orders'],
  complete_returns: ['Complete Returns', 'Approve warehouse intake of returned inventory'],
  process_refunds: ['Process Refunds', 'Disburse cash, UPI, or card refund payouts to customers'],
  adjust_refunds: ['Adjust Refunds', 'Modify refund amounts or policy fee deductions'],
  cancel_returns: ['Cancel Returns', 'Void an open or in-progress customer return'],
  view_variants: ['View Variants', 'Inspect size, color, and SKU variation matrices'],
  manage_variants: ['Manage Variants', 'Create, update, and reorder product variants'],
  view_replenishment: ['View Replenishment', 'Inspect restock suggestions and low stock reorder alerts'],
  manage_replenishment: ['Manage Replenishment', 'Raise replenishment purchase requests with vendors'],
  manage_promotions: ['Manage Promotions', 'Configure campaign discounts, buy-x-get-y offers'],
  manage_loyalty: ['Manage Loyalty', 'Adjust customer loyalty tiers, points, and conversion rates'],
  manage_coupons: ['Manage Coupons', 'Issue and revoke promotional voucher codes'],
  manage_gift_cards: ['Manage Gift Cards', 'Sell, reload, and verify store prepaid gift cards'],
  view_clothing_reports: ['View Apparel Reports', 'Access apparel sales velocities and size distribution'],
  manage_cashier_shift: ['Manage Cashier Shifts', 'Open register, balance cash drawer, and close shifts'],
  manage_users: ['Manage Team Members', 'Add staff, assign roles, and modify account credentials'],
  manage_suppliers: ['Manage Suppliers', 'Create and maintain vendor directory accounts and terms'],
  manage_customers: ['Manage Customers', 'View customer balances, credit ledgers, and contact profiles'],
  manage_purchase_orders: ['Manage Purchase Orders', 'Create and send purchase orders to suppliers'],
  manage_payments: ['Manage Payments', 'Record and settle customer dues and vendor disbursements'],
}

const PERMISSION_CATALOG = Object.keys(PERMISSION_META)

const PERMISSION_GROUPS = [
  {
    id: 'dashboard',
    name: 'Dashboard & Reports',
    description: 'Store telemetry, executive KPIs, and analytics exports',
    icon: BarChart3,
    iconTone: 'bg-[#EBF2FA] text-[#2563EB]',
    permissions: ['view_dashboard', 'view_reports', 'view_clothing_reports'],
  },
  {
    id: 'products',
    name: 'Products & Catalog',
    description: 'Item creation, pricing, barcodes, and SKU variants',
    icon: Package,
    iconTone: 'bg-[#E6F1E6] text-[#2E8B57]',
    permissions: [
      'view_inventory',
      'create_product',
      'edit_product',
      'delete_product',
      'view_variants',
      'manage_variants',
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory & Stock Movement',
    description: 'Warehouse intake, consignments, adjustments, and reorder thresholds',
    icon: Layers,
    iconTone: 'bg-[#FFF4DC] text-[#D98E0B]',
    permissions: ['stock_in', 'stock_out', 'view_replenishment', 'manage_replenishment'],
  },
  {
    id: 'pos',
    name: 'Point of Sale (POS) & Billing',
    description: 'Checkout billing, price overrides, registers, and cashier shifts',
    icon: ShoppingBag,
    iconTone: 'bg-[#FAF6EF] text-[#E8772E]',
    permissions: ['process_pos_sale', 'override_pos_price', 'manage_cashier_shift'],
  },
  {
    id: 'orders',
    name: 'Orders & Financials',
    description: 'Wholesale sales orders, supplier POs, and payment postings',
    icon: FileText,
    iconTone: 'bg-[#F3E8FF] text-[#7C3AED]',
    permissions: ['create_order', 'manage_purchase_orders', 'manage_payments'],
  },
  {
    id: 'returns',
    name: 'Returns & Customer Refunds',
    description: 'Return intakes, warehouse approvals, refunds, and adjustments',
    icon: RotateCcw,
    iconTone: 'bg-[#FDECEC] text-[#D64545]',
    permissions: [
      'view_returns',
      'create_returns',
      'complete_returns',
      'process_refunds',
      'adjust_refunds',
      'cancel_returns',
    ],
  },
  {
    id: 'team',
    name: 'Team, Customers & Marketing',
    description: 'Staff directory, vendor relations, loyalty, and promotional vouchers',
    icon: Users,
    iconTone: 'bg-[#E0F2FE] text-[#0284C7]',
    permissions: [
      'manage_users',
      'manage_suppliers',
      'manage_customers',
      'manage_promotions',
      'manage_loyalty',
      'manage_coupons',
      'manage_gift_cards',
    ],
  },
]

const scopeFor = (count) => {
  if (count >= 25)
    return {
      title: 'Super Administrator',
      desc: 'Unrestricted master access to every store system',
      variant: 'primary',
    }
  if (count >= 15)
    return {
      title: 'Operations Manager',
      desc: 'Purchases, inventory, orders, and ledger reconciliation',
      variant: 'info',
    }
  if (count >= 7)
    return {
      title: 'Store Staff',
      desc: 'Products, catalog movement, and wholesale orders',
      variant: 'warning',
    }
  if (count >= 3)
    return {
      title: 'POS Cashier',
      desc: 'Front-desk retail POS billing and cash registers only',
      variant: 'neutral',
    }
  return {
    title: 'Restricted Access',
    desc: 'Limited visibility into assigned views',
    variant: 'danger',
  }
}

function UserManagement({ section = 'Roles', business = {}, account = {} }) {
  const load = useCallback(() => Promise.all([userApi.listMembers(), userApi.listRoles()]), [])
  const { data, loading, error, refetch, setData } = useResource(load, [], [[], []])
  const [users = [], roles = []] = data

  const [currentTab, setCurrentTab] = useState(
    section === 'Permissions' ? 'matrix' : section === 'Users' ? 'users' : 'roles'
  )

  const [selectedRoleId, setSelectedRoleId] = useState(null)
  const [roleSearch, setRoleSearch] = useState('')
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  // Role Form state
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [rolePermissions, setRolePermissions] = useState([])

  const getRoleId = (role) => role?.roleId || role?.role || role?.name || role?.id || ''

  const activeRole = useMemo(() => {
    if (selectedRoleId === '__new__') return null
    if (selectedRoleId) {
      const found = roles.find((r) => getRoleId(r) === selectedRoleId)
      if (found) return found
    }
    return roles[0] || null
  }, [roles, selectedRoleId])

  const activeRoleId = selectedRoleId === '__new__' ? '__new__' : getRoleId(activeRole)

  // Sync form inputs with active role selection
  useEffect(() => {
    if (selectedRoleId === '__new__') {
      setRoleName('')
      setRoleDescription('')
      setRolePermissions([])
    } else if (activeRole) {
      setRoleName(activeRole.name || '')
      setRoleDescription(activeRole.description || '')
      setRolePermissions(activeRole.permissions || [])
    }
  }, [activeRole, selectedRoleId])

  const setRoles = (updater) => setData((current) => [current[0], updater(current[1])])
  const setUsers = (updater) => setData((current) => [updater(current[0]), current[1]])

  const usersByRole = useMemo(() => {
    const map = new Map()
    for (const u of users) {
      const rId = u.roleId || u.role
      map.set(rId, (map.get(rId) || 0) + 1)
    }
    return map
  }, [users])

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase()
    if (!q) return roles
    return roles.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    )
  }, [roles, roleSearch])

  const activeUsers = users.filter((u) => u.status === 'active').length
  const rolesInUse = new Set(users.map((u) => u.roleId || u.role)).size

  // Quick permission helpers
  const handleTogglePerm = (permKey) => {
    setRolePermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    )
  }

  const handleToggleGroup = (groupPerms) => {
    const allPresent = groupPerms.every((p) => rolePermissions.includes(p))
    if (allPresent) {
      setRolePermissions((prev) => prev.filter((p) => !groupPerms.includes(p)))
    } else {
      setRolePermissions((prev) => Array.from(new Set([...prev, ...groupPerms])))
    }
  }

  const handleGrantAll = () => {
    setRolePermissions([...PERMISSION_CATALOG])
  }

  const handleClearAll = () => {
    setRolePermissions([])
  }

  // Save Role Handler
  const handleSaveRole = async (e) => {
    e.preventDefault()
    if (saving) return
    const trimmedName = roleName.trim()
    if (!trimmedName) {
      setMessage({ type: 'error', text: 'Please provide a role name.' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const payload = {
        roleId: selectedRoleId === '__new__' ? undefined : activeRole?.roleId,
        name: trimmedName,
        description: roleDescription.trim(),
        permissions: rolePermissions,
      }
      const saved = await userApi.saveRole(payload)
      setRoles((list) => {
        const targetId = getRoleId(saved)
        return list.some((r) => getRoleId(r) === targetId)
          ? list.map((r) => (getRoleId(r) === targetId ? saved : r))
          : [...list, saved]
      })
      setSelectedRoleId(getRoleId(saved))
      setMessage({
        type: 'success',
        text: `Role "${saved.name}" successfully saved with ${saved.permissions?.length || 0} permissions.`,
      })
    } catch (caught) {
      setMessage({
        type: 'error',
        text: caught.message || 'Could not save the role configuration.',
      })
    } finally {
      setSaving(false)
    }
  }

  // Matrix direct cell toggle
  const handleMatrixCellToggle = async (targetRole, permKey) => {
    const rId = getRoleId(targetRole)
    if (!rId) return
    const current = targetRole.permissions || []
    const updated = current.includes(permKey)
      ? current.filter((p) => p !== permKey)
      : [...current, permKey]

    try {
      const saved = await userApi.setRolePermissions(rId, updated)
      setRoles((list) => list.map((r) => (getRoleId(r) === rId ? saved : r)))
    } catch (caught) {
      setMessage({
        type: 'error',
        text: caught.message || 'Could not update role permission.',
      })
    }
  }

  if (loading && !roles.length && !users.length) {
    return (
      <div className="space-y-6 animate-in fade-in duration-150 pb-10">
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-12" aria-labelledby="roles-title">
      {/* Page Header matching Products / Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 id="roles-title" className="text-[28px] font-semibold text-[#1C1B18] tracking-tight leading-tight">
            Roles & Permissions
          </h1>
          <p className="text-[13px] text-[#6B665E] mt-0.5">
            Configure employee roles, define module privileges, and enforce operational security policies.
          </p>
        </div>

        <div className="flex items-center gap-2.5 py-0.5">
          <button
            type="button"
            onClick={() => {
              setSelectedRoleId('__new__')
              setCurrentTab('roles')
              setMessage(null)
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Create New Role</span>
          </button>
        </div>
      </div>

      {/* Alert banner if any */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium border flex items-center justify-between gap-3 ${
            message.type === 'error'
              ? 'bg-[#FDECEC] text-[#D64545] border-[#F9C2C2]'
              : 'bg-[#E8F5EC] text-[#2E8B57] border-[#CDEBD5]'
          }`}
          role={message.type === 'error' ? 'alert' : 'status'}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4 Dashboard-grade StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Shield size={18} strokeWidth={2} />}
          iconBgColor="bg-[#E6F1E6] text-[#2E8B57]"
          label="Configured Roles"
          value={roles.length}
          trend={`${rolesInUse} roles in active use`}
          isPositive={true}
          onClick={() => setCurrentTab('roles')}
          className={currentTab === 'roles' ? 'ring-2 ring-[#7FAE82]' : ''}
        />
        <StatCard
          icon={<Users size={18} strokeWidth={2} />}
          iconBgColor="bg-[#EBF2FA] text-[#2563EB]"
          label="Team Directory"
          value={users.length}
          trend={`${activeUsers} active members`}
          isPositive={true}
          onClick={() => setCurrentTab('roles')}
        />
        <StatCard
          icon={<KeyRound size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FFF4DC] text-[#D98E0B]"
          label="Security Privileges"
          value={PERMISSION_CATALOG.length}
          trend="7 module groups"
          isPositive={true}
          onClick={() => setCurrentTab('matrix')}
          className={currentTab === 'matrix' ? 'ring-2 ring-[#7FAE82]' : ''}
        />
        <StatCard
          icon={<Lock size={18} strokeWidth={2} />}
          iconBgColor="bg-[#FAF6EF] text-[#6B665E]"
          label="Active Selection"
          value={selectedRoleId === '__new__' ? 'New Role' : activeRole?.name || 'Staff'}
          trend={
            selectedRoleId === '__new__'
              ? 'Drafting new role'
              : `${rolePermissions.length} / ${PERMISSION_CATALOG.length} permissions`
          }
          isPositive={rolePermissions.length > 0}
        />
      </div>

      {/* View Switcher Bar */}
      <div className="bg-white rounded-2xl p-2.5 border border-[#EEE6DA] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1.5 bg-[#FAF6EF] p-1 rounded-xl border border-[#EEE6DA] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setCurrentTab('roles')}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              currentTab === 'roles'
                ? 'bg-white text-[#1C1B18] shadow-2xs border border-[#EEE6DA]'
                : 'text-[#6B665E] hover:text-[#1C1B18]'
            }`}
          >
            <Shield size={14} />
            <span>Role Configuration & Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentTab('matrix')}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              currentTab === 'matrix'
                ? 'bg-white text-[#1C1B18] shadow-2xs border border-[#EEE6DA]'
                : 'text-[#6B665E] hover:text-[#1C1B18]'
            }`}
          >
            <Sliders size={14} />
            <span>Permissions Matrix</span>
          </button>
        </div>

        <div className="text-xs text-[#6B665E] px-2 flex items-center gap-2">
          <Info size={14} className="text-[#7FAE82] shrink-0" />
          <span>Privilege updates propagate immediately across all active staff sessions.</span>
        </div>
      </div>

      {/* Main Content Area based on Tab */}
      {currentTab === 'roles' ? (
        /* TWO-COLUMN LAYOUT: ROLES LIST (LEFT) + COMPREHENSIVE ROLE EDITOR (RIGHT) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: ROLES SELECTOR LIST (4 COLS) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-[#EEE6DA] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[#1C1B18]">Available Roles</h3>
                <span className="text-xs font-bold text-[#6B665E] bg-[#FAF6EF] px-2 py-0.5 rounded-lg border border-[#EEE6DA]">
                  {roles.length}
                </span>
              </div>

              {/* Role Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-[#9A948A]" />
                <input
                  type="text"
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder="Filter roles…"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#EEE6DA] bg-white outline-none focus:border-[#7FAE82] text-[#1C1B18] placeholder:text-[#A39E93]"
                />
              </div>

              {/* Roles List */}
              <div className="space-y-2 pt-1 max-h-[640px] overflow-y-auto pr-0.5">
                {filteredRoles.map((role, idx) => {
                  const rId = getRoleId(role) || `role-${idx}`
                  const isActive = activeRoleId === rId
                  const count = role.permissions?.length || 0
                  const userCount = usersByRole.get(rId) || 0
                  const scope = scopeFor(count)

                  return (
                    <div
                      key={rId}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedRoleId(rId)
                        setMessage(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedRoleId(rId)
                          setMessage(null)
                        }
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left relative ${
                        isActive
                          ? 'border-[#7FAE82] bg-[#FAF6EF]/60 shadow-xs ring-1 ring-[#7FAE82]'
                          : 'border-[#EEE6DA] bg-white hover:border-[#DDD3C4] hover:bg-[#FAF6EF]/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-xs text-[#1C1B18] flex items-center gap-1.5">
                          <span>{role.name}</span>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-[#7FAE82] shrink-0" />
                          )}
                        </div>
                        <Badge variant={scope.variant} size="sm">
                          {scope.title}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-[#6B665E] mt-1 line-clamp-2 leading-relaxed">
                        {role.description || 'No operational description set for this role.'}
                      </p>

                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#EEE6DA]/60 text-[11px] text-[#6B665E]">
                        <span className="font-medium text-[#1C1B18] bg-white px-2 py-0.5 rounded-md border border-[#EEE6DA]">
                          {count} / {PERMISSION_CATALOG.length} perms
                        </span>
                        <span>•</span>
                        <span>{userCount} assigned</span>
                      </div>
                    </div>
                  )
                })}

                {filteredRoles.length === 0 && (
                  <div className="p-6 text-center text-xs text-[#6B665E]">
                    No roles matched "{roleSearch}".
                  </div>
                )}
              </div>

              {/* Create Role Button at Bottom */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRoleId('__new__')
                  setMessage(null)
                }}
                className={`w-full py-2.5 px-3 rounded-xl border border-dashed text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRoleId === '__new__'
                    ? 'border-[#7FAE82] bg-[#FAF6EF] text-[#2E8B57]'
                    : 'border-[#EEE6DA] text-[#6B665E] hover:border-[#7FAE82] hover:text-[#1C1B18]'
                }`}
              >
                <Plus size={15} />
                <span>+ Create New Role</span>
              </button>
            </div>
          </div>

          {/* RIGHT: COMPREHENSIVE ROLE EDITOR & PERMISSIONS SELECTOR (8 COLS) */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSaveRole} className="bg-white rounded-2xl border border-[#EEE6DA] p-5 sm:p-6 shadow-2xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EEE6DA]/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E6F1E6] text-[#2E8B57] flex items-center justify-center shrink-0">
                    <Shield size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#1C1B18]">
                      {selectedRoleId === '__new__' ? 'Create New Role' : `Edit Role: ${roleName || 'Unnamed'}`}
                    </h2>
                    <p className="text-xs text-[#6B665E] mt-0.5">
                      Configure title, purpose, and granular module access rights.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={scopeFor(rolePermissions.length).variant}>
                    {scopeFor(rolePermissions.length).title}
                  </Badge>
                </div>
              </div>

              {/* Role Title and Description Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="role-name-input" className="block text-xs font-semibold text-[#1C1B18] mb-1.5">
                    Role Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="role-name-input"
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Inventory Supervisor, POS Cashier"
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-[#EEE6DA] text-xs font-semibold text-[#1C1B18] bg-white outline-none focus:border-[#7FAE82] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="role-desc-input" className="block text-xs font-semibold text-[#1C1B18] mb-1.5">
                    Operational Purpose / Description
                  </label>
                  <input
                    id="role-desc-input"
                    type="text"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Briefly state duties handled by this role…"
                    className="w-full h-10 px-3.5 rounded-xl border border-[#EEE6DA] text-xs text-[#1C1B18] bg-white outline-none focus:border-[#7FAE82] transition-colors"
                  />
                </div>
              </div>

              {/* Permissions Header & Bulk Actions */}
              <div className="pt-2 border-t border-[#EEE6DA]/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1C1B18] flex items-center gap-2">
                      <span>Module Permissions</span>
                      <span className="text-xs font-bold text-[#7FAE82] bg-[#E8F5EC] px-2 py-0.5 rounded-md border border-[#CDEBD5]">
                        {rolePermissions.length} / {PERMISSION_CATALOG.length} granted
                      </span>
                    </h3>
                    <p className="text-xs text-[#6B665E] mt-0.5">
                      Toggle granular capabilities granted to users holding this role.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleGrantAll}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#EEE6DA] bg-[#FAF6EF] hover:bg-[#F2ECE1] text-[#1C1B18] transition-all cursor-pointer"
                    >
                      Grant All (32)
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#EEE6DA] bg-[#FAF6EF] hover:bg-[#F2ECE1] text-[#6B665E] hover:text-[#D64545] transition-all cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Categorized Permissions Accordion/Cards */}
                <div className="space-y-4">
                  {PERMISSION_GROUPS.map((group) => {
                    const GroupIcon = group.icon
                    const grantedInGroup = group.permissions.filter((p) => rolePermissions.includes(p)).length
                    const allInGroup = group.permissions.length
                    const isAllGranted = grantedInGroup === allInGroup

                    return (
                      <div
                        key={group.id}
                        className="rounded-xl border border-[#EEE6DA] bg-[#FAF6EF]/30 p-4 space-y-3"
                      >
                        {/* Group Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${group.iconTone}`}>
                              <GroupIcon size={15} />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-[#1C1B18]">{group.name}</h4>
                              <p className="text-[11px] text-[#6B665E] hidden sm:block">{group.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-semibold text-[#6B665E]">
                              {grantedInGroup} / {allInGroup}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleGroup(group.permissions)}
                              className="text-[11px] font-semibold text-[#7FAE82] hover:underline cursor-pointer"
                            >
                              {isAllGranted ? 'Clear' : 'Select all'}
                            </button>
                          </div>
                        </div>

                        {/* Group Permissions Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {group.permissions.map((permKey) => {
                            const [label, desc] = PERMISSION_META[permKey] || [permKey, '']
                            const isChecked = rolePermissions.includes(permKey)

                            return (
                              <div
                                key={permKey}
                                role="checkbox"
                                aria-checked={isChecked}
                                tabIndex={0}
                                onClick={() => handleTogglePerm(permKey)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    handleTogglePerm(permKey)
                                  }
                                }}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                                  isChecked
                                    ? 'border-[#7FAE82] bg-white shadow-2xs ring-1 ring-[#7FAE82]/30'
                                    : 'border-[#EEE6DA] bg-white/70 hover:border-[#DDD3C4] hover:bg-white'
                                }`}
                              >
                                <div className="pt-0.5 shrink-0">
                                  {isChecked ? (
                                    <div className="w-4 h-4 rounded bg-[#7FAE82] text-white flex items-center justify-center">
                                      <Check size={12} strokeWidth={3} />
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 rounded border border-[#CCC4B8] bg-white" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-xs text-[#1C1B18] leading-tight">
                                    {label}
                                  </div>
                                  <div className="text-[11px] text-[#6B665E] mt-0.5 leading-snug">
                                    {desc}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#EEE6DA]">
                <div className="text-xs text-[#6B665E]">
                  {rolePermissions.length} permissions ready to commit
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeRole) {
                        setRoleName(activeRole.name || '')
                        setRoleDescription(activeRole.description || '')
                        setRolePermissions(activeRole.permissions || [])
                      } else {
                        setRoleName('')
                        setRoleDescription('')
                        setRolePermissions([])
                      }
                      setMessage(null)
                    }}
                    className="px-4 py-2 rounded-xl border border-[#EEE6DA] bg-white text-xs font-semibold text-[#1C1B18] hover:bg-[#FAF6EF] transition-all cursor-pointer"
                  >
                    Reset Form
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-1.5 px-6 py-2 rounded-xl bg-[#7FAE82] hover:bg-[#6C9C70] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 disabled:opacity-50"
                  >
                    <Check size={15} strokeWidth={2.5} />
                    <span>{saving ? 'Saving…' : 'Save Role & Permissions'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* FULL PERMISSIONS COMPARISON MATRIX VIEW */
        <div className="bg-white rounded-2xl border border-[#EEE6DA] p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EEE6DA]/70">
            <div>
              <h2 className="text-base font-semibold text-[#1C1B18]">Comprehensive Permissions Matrix</h2>
              <p className="text-xs text-[#6B665E] mt-0.5">
                Side-by-side privilege mapping. Click any badge to toggle that permission for a specific role in real time.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-[#EEE6DA] bg-[#FAF6EF]/50">
                  <th className="py-3 px-4 text-xs font-bold text-[#1C1B18]">Module & Capability</th>
                  {roles.map((role, idx) => (
                    <th key={getRoleId(role) || idx} className="py-3 px-3 text-xs font-bold text-[#1C1B18] text-center">
                      <div>{role.name}</div>
                      <div className="text-[10px] font-normal text-[#6B665E] mt-0.5">
                        {role.permissions?.length || 0} granted
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE6DA]/70 text-xs">
                {PERMISSION_GROUPS.map((group) => (
                  <React.Fragment key={group.id}>
                    {/* Category Divider Header Row */}
                    <tr className="bg-[#FAF6EF]/80 font-bold text-[#1C1B18]">
                      <td colSpan={roles.length + 1} className="py-2.5 px-4 text-xs text-[#1C1B18]">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#7FAE82]" />
                          {group.name}
                        </span>
                      </td>
                    </tr>

                    {/* Permission Items in Group */}
                    {group.permissions.map((permKey) => {
                      const [label, desc] = PERMISSION_META[permKey] || [permKey, '']
                      return (
                        <tr key={permKey} className="hover:bg-[#FAF6EF]/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#1C1B18]">{label}</div>
                            <div className="text-[11px] text-[#6B665E]">{desc}</div>
                          </td>

                          {roles.map((role, idx) => {
                            const isGranted = Boolean(role.permissions?.includes(permKey))
                            const rId = getRoleId(role) || `role-${idx}`

                            return (
                              <td key={rId} className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleMatrixCellToggle(role, permKey)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer active:scale-95 ${
                                    isGranted
                                      ? 'bg-[#E8F5EC] text-[#2E8B57] hover:bg-[#D7EFE0] border border-[#CDEBD5]'
                                      : 'bg-[#FAF6EF] text-[#A39E93] hover:text-[#1C1B18] hover:bg-[#F2ECE1] border border-[#EEE6DA]'
                                  }`}
                                  title={`Toggle ${label} for ${role.name}`}
                                >
                                  {isGranted ? (
                                    <>
                                      <Check size={12} strokeWidth={2.5} />
                                      <span>Granted</span>
                                    </>
                                  ) : (
                                    <>
                                      <X size={12} />
                                      <span>Restricted</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
