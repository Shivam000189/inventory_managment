import { createSupabaseModel } from './supabaseModel.js'

export const Return = createSupabaseModel('returns', {
  idField: 'returnId',
})
