import { createSupabaseModel } from './supabaseModel.js'

function receivingToJSONTransform(doc, ret) {
  ret.receivingId = String(ret._id || ret.id)
  ret.receivedAt = ret.receivedAt || ret.createdAt || ret.created_at
  delete ret.__v
  return ret
}

export const Receiving = createSupabaseModel('receivings', {
  idField: 'receivingId',
  toJSONTransform: receivingToJSONTransform,
})
