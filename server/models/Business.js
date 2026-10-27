import { createSupabaseModel } from './supabaseModel.js'

export const Business = createSupabaseModel('businesses', {
  idField: 'businessId',
})
