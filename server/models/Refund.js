import { createSupabaseModel } from './supabaseModel.js'

export const Refund = createSupabaseModel('refunds', {
  idField: 'refundId',
})
