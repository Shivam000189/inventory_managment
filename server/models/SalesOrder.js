import { createSupabaseModel } from './supabaseModel.js'

export const SalesOrder = createSupabaseModel('sales_orders', {
  idField: 'orderId',
})
