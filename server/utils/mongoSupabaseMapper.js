/**
 * Utility functions for transforming documents between MongoDB and Supabase / PostgreSQL.
 * Provides deterministic UUID mapping for MongoDB ObjectIds so all foreign keys are
 * preserved perfectly across migrations.
 */

/**
 * Deterministically transforms a 24-hex-character MongoDB ObjectId into a valid UUID string.
 * Example: '507f1f77bcf86cd799439011' -> '00000000-507f-1f77-bcf8-6cd799439011'
 */
export function objectIdToUuid(mongoId) {
  if (!mongoId) return null
  const hex = String(mongoId._id || mongoId).toLowerCase().replace(/[^0-9a-f]/g, '')
  if (hex.length === 24) {
    return `00000000-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 24)}`
  }
  // If it's already a 32-char UUID without dashes
  if (hex.length === 32) {
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
  }
  return String(mongoId)
}

/**
 * Reverses a deterministic UUID back to the original 24-character ObjectId string.
 */
export function uuidToObjectId(uuid) {
  if (!uuid) return null
  const raw = String(uuid).toLowerCase().replace(/-/g, '')
  if (raw.startsWith('00000000') && raw.length === 32) {
    return raw.slice(8)
  }
  return uuid
}

export function toIsoDate(val) {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export function toNumber(val, fallback = 0) {
  const n = Number(val)
  return isNaN(n) ? fallback : n
}

// -----------------------------------------------------------------------------
// Entity Mappers (MongoDB -> Supabase Table Row)
// -----------------------------------------------------------------------------

export function mapUserToSupabase(u) {
  return {
    id: objectIdToUuid(u._id),
    name: u.name || '',
    email: (u.email || '').toLowerCase().trim(),
    password: u.password,
    role: u.role || 'owner',
    business_id: objectIdToUuid(u.business),
    onboarding: u.onboarding || null,
    token_version: u.tokenVersion || 0,
    failed_login_attempts: u.failedLoginAttempts || 0,
    lock_until: toIsoDate(u.lockUntil),
    reset_password_token_hash: u.resetPasswordTokenHash || null,
    reset_password_expires: toIsoDate(u.resetPasswordExpires),
    created_at: toIsoDate(u.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(u.updatedAt) || new Date().toISOString(),
  }
}

export function mapBusinessToSupabase(b) {
  return {
    id: objectIdToUuid(b._id),
    name: b.name,
    industry: b.industry,
    business_type: b.businessType,
    phone: b.phone || '',
    email: b.email || '',
    address: b.address || '',
    city: b.city || '',
    state: b.state || '',
    country: b.country || 'India',
    currency: b.currency || 'INR',
    gstin: b.gstin || '',
    enabled_modules: Array.isArray(b.enabledModules) ? b.enabledModules : [],
    owner_id: objectIdToUuid(b.owner),
    settings: b.settings || {},
    created_at: toIsoDate(b.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(b.updatedAt) || new Date().toISOString(),
  }
}

export function mapRoleToSupabase(r) {
  return {
    id: objectIdToUuid(r._id),
    business_id: objectIdToUuid(r.business),
    role_id: r.roleId,
    name: r.name,
    description: r.description || '',
    permissions: Array.isArray(r.permissions) ? r.permissions : [],
    created_at: toIsoDate(r.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(r.updatedAt) || new Date().toISOString(),
  }
}

export function mapMemberToSupabase(m) {
  return {
    id: objectIdToUuid(m._id),
    business_id: objectIdToUuid(m.business),
    account_id: objectIdToUuid(m.account),
    name: m.name,
    email: (m.email || '').toLowerCase().trim(),
    role_id: m.roleId || 'ROLE-STAFF',
    status: m.status || 'pending',
    created_at: toIsoDate(m.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(m.updatedAt) || new Date().toISOString(),
  }
}

export function mapSupplierToSupabase(s) {
  return {
    id: objectIdToUuid(s._id),
    business_id: objectIdToUuid(s.business),
    supplier_name: s.supplierName,
    normalized_name: s.normalizedName || (s.supplierName || '').trim().toLowerCase(),
    contact_person: s.contactPerson || '',
    phone: s.phone || '',
    email: s.email || '',
    address: s.address || '',
    city: s.city || '',
    state: s.state || '',
    tax_number: s.taxNumber || '',
    payment_terms: s.paymentTerms || 'Due on receipt',
    status: s.status || 'active',
    notes: s.notes || '',
    created_at: toIsoDate(s.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(s.updatedAt) || new Date().toISOString(),
  }
}

export function mapCustomerToSupabase(c) {
  return {
    id: objectIdToUuid(c._id),
    business_id: objectIdToUuid(c.business),
    name: c.name,
    phone: c.phone || '',
    email: c.email || '',
    address: c.address || '',
    city: c.city || '',
    state: c.state || '',
    gstin: c.gstin || '',
    customer_type: c.customerType || 'retail',
    credit_limit: toNumber(c.creditLimit, 0),
    payment_terms: c.paymentTerms || 'Due on receipt',
    notes: c.notes || '',
    status: c.status || 'active',
    total_purchases: toNumber(c.totalPurchases, 0),
    outstanding_balance: toNumber(c.outstandingBalance, 0),
    credit_balance: toNumber(c.creditBalance, 0),
    loyalty_points: toNumber(c.loyaltyPoints, 0),
    created_at: toIsoDate(c.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(c.updatedAt) || new Date().toISOString(),
  }
}

export function mapProductToSupabase(p) {
  const variants = Array.isArray(p.variants) ? p.variants.map((v) => ({
    ...v,
    id: objectIdToUuid(v._id),
    preferredSupplierId: objectIdToUuid(v.preferredSupplierId),
  })) : []

  return {
    id: objectIdToUuid(p._id),
    business_id: objectIdToUuid(p.business),
    name: p.name,
    sku: p.sku,
    category: p.category,
    brand: p.brand || '',
    generic_name: p.genericName || '',
    manufacturer: p.manufacturer || '',
    batch_number: p.batchNumber || '',
    manufacturing_date: toIsoDate(p.manufacturingDate),
    expiry_date: toIsoDate(p.expiryDate),
    mrp: toNumber(p.mrp, 0),
    model: p.model || '',
    serial_number: p.serialNumber || '',
    imei: p.imei || '',
    warranty_months: toNumber(p.warrantyMonths, 0),
    size: p.size || '',
    dimensions: p.dimensions || '',
    material: p.material || '',
    color: p.color || '',
    weight: toNumber(p.weight, 0),
    description: p.description || '',
    purchase_price: toNumber(p.purchasePrice, 0),
    selling_price: toNumber(p.sellingPrice, 0),
    wholesale_price: toNumber(p.wholesalePrice, 0),
    wholesale_min_quantity: toNumber(p.wholesaleMinQuantity, 10),
    dealer_price: toNumber(p.dealerPrice, 0),
    barcode: p.barcode || '',
    hsn_code: p.hsnCode || '',
    gst_rate: toNumber(p.gstRate, 0),
    current_stock: toNumber(p.currentStock, 0),
    non_sellable_stock: p.nonSellableStock || { damaged: 0, defective: 0, openedUsed: 0, other: 0 },
    minimum_stock: toNumber(p.minimumStock, 0),
    reorder_level: toNumber(p.reorderLevel, 0),
    warehouse: p.warehouse || '',
    rack_location: p.rackLocation || '',
    conversion_factor: toNumber(p.conversionFactor, 1),
    purchase_unit: p.purchaseUnit || '',
    unit: p.unit || 'piece',
    supplier: p.supplier || '',
    supplier_id: objectIdToUuid(p.supplierId),
    variants,
    created_at: toIsoDate(p.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(p.updatedAt) || new Date().toISOString(),
  }
}

export function mapProductVariantToSupabase(v, productId, businessId) {
  return {
    id: objectIdToUuid(v._id),
    product_id: objectIdToUuid(productId),
    business_id: objectIdToUuid(businessId),
    size: v.size,
    color: v.color,
    sku: v.sku,
    barcode: v.barcode || '',
    selling_price: v.sellingPrice != null ? toNumber(v.sellingPrice) : null,
    purchase_price: v.purchasePrice != null ? toNumber(v.purchasePrice) : null,
    current_stock: toNumber(v.currentStock, 0),
    non_sellable_stock: v.nonSellableStock || { damaged: 0, defective: 0, openedUsed: 0, other: 0 },
    minimum_stock: toNumber(v.minimumStock, 0),
    reorder_point: toNumber(v.reorderPoint, 0),
    target_stock: toNumber(v.targetStock, 0),
    reorder_quantity: toNumber(v.reorderQuantity, 0),
    preferred_supplier_id: objectIdToUuid(v.preferredSupplierId),
    replenishment_enabled: Boolean(v.replenishmentEnabled),
    active: v.active !== false,
    rfid_enabled: Boolean(v.rfidEnabled),
    rfid_identifier: v.rfidIdentifier || '',
    created_at: toIsoDate(v.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(v.updatedAt) || new Date().toISOString(),
  }
}

export function mapColorToSupabase(c) {
  return {
    id: objectIdToUuid(c._id),
    business_id: objectIdToUuid(c.business),
    name: c.name,
    normalized_name: c.normalizedName || (c.name || '').trim().toLowerCase(),
    hex_code: c.hexCode || '',
    status: c.status || 'active',
    created_at: toIsoDate(c.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(c.updatedAt) || new Date().toISOString(),
  }
}

export function mapPromotionToSupabase(p) {
  return {
    id: objectIdToUuid(p._id),
    business_id: objectIdToUuid(p.business),
    name: p.name,
    type: p.type,
    discount_value: toNumber(p.discountValue, 0),
    minimum_quantity: toNumber(p.minimumQuantity, 1),
    buy_quantity: toNumber(p.buyQuantity, 1),
    get_quantity: toNumber(p.getQuantity, 0),
    product_ids: Array.isArray(p.productIds) ? p.productIds.map(objectIdToUuid).filter(Boolean) : [],
    category_names: Array.isArray(p.categoryNames) ? p.categoryNames : [],
    variant_ids: Array.isArray(p.variantIds) ? p.variantIds.map(objectIdToUuid).filter(Boolean) : [],
    start_date: toIsoDate(p.startDate),
    end_date: toIsoDate(p.endDate),
    active: p.active !== false,
    usage_count: toNumber(p.usageCount, 0),
    discount_granted: toNumber(p.discountGranted, 0),
    created_at: toIsoDate(p.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(p.updatedAt) || new Date().toISOString(),
  }
}

export function mapCouponToSupabase(c) {
  const usages = Array.isArray(c.usages) ? c.usages.map((u) => ({
    ...u,
    customerId: objectIdToUuid(u.customerId),
    orderId: objectIdToUuid(u.orderId),
  })) : []

  return {
    id: objectIdToUuid(c._id),
    business_id: objectIdToUuid(c.business),
    code: c.code,
    discount_type: c.discountType,
    discount_value: toNumber(c.discountValue, 0),
    minimum_order_value: toNumber(c.minimumOrderValue, 0),
    maximum_discount: toNumber(c.maximumDiscount, 0),
    valid_from: toIsoDate(c.validFrom),
    valid_until: toIsoDate(c.validUntil),
    total_usage_limit: toNumber(c.totalUsageLimit, 0),
    per_customer_usage_limit: toNumber(c.perCustomerUsageLimit, 0),
    product_ids: Array.isArray(c.productIds) ? c.productIds.map(objectIdToUuid).filter(Boolean) : [],
    category_names: Array.isArray(c.categoryNames) ? c.categoryNames : [],
    variant_ids: Array.isArray(c.variantIds) ? c.variantIds.map(objectIdToUuid).filter(Boolean) : [],
    active: c.active !== false,
    usage_count: toNumber(c.usageCount, 0),
    usages,
    created_at: toIsoDate(c.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(c.updatedAt) || new Date().toISOString(),
  }
}

export function mapGiftCardToSupabase(g) {
  const transactions = Array.isArray(g.transactions) ? g.transactions.map((t) => ({
    ...t,
    orderId: objectIdToUuid(t.orderId),
  })) : []

  return {
    id: objectIdToUuid(g._id),
    business_id: objectIdToUuid(g.business),
    code: g.code,
    initial_value: toNumber(g.initialValue, 0),
    current_balance: toNumber(g.currentBalance, 0),
    issue_date: toIsoDate(g.issueDate) || new Date().toISOString(),
    expiry_date: toIsoDate(g.expiryDate),
    active: g.active !== false,
    customer_id: objectIdToUuid(g.customerId),
    customer_name: g.customerName || '',
    transactions,
    created_at: toIsoDate(g.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(g.updatedAt) || new Date().toISOString(),
  }
}

export function mapLoyaltyTransactionToSupabase(l) {
  return {
    id: objectIdToUuid(l._id),
    business_id: objectIdToUuid(l.business),
    customer_id: objectIdToUuid(l.customerId),
    order_id: objectIdToUuid(l.orderId),
    type: l.type,
    points: toNumber(l.points, 0),
    balance_after: toNumber(l.balanceAfter, 0),
    processed_by: l.processedBy || '',
    created_at: toIsoDate(l.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(l.updatedAt) || new Date().toISOString(),
  }
}

export function mapStoreCreditTransactionToSupabase(s) {
  return {
    id: objectIdToUuid(s._id),
    business_id: objectIdToUuid(s.business),
    customer_id: objectIdToUuid(s.customerId),
    order_id: objectIdToUuid(s.orderId),
    refund_id: objectIdToUuid(s.refundId),
    type: s.type,
    amount: toNumber(s.amount, 0),
    balance_after: toNumber(s.balanceAfter, 0),
    processed_by: s.processedBy || '',
    created_at: toIsoDate(s.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(s.updatedAt) || new Date().toISOString(),
  }
}

export function mapCashierShiftToSupabase(sh) {
  return {
    id: objectIdToUuid(sh._id),
    business_id: objectIdToUuid(sh.business),
    cashier_id: objectIdToUuid(sh.cashierId),
    cashier_name: sh.cashierName || '',
    opening_cash: toNumber(sh.openingCash, 0),
    started_at: toIsoDate(sh.startedAt) || new Date().toISOString(),
    ended_at: toIsoDate(sh.endedAt),
    actual_closing_cash: sh.actualClosingCash != null ? toNumber(sh.actualClosingCash) : null,
    expected_closing_cash: toNumber(sh.expectedClosingCash, 0),
    difference: toNumber(sh.difference, 0),
    cash_in: toNumber(sh.cashIn, 0),
    cash_out: toNumber(sh.cashOut, 0),
    status: sh.status || 'Open',
    closed_by: sh.closedBy || '',
    created_at: toIsoDate(sh.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(sh.updatedAt) || new Date().toISOString(),
  }
}

export function mapSalesOrderToSupabase(o) {
  const items = Array.isArray(o.items) ? o.items.map((it) => ({
    ...it,
    productId: objectIdToUuid(it.productId),
    variantId: objectIdToUuid(it.variantId),
  })) : []

  return {
    id: objectIdToUuid(o._id),
    business_id: objectIdToUuid(o.business),
    order_number: o.orderNumber,
    invoice_number: o.invoiceNumber || '',
    channel: o.channel || 'Order',
    billing_type: o.billingType || 'retail',
    customer_id: objectIdToUuid(o.customerId),
    customer_name: o.customerName || '',
    customer_snapshot: o.customerSnapshot || {},
    items,
    subtotal: toNumber(o.subtotal, 0),
    discount: toNumber(o.discount, 0),
    tax: toNumber(o.tax, 0),
    cgst: toNumber(o.cgst, 0),
    sgst: toNumber(o.sgst, 0),
    igst: toNumber(o.igst, 0),
    offer_discount: toNumber(o.offerDiscount, 0),
    promotion_id: objectIdToUuid(o.promotionId),
    promotion_name: o.promotionName || '',
    coupon_code: o.couponCode || '',
    round_off: toNumber(o.roundOff, 0),
    total_amount: toNumber(o.totalAmount, 0),
    status: o.status || 'Pending',
    payment_status: o.paymentStatus || 'Unpaid',
    notes: o.notes || '',
    created_by: o.createdBy || '',
    cashier_id: objectIdToUuid(o.cashierId),
    cashier_name: o.cashierName || '',
    amount_paid: toNumber(o.amountPaid, 0),
    balance_due: toNumber(o.balanceDue, 0),
    payment_summary: Array.isArray(o.paymentSummary) ? o.paymentSummary : [],
    cancelled_at: toIsoDate(o.cancelledAt),
    refunded_amount: toNumber(o.refundedAmount, 0),
    returned_value: toNumber(o.returnedValue, 0),
    return_adjustment_amount: toNumber(o.returnAdjustmentAmount, 0),
    created_at: toIsoDate(o.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(o.updatedAt) || new Date().toISOString(),
  }
}

export function mapPurchaseOrderToSupabase(po) {
  const items = Array.isArray(po.items) ? po.items.map((it) => ({
    ...it,
    productId: objectIdToUuid(it.productId),
    variantId: objectIdToUuid(it.variantId),
  })) : []

  return {
    id: objectIdToUuid(po._id),
    business_id: objectIdToUuid(po.business),
    order_number: po.orderNumber,
    supplier_id: objectIdToUuid(po.supplierId),
    supplier_name: po.supplierName || '',
    items,
    subtotal: toNumber(po.subtotal, 0),
    discount: toNumber(po.discount, 0),
    tax: toNumber(po.tax, 0),
    shipping_charges: toNumber(po.shippingCharges, 0),
    total_amount: toNumber(po.totalAmount, 0),
    status: po.status || 'Draft',
    payment_status: po.paymentStatus || 'Unpaid',
    expected_delivery_date: po.expectedDeliveryDate || '',
    notes: po.notes || '',
    created_by: po.createdBy || '',
    created_at: toIsoDate(po.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(po.updatedAt) || new Date().toISOString(),
  }
}

export function mapReceivingToSupabase(rc) {
  const items = Array.isArray(rc.items) ? rc.items.map((it) => ({
    ...it,
    productId: objectIdToUuid(it.productId),
    variantId: objectIdToUuid(it.variantId),
  })) : []

  return {
    id: objectIdToUuid(rc._id),
    business_id: objectIdToUuid(rc.business),
    purchase_order_id: objectIdToUuid(rc.purchaseOrderId),
    supplier_id: objectIdToUuid(rc.supplierId),
    items,
    received_by: rc.receivedBy || '',
    notes: rc.notes || '',
    created_at: toIsoDate(rc.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(rc.updatedAt) || new Date().toISOString(),
  }
}

export function mapReturnToSupabase(rt) {
  return {
    id: objectIdToUuid(rt._id),
    business_id: objectIdToUuid(rt.business),
    type: rt.type,
    order_id: objectIdToUuid(rt.orderId),
    order_model: rt.orderModel,
    product_id: objectIdToUuid(rt.productId),
    variant_id: objectIdToUuid(rt.variantId),
    variant_sku: rt.variantSku || '',
    variant_size: rt.variantSize || '',
    variant_color: rt.variantColor || '',
    product_name: rt.productName || '',
    product_sku: rt.productSku || '',
    product_variant: rt.productVariant || '',
    order_number: rt.orderNumber || '',
    customer_id: objectIdToUuid(rt.customerId),
    customer_name: rt.customerName || '',
    quantity: toNumber(rt.quantity, 1),
    reason: rt.reason || 'Other',
    reason_details: rt.reasonDetails || '',
    condition: rt.condition || 'Sellable',
    sold_quantity: toNumber(rt.soldQuantity, 0),
    unit_selling_price: toNumber(rt.unitSellingPrice, 0),
    line_discount: toNumber(rt.lineDiscount, 0),
    line_tax: toNumber(rt.lineTax, 0),
    return_value: toNumber(rt.returnValue, 0),
    outstanding_before: toNumber(rt.outstandingBefore, 0),
    outstanding_adjustment: toNumber(rt.outstandingAdjustment, 0),
    refund_required: toNumber(rt.refundRequired, 0),
    refund_amount: toNumber(rt.refundAmount, 0),
    remaining_refund: toNumber(rt.remainingRefund, 0),
    refund_method: rt.refundMethod || '',
    refund_status: rt.refundStatus || 'Not Required',
    inventory_action: rt.inventoryAction || 'sellable',
    status: rt.status || 'Completed',
    processed_by: rt.processedBy || '',
    completed_at: toIsoDate(rt.completedAt),
    cancelled_at: toIsoDate(rt.cancelledAt),
    idempotency_key: rt.idempotencyKey || '',
    created_at: toIsoDate(rt.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(rt.updatedAt) || new Date().toISOString(),
  }
}

export function mapRefundToSupabase(rf) {
  return {
    id: objectIdToUuid(rf._id),
    business_id: objectIdToUuid(rf.business),
    return_id: objectIdToUuid(rf.returnId),
    order_id: objectIdToUuid(rf.orderId),
    customer_id: objectIdToUuid(rf.customerId),
    customer_name: rf.customerName || '',
    amount: toNumber(rf.amount, 0),
    method: rf.method,
    resolved_method: rf.resolvedMethod || '',
    allocations: Array.isArray(rf.allocations) ? rf.allocations : [],
    status: rf.status || 'Pending',
    transaction_reference: rf.transactionReference || '',
    notes: rf.notes || '',
    processed_by: rf.processedBy || '',
    processed_at: toIsoDate(rf.processedAt),
    created_at: toIsoDate(rf.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(rf.updatedAt) || new Date().toISOString(),
  }
}

export function mapPaymentToSupabase(p) {
  return {
    id: objectIdToUuid(p._id),
    business_id: objectIdToUuid(p.business),
    type: p.type,
    reference_id: objectIdToUuid(p.referenceId),
    reference_model: p.referenceModel,
    amount: toNumber(p.amount, 0),
    payment_method: p.paymentMethod || 'Cash',
    payment_date: p.paymentDate || '',
    notes: p.notes || '',
    recorded_by: p.recordedBy || '',
    transaction_reference: p.transactionReference || '',
    offer_code: p.offerCode || '',
    created_at: toIsoDate(p.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(p.updatedAt) || new Date().toISOString(),
  }
}

export function mapStockTransactionToSupabase(st) {
  return {
    id: objectIdToUuid(st._id),
    business_id: objectIdToUuid(st.business),
    product_id: objectIdToUuid(st.productId),
    variant_id: objectIdToUuid(st.variantId),
    variant_sku: st.variantSku || '',
    variant_size: st.variantSize || '',
    variant_color: st.variantColor || '',
    type: st.type,
    quantity: toNumber(st.quantity, 0),
    previous_stock: toNumber(st.previousStock, 0),
    new_stock: toNumber(st.newStock, 0),
    stock_bucket: st.stockBucket || '',
    reason: st.reason || '',
    reference_id: st.referenceId || '',
    created_by: st.createdBy || '',
    created_at: toIsoDate(st.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(st.updatedAt) || new Date().toISOString(),
  }
}

export function mapNotificationToSupabase(n) {
  return {
    id: objectIdToUuid(n._id),
    business_id: objectIdToUuid(n.business),
    recipient_id: objectIdToUuid(n.recipient),
    type: n.type,
    category: n.category,
    severity: n.severity || 'info',
    title: n.title,
    message: n.message,
    related_entity: n.relatedEntity || '',
    related_entity_id: n.relatedEntityId || '',
    navigation_target: n.navigationTarget,
    dedupe_key: n.dedupeKey,
    read_at: toIsoDate(n.readAt),
    dismissed_at: toIsoDate(n.dismissedAt),
    resolved_at: toIsoDate(n.resolvedAt),
    created_at: toIsoDate(n.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(n.updatedAt) || new Date().toISOString(),
  }
}

export function mapProductImportToSupabase(pi) {
  return {
    id: objectIdToUuid(pi._id),
    business_id: objectIdToUuid(pi.business),
    file_name: pi.fileName,
    file_type: pi.fileType,
    purchase_reference: pi.purchaseReference || '',
    variant_mode: Boolean(pi.variantMode),
    supplier_id: objectIdToUuid(pi.supplier),
    supplier_name: pi.supplierName || '',
    imported_by: objectIdToUuid(pi.importedBy),
    imported_by_name: pi.importedByName,
    status: pi.status,
    total_rows: toNumber(pi.totalRows, 0),
    created_count: toNumber(pi.createdCount, 0),
    updated_count: toNumber(pi.updatedCount, 0),
    merged_count: toNumber(pi.mergedCount, 0),
    skipped_count: toNumber(pi.skippedCount, 0),
    failed_count: toNumber(pi.failedCount, 0),
    failures: Array.isArray(pi.failures) ? pi.failures : [],
    created_at: toIsoDate(pi.createdAt) || new Date().toISOString(),
    updated_at: toIsoDate(pi.updatedAt) || new Date().toISOString(),
  }
}
