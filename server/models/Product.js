import { createSupabaseModel } from './supabaseModel.js'

export const Product = createSupabaseModel('products', {
  idField: 'productId',
})
