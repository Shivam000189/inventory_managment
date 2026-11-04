import { Product, StockTransaction } from '../models/index.js'
import { ApiError } from '../utils/ApiError.js'
import { toObjectId, toNumber, assert } from '../validators/assert.js'
import { notifyLowStockDecrease } from './notificationService.js'
import { withTransaction } from '../config/db.js'
import { objectIdToUuid } from '../utils/mongoSupabaseMapper.js'

/** Canonical inventory operations. */
export const ALLOWED_OPERATIONS = Object.freeze(['stock_in', 'stock_out', 'adjustment'])

/**
 * Normalizes operation labels and aliases into canonical enum:
 * 'stock_in' | 'stock_out' | 'adjustment'.
 *
 * Case-insensitive, removes spaces, underscores, and hyphens.
 * Rejects unknown operations with a 400 error.
 */
export function normalizeInventoryOperation(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new ApiError(400, 'Inventory operation is required.')
  }
  const clean = raw.trim().toLowerCase().replace(/[\s\-_]+/g, '_')
  const map = {
    stock_in: 'stock_in',
    stockin: 'stock_in',
    inward: 'stock_in',
    in: 'stock_in',
    receive: 'stock_in',
    receiving: 'stock_in',

    stock_out: 'stock_out',
    stockout: 'stock_out',
    outward: 'stock_out',
    out: 'stock_out',
    dispatch: 'stock_out',
    issue: 'stock_out',

    adjustment: 'adjustment',
    adjustments: 'adjustment',
    adjust: 'adjustment',
    stock_adjustment: 'adjustment',

    // Internal operations
    sales_return: 'sales_return',
    purchase_return: 'purchase_return',
    non_sellable_return: 'non_sellable_return',
  }

  const normalized = map[clean]
  if (!normalized) {
    throw new ApiError(400, `Invalid inventory operation: "${raw}". Allowed operations are: stock_in, stock_out, adjustment.`)
  }
  return normalized
}

/**
 * Maps a normalized operation to its required permission.
 * Never defaults to a permissive permission.
 */
export function permissionForInventoryOperation(raw) {
  const op = normalizeInventoryOperation(raw)
  switch (op) {
    case 'stock_in':
      return 'stock_in'
    case 'stock_out':
      return 'stock_out'
    case 'adjustment':
      return 'edit_product'
    default:
      throw new ApiError(400, `Unknown permission mapping for operation: ${op}`)
  }
}

/**
 * Records a stock movement and updates the product's currentStock atomically
 * inside a PostgreSQL transaction using row-level locking (FOR UPDATE).
 *
 * Guarantees:
 * 1. Product row is locked in PostgreSQL to serialize concurrent updates.
 * 2. Floor / negative stock policy is validated under lock.
 * 3. Atomic update and stock transaction record are committed in the same transaction.
 * 4. Fails with 409 Conflict if stock would go below zero and allowNegative is false.
 */
export async function applyStockChange(
  {
    businessId,
    productId,
    variantId = null,
    type,
    quantity,
    reason = '',
    referenceId = '',
    createdBy = '',
    allowNegative = false,
    batchNumber,
    expiryDate,
    rackLocation,
    warehouse,
    unitCost,
    stockBucket = '',
  },
  session = null,
) {
  const execute = async (txClient) => {
    // Supabase's REST query builder cannot participate in this PostgreSQL
    // transaction, so inventory reads and writes must use its client directly.
    const productResult = await txClient.query(
      `SELECT
         id,
         business_id AS business,
         name,
         sku,
         current_stock AS "currentStock",
         variants,
         minimum_stock AS "minimumStock",
         reorder_level AS "reorderLevel",
         batch_number AS "batchNumber",
         expiry_date AS "expiryDate",
         rack_location AS "rackLocation",
         warehouse,
         purchase_price AS "purchasePrice"
       FROM products
       WHERE business_id = $1 AND id = $2
       FOR UPDATE`,
      [toObjectId(businessId, 'business'), toObjectId(productId, 'product id')],
    )
    const productRow = productResult.rows[0]
    if (!productRow) throw ApiError.notFound('Product not found.')

    const INCREASES = new Set(['stock_in', 'sales_return'])
    const DECREASES = new Set(['stock_out', 'purchase_return', 'non_sellable_return'])

    const variants = Array.isArray(productRow.variants) ? productRow.variants : []
    let variant = null
    let variantUuid = null
    if (variantId) {
      variantUuid = toObjectId(variantId, 'variant id')
      variant = variants.find((v) => objectIdToUuid(v._id || v.id) === variantUuid) || null
      if (!variant) throw ApiError.notFound('Product variant not found.')
    }

    const previousStock = variant ? Number(variant.currentStock) || 0 : Number(productRow.currentStock) || 0
    let newStock

    if (type === 'adjustment') {
      newStock = quantity
    } else if (INCREASES.has(type)) {
      newStock = previousStock + Math.abs(quantity)
    } else if (DECREASES.has(type)) {
      newStock = previousStock - Math.abs(quantity)
    } else {
      throw new ApiError(400, `Unknown stock change type: ${type}`)
    }

    // 2. Validate floor policy under lock
    if (!allowNegative && newStock < 0) {
      const label = variant ? `${productRow.name} (${variant.sku || variant.size || ''})` : productRow.name
      throw new ApiError(409, `Insufficient stock: only ${previousStock} unit(s) available for ${label}.`)
    }

    // 3. Update stock levels and optional metadata on product
    if (variant) {
      variant.currentStock = newStock
      productRow.currentStock = variants.reduce((sum, v) => sum + (Number(v.currentStock) || 0), 0)
    } else {
      productRow.currentStock = newStock
    }

    productRow.batchNumber = batchNumber == null ? productRow.batchNumber : String(batchNumber).trim()
    productRow.expiryDate = expiryDate == null
      ? productRow.expiryDate
      : (expiryDate ? new Date(expiryDate).toISOString() : null)
    productRow.rackLocation = rackLocation == null ? productRow.rackLocation : String(rackLocation).trim()
    productRow.warehouse = warehouse == null ? productRow.warehouse : String(warehouse).trim()
    productRow.purchasePrice = unitCost == null || Number.isNaN(Number(unitCost))
      ? productRow.purchasePrice
      : Number(unitCost)

    const updatedResult = await txClient.query(
      `UPDATE products
       SET current_stock = $1,
           variants = $2::jsonb,
           batch_number = $3,
           expiry_date = $4,
           rack_location = $5,
           warehouse = $6,
           purchase_price = $7,
           updated_at = NOW()
       WHERE business_id = $8 AND id = $9
       RETURNING id, business_id AS business, name, sku,
                 current_stock AS "currentStock", variants,
                 minimum_stock AS "minimumStock", reorder_level AS "reorderLevel",
                 batch_number AS "batchNumber", expiry_date AS "expiryDate",
                 rack_location AS "rackLocation", warehouse,
                 purchase_price AS "purchasePrice"`,
      [
        productRow.currentStock,
        JSON.stringify(variants),
        productRow.batchNumber,
        productRow.expiryDate,
        productRow.rackLocation,
        productRow.warehouse,
        productRow.purchasePrice,
        productRow.business,
        productRow.id,
      ],
    )
    const updatedProduct = updatedResult.rows[0]
    const product = new Product({
      ...updatedProduct,
      currentStock: Number(updatedProduct.currentStock),
      minimumStock: Number(updatedProduct.minimumStock),
      reorderLevel: Number(updatedProduct.reorderLevel),
      _id: updatedProduct.id,
    })

    // 4. Insert matching stock_transaction record in same transaction
    const creatorColumnResult = await txClient.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'stock_transactions'
         AND column_name IN ('created_by', 'createdby')`,
    )
    const creatorColumn = creatorColumnResult.rows.find((row) =>
      row.column_name === 'created_by' || row.column_name === 'createdby',
    )?.column_name
    if (!creatorColumn) throw new Error('stock_transactions is missing its creator column')

    const transactionResult = await txClient.query(
      `INSERT INTO stock_transactions
         (business_id, product_id, variant_id, variant_sku, variant_size,
          variant_color, type, quantity, previous_stock, new_stock,
          stock_bucket, reason, reference_id, ${creatorColumn})
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id, business_id AS business, product_id AS "productId",
                 variant_id AS "variantId", variant_sku AS "variantSku",
                 variant_size AS "variantSize", variant_color AS "variantColor",
                 type, quantity, previous_stock AS "previousStock",
                 new_stock AS "newStock", stock_bucket AS "stockBucket",
                 reason, reference_id AS "referenceId", ${creatorColumn} AS "createdBy",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        product.business,
        product._id,
        variantUuid,
        variant?.sku || '',
        variant?.size || '',
        variant?.color || '',
        type,
        Math.abs(quantity),
        previousStock,
        newStock,
        String(stockBucket || ''),
        String(reason || '').trim(),
        String(referenceId || ''),
        String(createdBy || ''),
      ],
    )
    const transactionRow = transactionResult.rows[0]
    const transaction = new StockTransaction({
      ...transactionRow,
      quantity: Number(transactionRow.quantity),
      previousStock: Number(transactionRow.previousStock),
      newStock: Number(transactionRow.newStock),
      _id: transactionRow.id,
    })

    // 5. Best-effort low stock alert
    const threshold = Number(variant?.reorderPoint || product.reorderLevel || product.minimumStock || 10)
    if (newStock < previousStock && newStock <= threshold) {
      try {
        await notifyLowStockDecrease(businessId, product, previousStock, newStock, threshold)
      } catch (err) {
        console.warn('[Notification] Low stock notification dispatch warning:', err.message)
      }
    }

    return { product, transaction }
  }

  // If already inside an active transaction, execute directly; otherwise wrap in withTransaction
  if (session && typeof session.query === 'function') {
    return execute(session)
  }
  return withTransaction(execute)
}

/** Allowed fields for manual inventory operation submissions. */
const ALLOWED_OP_FIELDS = new Set([
  'section',
  'operation',
  'type',
  'productId',
  'variantId',
  'quantity',
  'reason',
  'referenceId',
  'batchNumber',
  'expiryDate',
  'rackLocation',
  'warehouse',
  'unitCost',
  'purchasePrice',
  'stockBucket',
  'createdBy',
])

/**
 * Manual Stock In / Stock Out / Adjustment from the Inventory screen.
 * Validates metadata and rejects unsupported fields with 400.
 */
export async function recordOperation(businessId, body = {}) {
  // Check for unknown / unsupported fields
  const submittedKeys = Object.keys(body)
  const unknownKeys = submittedKeys.filter((k) => !ALLOWED_OP_FIELDS.has(k))
  if (unknownKeys.length > 0) {
    throw new ApiError(400, `Unsupported field(s) for inventory operation: ${unknownKeys.join(', ')}`)
  }

  const rawType = body.section || body.operation || body.type
  const type = normalizeInventoryOperation(rawType)

  if (!ALLOWED_OPERATIONS.includes(type)) {
    throw new ApiError(400, `Operation "${type}" cannot be performed directly. Allowed: ${ALLOWED_OPERATIONS.join(', ')}`)
  }

  const qty = toNumber(body.quantity, 'Quantity', { min: 0, integer: true })
  assert(!(type !== 'adjustment' && qty === 0), 'Enter a quantity greater than zero.')

  const { product, transaction } = await applyStockChange({
    businessId,
    productId: body.productId,
    variantId: body.variantId,
    type,
    quantity: qty,
    reason: (body.reason || '').trim() || (body.section || type),
    referenceId: body.referenceId,
    createdBy: body.createdBy,
    batchNumber: body.batchNumber,
    expiryDate: body.expiryDate,
    rackLocation: body.rackLocation,
    warehouse: body.warehouse,
    unitCost: body.unitCost !== undefined ? body.unitCost : body.purchasePrice,
    stockBucket: body.stockBucket,
  })

  return { product: product.toJSON(), transaction: transaction.toJSON() }
}

/**
 * List inventory stock movements with deterministic sort and usable pagination.
 * Returns `{ items, meta: { page, limit, total, pages } }`.
 */
export async function listTransactions(businessId, query = {}) {
  const filter = { business: toObjectId(businessId, 'business') }
  if (query.type && query.type !== 'all') {
    filter.type = query.type
  }
  if (query.productId && query.productId !== 'all') {
    filter.productId = toObjectId(query.productId, 'product id')
  }

  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 50))
  const skip = (page - 1) * limit

  const [docs, total] = await Promise.all([
    StockTransaction.find(filter).sort('-createdAt').skip(skip).limit(limit),
    StockTransaction.countDocuments(filter),
  ])

  const items = docs.map((doc) => doc.toJSON())
  return {
    items,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  }
}
