import { createSupabaseModel } from './supabaseModel.js'

export const ProductImport = createSupabaseModel('product_imports', {
  idField: 'importId',
})
