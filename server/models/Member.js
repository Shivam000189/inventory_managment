import { createSupabaseModel } from './supabaseModel.js'

export const Member = createSupabaseModel('members', {
  idField: 'userId',
})
