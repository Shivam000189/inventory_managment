import { Notification, User, Member, Role, Product, PurchaseOrder, SalesOrder, Payment, Receiving, Supplier } from '../models/index.js'
import { ApiError } from '../utils/ApiError.js'
import { toObjectId } from '../validators/assert.js'

const CATEGORY_PERMISSION = { inventory: 'view_inventory', purchases: 'view_inventory', suppliers: 'view_inventory', sales: 'create_order', returns: 'create_order', payments: 'view_reports', users: 'manage_users', system: 'view_dashboard' }
const scoped = (businessId, extra = {}) => ({ business: toObjectId(businessId, 'business'), ...extra })

async function recipientIds(businessId, category) {
  const business = toObjectId(businessId, 'business')
  const users = await User.find({ business }).select('_id email role')
  const members = await Member.find({ business, status: 'active' }).select('userId accountId account email roleId')
  const roles = await Role.find({ business }).select('roleId permissions name')
  const memberByAccount = new Map(
    members
      .filter((m) => m.accountId || m.account || m.userId)
      .map((m) => [String(m.accountId || m.account || m.userId), m])
  )
  const memberByEmail = new Map(members.map((m) => [String(m.email || '').toLowerCase().trim(), m]))
  const roleById = new Map(roles.map((r) => [r.roleId, r]))
  const permission = CATEGORY_PERMISSION[category] || 'view_dashboard'

  const matched = users.filter((user) => {
    // Both admin (owner) and salesperson receive inventory and operational alerts
    if (user.role === 'owner' || user.role === 'admin' || user.role === 'salesperson') return true
    const emailKey = String(user.email || '').toLowerCase().trim()
    const member = memberByAccount.get(String(user._id || user.id)) || memberByEmail.get(emailKey)
    if (!member) {
      return category === 'inventory' || category === 'sales'
    }
    const role = roleById.get(member.roleId)
    const isSalesperson =
      member.roleId?.toLowerCase().includes('sales') ||
      role?.name?.toLowerCase().includes('sales') ||
      role?.name?.toLowerCase().includes('staff')
    if (category === 'inventory' && isSalesperson) return true
    return Boolean(role?.permissions?.includes(permission))
  }).map((user) => user._id || user.id)

  return Array.from(new Set(matched.filter(Boolean).map(String)))
}

export async function notifyEvent(businessId, event) {
  const recipients = await recipientIds(businessId, event.category)
  const business = toObjectId(businessId, 'business')
  return Promise.all(recipients.map(async (recipient) => {
    const existing = await Notification.findOne({ business, recipient, dedupeKey: event.dedupeKey })
    if (existing) {
      existing.type = event.type
      existing.category = event.category
      existing.severity = event.severity || 'info'
      existing.title = event.title
      existing.message = event.message
      existing.relatedEntity = event.relatedEntity || ''
      existing.relatedEntityId = String(event.relatedEntityId || '')
      existing.navigationTarget = event.navigationTarget
      existing.resolvedAt = null
      existing.readAt = null
      existing.dismissedAt = null
      existing.createdAt = new Date()
      await existing.save()
      return existing
    }
    const [created] = await Notification.create([{
      business,
      recipient,
      dedupeKey: event.dedupeKey,
      type: event.type,
      category: event.category,
      severity: event.severity || 'info',
      title: event.title,
      message: event.message,
      relatedEntity: event.relatedEntity || '',
      relatedEntityId: String(event.relatedEntityId || ''),
      navigationTarget: event.navigationTarget,
      resolvedAt: null,
      readAt: null,
      dismissedAt: null,
      createdAt: new Date(),
    }])
    return created
  }))
}

export async function notifyLowStockDecrease(businessId, product, previousStock, newStock, threshold) {
  const isOut = newStock <= 0
  const title = isOut ? `${product.name} is out of stock` : `Low Stock Alert: ${product.name}`
  const message = isOut
    ? `${product.sku || product.name} has run out of stock (0 units remaining).`
    : `${product.sku || product.name} stock decreased from ${previousStock} to ${newStock} units (low stock threshold: ${threshold}).`
  const dedupeKey = `stock:${product._id || product.productId}:dec:${Date.now()}:${newStock}`
  return notifyEvent(businessId, {
    dedupeKey,
    type: isOut ? 'OUT_OF_STOCK' : 'LOW_STOCK',
    category: 'inventory',
    severity: isOut ? 'critical' : 'warning',
    title,
    message,
    relatedEntity: 'Product',
    relatedEntityId: product._id || product.productId,
    navigationTarget: 'Products',
  })
}

async function syncCondition(businessId, condition, active) {
  if (active) {
    await Notification.updateMany(scoped(businessId, { dedupeKey: condition.dedupeKey, resolvedAt: { $ne: null } }), { $set: { resolvedAt: null, dismissedAt: null, readAt: null, createdAt: new Date() } })
    return notifyEvent(businessId, condition)
  }
  return Notification.updateMany(scoped(businessId, { dedupeKey: condition.dedupeKey, resolvedAt: null }), { $set: { resolvedAt: new Date() } })
}

export async function syncOperationalAlerts(businessId) {
  const business = toObjectId(businessId, 'business')
  const today = new Date().toISOString().slice(0, 10)
  const [products, purchaseOrders, salesOrders, paymentRows, receivings, suppliers] = await Promise.all([
    Product.find({ business }).select('name sku currentStock minimumStock reorderPoint reorderLevel'),
    PurchaseOrder.find({ business }).select('orderNumber supplierId supplierName status paymentStatus totalAmount expectedDeliveryDate createdAt'),
    SalesOrder.find({ business, status: 'Completed', paymentStatus: { $ne: 'Paid' } }).select('orderNumber customerName totalAmount createdAt'),
    Payment.aggregate([{ $match: { business } }, { $group: { _id: '$referenceId', paid: { $sum: '$amount' } } }]),
    Receiving.find({ business }).select('items'),
    Supplier.find({ business }).select('paymentTerms status'),
  ])
  const paid = new Map(paymentRows.map((p) => [String(p._id), p.paid]))
  const supplierById = new Map(suppliers.map((s) => [String(s._id), s]))
  const terms = { 'Due on receipt': 0, 'Net 7': 7, 'Net 15': 15, 'Net 30': 30, 'Net 60': 60 }
  const addDays = (date, days) => new Date(new Date(date).getTime() + days * 86400000)

  for (const product of products) {
    const threshold = product.reorderLevel || product.reorderPoint || product.minimumStock || 10
    const currentStock = Number(product.currentStock ?? 0)
    const state = currentStock <= 0 ? 'out' : currentStock <= threshold ? 'low' : null
    for (const kind of ['out', 'low']) {
      await syncCondition(businessId, {
        dedupeKey: `stock:${product._id}:${kind}`,
        type: kind === 'out' ? 'OUT_OF_STOCK' : 'LOW_STOCK',
        category: 'inventory',
        severity: kind === 'out' ? 'critical' : 'warning',
        title: kind === 'out' ? `${product.name} is out of stock` : `${product.name} reached its reorder level`,
        message: `${product.sku} has ${currentStock} units available (reorder level: ${threshold}).`,
        relatedEntity: 'Product',
        relatedEntityId: product._id,
        navigationTarget: 'Products',
      }, state === kind)
    }
  }

  for (const po of purchaseOrders) {
    const supplier = supplierById.get(String(po.supplierId))
    const outstanding = (Number(po.totalAmount) || 0) - (paid.get(String(po._id)) || 0)
    const poDate = po.createdAt || po.created_at || new Date()
    const paymentOverdue = ['Ordered', 'Partially Received', 'Received'].includes(po.status) && supplier?.status !== 'archived' && po.paymentStatus !== 'Paid' && outstanding > 0 && addDays(poDate, terms[supplier?.paymentTerms] ?? 0) < new Date(`${today}T00:00:00Z`)
    await syncCondition(businessId, { dedupeKey: `payment:purchase:${po._id}:overdue`, type: 'PAYMENT_OVERDUE', category: 'payments', severity: 'critical', title: `Supplier payment overdue for ${po.orderNumber}`, message: `${po.supplierName}: ${outstanding.toFixed(2)} remains unpaid.`, relatedEntity: 'PurchaseOrder', relatedEntityId: po._id, navigationTarget: 'Payments' }, paymentOverdue)
    const deliveryLate = /^\d{4}-\d{2}-\d{2}$/.test(po.expectedDeliveryDate) && po.expectedDeliveryDate < today && ['Approved', 'Ordered', 'Partially Received'].includes(po.status)
    await syncCondition(businessId, { dedupeKey: `purchase:${po._id}:delivery-overdue`, type: 'PURCHASE_DELIVERY_OVERDUE', category: 'purchases', severity: 'warning', title: `${po.orderNumber} is past its delivery date`, message: `${po.supplierName} was expected by ${po.expectedDeliveryDate}.`, relatedEntity: 'PurchaseOrder', relatedEntityId: po._id, navigationTarget: 'Purchase Orders' }, deliveryLate)
  }

  for (const so of salesOrders) {
    const outstanding = (Number(so.totalAmount) || 0) - (paid.get(String(so._id)) || 0)
    const soDate = so.createdAt || so.created_at || new Date()
    await syncCondition(businessId, { dedupeKey: `payment:sale:${so._id}:overdue`, type: 'PAYMENT_OVERDUE', category: 'payments', severity: 'warning', title: `Customer payment overdue for ${so.orderNumber}`, message: `${so.customerName}: ${outstanding.toFixed(2)} remains unpaid.`, relatedEntity: 'SalesOrder', relatedEntityId: so._id, navigationTarget: 'Payments' }, outstanding > 0 && addDays(soDate, 14) < new Date(`${today}T00:00:00Z`))
  }

  for (const receiving of receivings) {
    for (const item of (receiving.items || [])) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(item.expiryDate)) continue
      const days = Math.ceil((Date.parse(`${item.expiryDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000)
      await syncCondition(businessId, { dedupeKey: `expiry:${receiving._id}:${item.productId}`, type: days < 0 ? 'PRODUCT_EXPIRED' : 'PRODUCT_NEAR_EXPIRY', category: 'inventory', severity: days < 0 ? 'critical' : 'warning', title: days < 0 ? 'Received stock has expired' : 'Received stock is near expiry', message: `Batch ${item.batchNumber || 'unlabelled'} ${days < 0 ? `expired ${Math.abs(days)} day(s) ago` : `expires in ${days} day(s)`}.`, relatedEntity: 'Product', relatedEntityId: item.productId, navigationTarget: 'Receiving' }, days <= 30)
    }
  }
}

export async function listNotifications(businessId, userId, query = {}) {
  await syncOperationalAlerts(businessId)
  const recipientUuid = toObjectId(userId, 'user')
  const filter = scoped(businessId, { recipient: recipientUuid, dismissedAt: null, resolvedAt: null })
  if (query.unread === 'true') filter.readAt = null
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 30))
  const [docs, unreadCount] = await Promise.all([Notification.find(filter).sort('-createdAt').limit(limit), Notification.countDocuments({ ...filter, readAt: null })])
  const items = docs.map((doc) => {
    const item = doc.toJSON()
    return { ...item, key: item.notificationId || item.id || item._id, secondary: item.message, navTo: item.navigationTarget }
  })
  const highestSeverity = items.find((item) => !item.readAt)?.severity || null
  return { items, unreadCount, badgeCount: unreadCount, hasPing: unreadCount > 0, highestSeverity, generatedAt: new Date().toISOString() }
}

const userFilter = (businessId, userId, id) => scoped(businessId, { _id: toObjectId(id, 'notification'), recipient: toObjectId(userId, 'user') })
export async function markRead(businessId, userId, id) {
  const doc = await Notification.findOneAndUpdate(userFilter(businessId, userId, id), { $set: { readAt: new Date() } }, { returnDocument: 'after' })
  if (!doc) throw ApiError.notFound('Notification not found.')
  return doc.toJSON()
}
export async function markAllRead(businessId, userId) {
  const result = await Notification.updateMany(scoped(businessId, { recipient: toObjectId(userId, 'user'), readAt: null, dismissedAt: null }), { $set: { readAt: new Date() } })
  return { updated: result.modifiedCount }
}
export async function dismiss(businessId, userId, id) {
  const doc = await Notification.findOneAndUpdate(userFilter(businessId, userId, id), { $set: { dismissedAt: new Date(), readAt: new Date() } }, { returnDocument: 'after' })
  if (!doc) throw ApiError.notFound('Notification not found.')
  return { dismissed: true }
}
