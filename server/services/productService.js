import { Product, Business, StockTransaction } from '../models/index.js'
import { createCrudService } from './crudService.js'
import { requireFields, toNumber, assert, toObjectId } from '../validators/assert.js'
import { resolveBusinessCapabilities } from '../../shared/industryConfig.js'

const base = createCrudService(Product, {
  searchFields: ['name', 'sku', 'category', 'brand'],
  label: 'Product',
})

function normalize(payload) {
  const out = { ...payload }
  if (payload.name !== undefined) out.name = String(payload.name).trim()
  if (payload.sku !== undefined) out.sku = String(payload.sku).trim().toUpperCase()
  if (payload.category !== undefined) out.category = String(payload.category).trim()
  if (payload.stock !== undefined && payload.currentStock === undefined) out.currentStock = payload.stock
  if (payload.reorderLevel !== undefined && payload.minimumStock === undefined) out.minimumStock = payload.reorderLevel
  if (payload.taxRate !== undefined && payload.gstRate === undefined) out.gstRate = payload.taxRate
  if (payload.supplierName !== undefined && payload.supplier === undefined) out.supplier = payload.supplierName
  for (const key of ['purchasePrice', 'sellingPrice', 'wholesalePrice', 'wholesaleMinQuantity', 'gstRate', 'currentStock', 'minimumStock', 'mrp', 'warrantyMonths', 'weight']) {
    if (payload[key] !== undefined && payload[key] !== '') out[key] = toNumber(payload[key], key, { min: 0 })
  }
  for (const key of ['barcode', 'hsnCode', 'brand', 'genericName', 'manufacturer', 'batchNumber', 'model', 'serialNumber', 'imei', 'size', 'color', 'supplier', 'description']) if (payload[key] !== undefined) out[key] = String(payload[key]).trim()
  const isValidId = (id) => typeof id === 'string' && /^[0-9a-fA-F-]{24,36}$/.test(id)
  if (payload.supplierId !== undefined) out.supplierId = isValidId(payload.supplierId) ? payload.supplierId : null
  if (payload.supplier_id !== undefined) out.supplier_id = isValidId(payload.supplier_id) ? payload.supplier_id : null
  for (const key of ['manufacturingDate', 'expiryDate']) if (payload[key] !== undefined) out[key] = payload[key] ? new Date(payload[key]) : null
  return out
}

async function validateConfiguredFields(businessId, payload) {
  const business = await Business.findById(businessId)
  const allowed = new Set(resolveBusinessCapabilities(business?.toJSON() || {}).productFields)
  const ignoredKeys = new Set([
    'productId', 'supplierId', 'supplier_id', 'supplierName', 'id', '_id',
    'active', 'createdAt', 'updatedAt', 'taxRate', 'stock', 'reorderLevel',
    'businessId', 'business_id', 'business', 'unit', 'barcode', 'brand', 'description', 'hsnCode', 'gstRate', 'supplier'
  ])
  for (const key of Object.keys(payload)) {
    if (!allowed.has(key) && !ignoredKeys.has(key)) {
      delete payload[key]
    }
  }
}

async function create(businessId, payload) {
  await validateConfiguredFields(businessId, payload)
  requireFields(payload, ['name', 'sku', 'category', 'sellingPrice'])
  const data = normalize(payload)
  assert(Number.isFinite(data.sellingPrice), 'Selling price is required.')
  const created = await base.create(businessId, data)
  if (data.currentStock > 0) {
    try {
      await StockTransaction.create([{
        business: toObjectId(businessId, 'business'),
        productId: created._id,
        type: 'stock_in',
        quantity: data.currentStock,
        previousStock: 0,
        newStock: data.currentStock,
        reason: 'Opening Stock',
        referenceId: 'OPEN-STOCK',
        createdBy: 'Admin',
      }])
    } catch (txErr) {
      console.warn('Opening stock transaction note:', txErr)
    }
  }
  return created
}

async function update(businessId, id, payload) {
  await validateConfiguredFields(businessId, payload)
  return base.update(businessId, id, normalize(payload))
}

export const productService = { ...base, create, update }
