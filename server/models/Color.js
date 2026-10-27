import { createSupabaseModel } from './supabaseModel.js'

export const Color = createSupabaseModel('colors', {
  idField: 'colorId',
})
