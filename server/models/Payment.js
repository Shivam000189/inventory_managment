import { createSupabaseModel } from './supabaseModel.js'

export const Payment = createSupabaseModel('payments', {
  idField: 'paymentId',
})
