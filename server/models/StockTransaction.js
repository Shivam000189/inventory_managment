import { createSupabaseModel } from './supabaseModel.js'

export const StockTransaction = createSupabaseModel('stock_transactions', {
  idField: 'transactionId',
})
