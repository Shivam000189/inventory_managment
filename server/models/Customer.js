import { createSupabaseModel } from './supabaseModel.js'

export const Customer = createSupabaseModel('customers', {
  idField: 'customerId',
})
