import { createSupabaseModel } from './supabaseModel.js'

export const PurchaseOrder = createSupabaseModel('purchase_orders', {
  idField: 'purchaseOrderId',
})
