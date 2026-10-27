import { createSupabaseModel } from './supabaseModel.js'

function normalizeSupplierHook() {
  this.supplierName = String(this.supplierName || '').trim().replace(/\s+/g, ' ')
  this.normalizedName = this.supplierName.toLocaleLowerCase('en-US')
}

export const Supplier = createSupabaseModel('suppliers', {
  idField: 'supplierId',
  preSave: [normalizeSupplierHook],
})
