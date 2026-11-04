import bcrypt from 'bcryptjs'
import { createSupabaseModel } from './supabaseModel.js'

// ==========================================
// 1. Core Business & Member Models
// ==========================================
export const Business = createSupabaseModel('businesses', {
  idField: 'businessId',
})

export const Member = createSupabaseModel('members', {
  idField: 'userId',
})

export const Notification = createSupabaseModel('notifications', {
  idField: 'notificationId',
})

export const Color = createSupabaseModel('colors', {
  idField: 'colorId',
})

export const ProductImport = createSupabaseModel('product_imports', {
  idField: 'importId',
})

// ==========================================
// 2. Entity Models with ID Mappings & Hooks
// ==========================================
export const Customer = createSupabaseModel('customers', {
  idField: 'customerId',
})

function normalizeSupplierHook() {
  this.supplierName = String(this.supplierName || '').trim().replace(/\s+/g, ' ')
  this.normalizedName = this.supplierName.toLocaleLowerCase('en-US')
}

export const Supplier = createSupabaseModel('suppliers', {
  idField: 'supplierId',
  preSave: [normalizeSupplierHook],
})

export const Product = createSupabaseModel('products', {
  idField: 'productId',
})

export const PurchaseOrder = createSupabaseModel('purchase_orders', {
  idField: 'purchaseOrderId',
})

function receivingToJSONTransform(doc, ret) {
  ret.receivingId = String(ret._id || ret.id)
  ret.receivedAt = ret.receivedAt || ret.createdAt || ret.created_at
  delete ret.__v
  return ret
}

export const Receiving = createSupabaseModel('receivings', {
  idField: 'receivingId',
  toJSONTransform: receivingToJSONTransform,
})

export const SalesOrder = createSupabaseModel('sales_orders', {
  idField: 'orderId',
})

export const Payment = createSupabaseModel('payments', {
  idField: 'paymentId',
})

export const StockTransaction = createSupabaseModel('stock_transactions', {
  idField: 'transactionId',
})

export const Return = createSupabaseModel('returns', {
  idField: 'returnId',
})

export const Refund = createSupabaseModel('refunds', {
  idField: 'refundId',
})

// ==========================================
// 3. Industry & Clothing Models
// ==========================================
export const Promotion = createSupabaseModel('promotions', {
  idField: 'promotionId',
})

export const Coupon = createSupabaseModel('coupons', {
  idField: 'couponId',
})

export const GiftCard = createSupabaseModel('gift_cards', {
  idField: 'giftCardId',
})

export const LoyaltyTransaction = createSupabaseModel('loyalty_transactions', {
  idField: 'loyaltyTransactionId',
})

export const StoreCreditTransaction = createSupabaseModel('store_credit_transactions', {
  idField: 'storeCreditTransactionId',
})

export const CashierShift = createSupabaseModel('cashier_shifts', {
  idField: 'shiftId',
})

export const ClothingShift = CashierShift
export const ClothingVariant = createSupabaseModel('product_variants', { idField: 'variantId' })
export const ClothingBarcode = createSupabaseModel('product_barcodes', { idField: 'barcodeId' })

// ==========================================
// 4. Role & Permissions
// ==========================================
export const Role = createSupabaseModel('roles', {
  idField: 'id',
})

export const DEFAULT_PERMISSIONS = [
  'view_dashboard',
  'view_inventory',
  'create_product',
  'edit_product',
  'delete_product',
  'stock_in',
  'stock_out',
  'create_order',
  'process_pos_sale',
  'override_pos_price',
  'view_reports',
  'manage_users',
  'view_returns',
  'create_returns',
  'complete_returns',
  'process_refunds',
  'adjust_refunds',
  'cancel_returns',
  'view_variants',
  'manage_variants',
  'view_replenishment',
  'manage_replenishment',
  'manage_promotions',
  'manage_loyalty',
  'manage_coupons',
  'manage_gift_cards',
  'view_clothing_reports',
  'manage_cashier_shift',
  'manage_suppliers',
  'manage_customers',
  'manage_purchase_orders',
  'manage_payments',
]

export const ALL_PERMISSIONS = DEFAULT_PERMISSIONS

export const MANAGER_PERMISSIONS = DEFAULT_PERMISSIONS.filter(
  (perm) => !['manage_users'].includes(perm)
)

export const INDUSTRY_ROLE_DEFINITIONS = {
  pharmacy: [
    {
      roleId: 'ROLE-PHARMACIST',
      name: 'Pharmacist',
      description: 'POS billing, prescription review, medicine batches, expiry tracking, and customer sales',
      permissions: ['view_dashboard', 'view_inventory', 'create_order', 'process_pos_sale', 'view_returns', 'create_returns'],
    },
    {
      roleId: 'ROLE-PHARMA-STOCKIST',
      name: 'Pharmacy Stockist',
      description: 'Medicine catalog, batch inwards, expiry tracking, purchase orders, receiving (GRN), and stock adjustments',
      permissions: ['view_inventory', 'create_product', 'edit_product', 'stock_in', 'stock_out', 'manage_purchase_orders', 'view_replenishment', 'manage_replenishment', 'manage_suppliers'],
    },
  ],
  clothing: [
    {
      roleId: 'ROLE-CLOTHING-CASHIER',
      name: 'Fashion Cashier',
      description: 'POS checkout counter, register shifts, customer loyalty, gift cards, coupons, and returns',
      permissions: ['view_dashboard', 'view_inventory', 'process_pos_sale', 'manage_cashier_shift', 'view_returns', 'create_returns', 'manage_coupons', 'manage_gift_cards', 'manage_loyalty'],
    },
    {
      roleId: 'ROLE-MERCHANDISER',
      name: 'Fashion Merchandiser',
      description: 'Size and color matrix, product variants, replenishment planning, promotional campaigns, and apparel reports',
      permissions: ['view_dashboard', 'view_inventory', 'create_product', 'edit_product', 'view_variants', 'manage_variants', 'view_replenishment', 'manage_replenishment', 'manage_promotions', 'view_clothing_reports'],
    },
  ],
  wholesale: [
    {
      roleId: 'ROLE-WHOLESALE-SALES',
      name: 'B2B Sales Executive',
      description: 'Wholesale bulk orders, customer credit lines (Khata), order dispatch, and customer accounts',
      permissions: ['view_dashboard', 'view_inventory', 'create_order', 'manage_customers', 'view_returns', 'create_returns'],
    },
    {
      roleId: 'ROLE-WAREHOUSE',
      name: 'Warehouse Supervisor',
      description: 'Consignment intake, double-entry stock ledger, receiving (GRN), stock adjustments, and supplier management',
      permissions: ['view_inventory', 'create_product', 'edit_product', 'stock_in', 'stock_out', 'manage_purchase_orders', 'manage_suppliers'],
    },
    {
      roleId: 'ROLE-ACCOUNTANT',
      name: 'Billing & Credit Accountant',
      description: 'Payment collections, vendor payouts, customer credit ledger, refund processing, and financial reports',
      permissions: ['view_dashboard', 'view_reports', 'manage_payments', 'manage_customers', 'create_order', 'process_refunds'],
    },
  ],
  hardware: [
    {
      roleId: 'ROLE-HARDWARE-SALES',
      name: 'Trade Counter Sales',
      description: 'Trade counter POS, contractor tiered rates, bulk orders, and customer billing',
      permissions: ['view_dashboard', 'view_inventory', 'process_pos_sale', 'override_pos_price', 'create_order', 'manage_customers'],
    },
    {
      roleId: 'ROLE-YARD-SUPERVISOR',
      name: 'Yard & Rack Stockist',
      description: 'Rack and bin inventory mapping, receiving heavy materials, stock adjustments, and supplier purchase orders',
      permissions: ['view_inventory', 'create_product', 'edit_product', 'stock_in', 'stock_out', 'manage_purchase_orders', 'manage_suppliers'],
    },
  ],
  electronics: [
    {
      roleId: 'ROLE-ELECTRONICS-SALES',
      name: 'Device Sales Specialist',
      description: 'Device POS checkout, serial and IMEI tracking, warranty card issuance, and customer returns',
      permissions: ['view_dashboard', 'view_inventory', 'process_pos_sale', 'create_order', 'view_returns', 'create_returns'],
    },
    {
      roleId: 'ROLE-TECH-STOCKIST',
      name: 'Serial & Device Stockist',
      description: 'Device serialization, catalog intake, warranty tracking, receiving, and purchase orders',
      permissions: ['view_inventory', 'create_product', 'edit_product', 'stock_in', 'stock_out', 'manage_purchase_orders', 'manage_suppliers'],
    },
  ],
  grocery: [
    {
      roleId: 'ROLE-GROCERY-CASHIER',
      name: 'Express Counter Cashier',
      description: 'Rapid barcode POS checkout, cashier shift balancing, and customer returns',
      permissions: ['view_inventory', 'process_pos_sale', 'manage_cashier_shift', 'create_returns'],
    },
    {
      roleId: 'ROLE-GROCERY-STOCKIST',
      name: 'Produce & Receiving Clerk',
      description: 'Fresh stock inward, perishable expiry tracking, weight verification, and reorder levels',
      permissions: ['view_inventory', 'stock_in', 'stock_out', 'create_product', 'edit_product', 'manage_purchase_orders', 'manage_suppliers'],
    },
  ],
  manufacturing: [
    {
      roleId: 'ROLE-PLANT-SUPERVISOR',
      name: 'Plant & Production Lead',
      description: 'Raw materials intake, BOM recipe tracking, finished goods catalog, and stock movement',
      permissions: ['view_dashboard', 'view_inventory', 'stock_in', 'stock_out', 'create_product', 'edit_product', 'manage_purchase_orders', 'manage_suppliers'],
    },
  ],
}

export const GENERIC_INDUSTRY_ROLES = [
  {
    roleId: 'ROLE-SALESPERSON',
    name: 'Salesperson',
    description: 'POS terminal sales, billing records, customer service, and order processing',
    permissions: ['view_dashboard', 'view_inventory', 'create_order', 'process_pos_sale', 'view_returns', 'create_returns'],
  },
  {
    roleId: 'ROLE-STOCKIST',
    name: 'Inventory Stockist',
    description: 'Inventory ledger, stock inward/outward, receiving, and catalog updates',
    permissions: ['view_inventory', 'create_product', 'edit_product', 'stock_in', 'stock_out', 'manage_purchase_orders', 'manage_suppliers'],
  },
]

export function getIndustryRoles(industry, businessType) {
  const norm = String(industry || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  const specific = INDUSTRY_ROLE_DEFINITIONS[norm] || GENERIC_INDUSTRY_ROLES;
  return [
    { roleId: 'ROLE-ADMIN', name: 'Admin', description: 'Full access to this business', permissions: DEFAULT_PERMISSIONS },
    { roleId: 'ROLE-MANAGER', name: 'Store Manager', description: 'Operational oversight: inventory, sales, purchasing, and reports', permissions: MANAGER_PERMISSIONS },
    ...specific,
  ];
}

export const DEFAULT_ROLES = getIndustryRoles('retail');


// ==========================================
// 5. User Model & Auth Logic
// ==========================================
export const MAX_FAILED_LOGINS = 8
export const LOCK_DURATION_MS = 15 * 60 * 1000

const userMethods = {
  comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password)
  },
  isLocked() {
    return Boolean(this.lockUntil && new Date(this.lockUntil).getTime() > Date.now())
  },
  async registerFailedLogin() {
    const attempts = (Number(this.failedLoginAttempts) || 0) + 1
    const isLockedOut = attempts >= MAX_FAILED_LOGINS
    const lockUntil = isLockedOut ? new Date(Date.now() + LOCK_DURATION_MS).toISOString() : null
    this.failedLoginAttempts = isLockedOut ? 0 : attempts
    this.lockUntil = lockUntil
    await this.save()
    return lockUntil ? Math.ceil(LOCK_DURATION_MS / 60000) : null
  },
  async clearLoginLock() {
    if (!this.failedLoginAttempts && !this.lockUntil) return
    this.failedLoginAttempts = 0
    this.lockUntil = null
    await this.save()
  },
}

async function hashPasswordHook() {
  if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
    this.password = await bcrypt.hash(this.password, 10)
  }
}

function userToJSONTransform(doc, ret) {
  ret.accountId = String(ret._id || ret.id)
  delete ret.password
  delete ret.tokenVersion
  delete ret.token_version
  delete ret.failedLoginAttempts
  delete ret.failed_login_attempts
  delete ret.lockUntil
  delete ret.lock_until
  delete ret.resetPasswordTokenHash
  delete ret.reset_password_token_hash
  delete ret.resetPasswordExpires
  delete ret.reset_password_expires
  delete ret.deactivatedBy
  delete ret.deactivated_by
  delete ret.__v
  return ret
}

export const User = createSupabaseModel('users', {
  idField: 'accountId',
  methods: userMethods,
  preSave: [hashPasswordHook],
  toJSONTransform: userToJSONTransform,
})
