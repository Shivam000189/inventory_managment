import { createSupabaseModel } from './supabaseModel.js'

export const Notification = createSupabaseModel('notifications', {
  idField: 'notificationId',
})
