import { getPgPool } from '../config/supabase.js'
import { ApiError } from '../utils/ApiError.js'
import { toObjectId, toNumber, assert } from '../validators/assert.js'
import { applyStockChange } from './inventoryService.js'

export async function listBatches(businessId, { productId, status, search, limit = 100 } = {}) {
  const pool = getPgPool()
  const bId = toObjectId(businessId, 'businessId')

  let sql = `
    SELECT 
      b.id,
      b.business_id AS "businessId",
      b.product_id AS "productId",
      p.name AS "productName",
      p.sku AS "productSku",
      p.category,
      p.generic_name AS "genericName",
      p.manufacturer,
      p.unit,
      b.batch_number AS "batchNumber",
      b.manufacturing_date AS "manufacturingDate",
      b.expiry_date AS "expiryDate",
      b.mrp,
      b.purchase_price AS "purchasePrice",
      b.selling_price AS "sellingPrice",
      b.current_stock AS "currentStock",
      b.supplier_id AS "supplierId",
      s.supplier_name AS "supplierName",
      b.notes,
      b.created_at AS "createdAt",
      b.updated_at AS "updatedAt",
      ROUND(EXTRACT(EPOCH FROM (b.expiry_date - NOW())) / 86400) AS "daysUntilExpiry"
    FROM product_batches b
    JOIN products p ON p.id = b.product_id
    LEFT JOIN suppliers s ON s.id = b.supplier_id
    WHERE b.business_id = $1
  `
  const params = [bId]
  let pIdx = 2

  if (productId) {
    sql += ` AND b.product_id = $${pIdx++}`
    params.push(toObjectId(productId, 'productId'))
  }

  if (search && search.trim()) {
    const q = `%${search.trim().toLowerCase()}%`
    sql += ` AND (
      LOWER(b.batch_number) LIKE $${pIdx} OR 
      LOWER(p.name) LIKE $${pIdx} OR 
      LOWER(p.sku) LIKE $${pIdx} OR 
      LOWER(p.generic_name) LIKE $${pIdx} OR
      LOWER(p.manufacturer) LIKE $${pIdx}
    )`
    params.push(q)
    pIdx++
  }

  sql += ` ORDER BY b.expiry_date ASC LIMIT $${pIdx}`
  params.push(Math.min(Number(limit) || 100, 500))

  const res = await pool.query(sql, params)

  return res.rows.map((row) => {
    const days = Number(row.daysUntilExpiry)
    let calculatedStatus = 'active'
    if (Number(row.currentStock) <= 0) {
      calculatedStatus = 'depleted'
    } else if (days < 0) {
      calculatedStatus = 'expired'
    } else if (days <= 30) {
      calculatedStatus = 'critical_expiry'
    } else if (days <= 60) {
      calculatedStatus = 'expiring_soon'
    }

    return {
      ...row,
      mrp: Number(row.mrp || 0),
      purchasePrice: Number(row.purchasePrice || 0),
      sellingPrice: Number(row.sellingPrice || 0),
      currentStock: Number(row.currentStock || 0),
      daysUntilExpiry: days,
      status: calculatedStatus,
    }
  }).filter((b) => {
    if (!status || status === 'all') return true
    if (status === 'active') return b.status === 'active' || b.status === 'expiring_soon'
    if (status === 'expiring_soon') return b.status === 'expiring_soon' || b.status === 'critical_expiry'
    if (status === 'critical_expiry') return b.status === 'critical_expiry'
    if (status === 'expired') return b.status === 'expired'
    if (status === 'depleted') return b.status === 'depleted'
    return true
  })
}

export async function createBatch(businessId, payload, createdBy = '') {
  const pool = getPgPool()
  const bId = toObjectId(businessId, 'businessId')
  const productId = toObjectId(payload.productId, 'productId')
  const batchNumber = String(payload.batchNumber || '').trim()
  assert(batchNumber, 400, 'Batch number is required.')
  assert(payload.expiryDate, 400, 'Expiry date is required.')

  const mrp = toNumber(payload.mrp ?? payload.sellingPrice, 0)
  const purchasePrice = toNumber(payload.purchasePrice, 0)
  const sellingPrice = toNumber(payload.sellingPrice ?? mrp, 0)
  const quantity = toNumber(payload.quantity ?? payload.currentStock, 0)

  // Verify product exists and belongs to business
  const pCheck = await pool.query(
    'SELECT id, name, sku, current_stock FROM products WHERE business_id = $1 AND id = $2',
    [bId, productId],
  )
  if (pCheck.rows.length === 0) throw ApiError.notFound('Medicine not found in catalog.')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const insertSql = `
      INSERT INTO product_batches (
        business_id, product_id, batch_number, manufacturing_date, expiry_date,
        mrp, purchase_price, selling_price, current_stock, supplier_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (business_id, product_id, batch_number)
      DO UPDATE SET
        current_stock = product_batches.current_stock + EXCLUDED.current_stock,
        mrp = EXCLUDED.mrp,
        selling_price = EXCLUDED.selling_price,
        purchase_price = EXCLUDED.purchase_price,
        expiry_date = EXCLUDED.expiry_date,
        manufacturing_date = EXCLUDED.manufacturing_date,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *
    `
    const insertRes = await client.query(insertSql, [
      bId,
      productId,
      batchNumber,
      payload.manufacturingDate || null,
      payload.expiryDate,
      mrp,
      purchasePrice,
      sellingPrice,
      quantity,
      payload.supplierId || null,
      payload.notes || '',
    ])

    // Update product stock and primary batch info if quantity > 0
    if (quantity > 0) {
      await client.query(
        `UPDATE products 
         SET current_stock = current_stock + $1,
             batch_number = COALESCE(NULLIF(batch_number, ''), $2),
             expiry_date = COALESCE(expiry_date, $3),
             mrp = GREATEST(mrp, $4),
             updated_at = NOW()
         WHERE business_id = $5 AND id = $6`,
        [quantity, batchNumber, payload.expiryDate, mrp, bId, productId],
      )

      // Record stock transaction
      await client.query(
        `INSERT INTO stock_transactions (
          business_id, product_id, type, quantity, reason,
          batch_number, expiry_date, unit_cost, created_by
        ) VALUES ($1, $2, 'stock_in', $3, $4, $5, $6, $7, $8)`,
        [
          bId,
          productId,
          quantity,
          `New batch lot ${batchNumber} added`,
          batchNumber,
          payload.expiryDate,
          purchasePrice,
          createdBy || 'system',
        ],
      )
    }

    await client.query('COMMIT')
    return insertRes.rows[0]
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function disposeBatch(businessId, batchId, { quantity, reason = 'Expired medicine disposal' }, user = '') {
  const pool = getPgPool()
  const bId = toObjectId(businessId, 'businessId')
  const batchUuid = toObjectId(batchId, 'batchId')
  const qty = toNumber(quantity, 0)
  assert(qty > 0, 400, 'Disposal quantity must be greater than zero.')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const batchRes = await client.query(
      `SELECT b.*, p.name AS "productName" 
       FROM product_batches b 
       JOIN products p ON p.id = b.product_id 
       WHERE b.business_id = $1 AND b.id = $2 FOR UPDATE`,
      [bId, batchUuid],
    )
    if (batchRes.rows.length === 0) throw ApiError.notFound('Batch lot not found.')
    const batch = batchRes.rows[0]

    if (Number(batch.current_stock) < qty) {
      throw new ApiError(400, `Cannot dispose ${qty} units. Lot only has ${batch.current_stock} units on hand.`)
    }

    await client.query(
      'UPDATE product_batches SET current_stock = current_stock - $1, updated_at = NOW() WHERE id = $2',
      [qty, batchUuid],
    )

    await client.query(
      'UPDATE products SET current_stock = GREATEST(0, current_stock - $1), updated_at = NOW() WHERE id = $2',
      [qty, batch.product_id],
    )

    await client.query(
      `INSERT INTO stock_transactions (
        business_id, product_id, type, quantity, reason,
        batch_number, expiry_date, unit_cost, created_by
      ) VALUES ($1, $2, 'stock_out', $3, $4, $5, $6, $7, $8)`,
      [
        bId,
        batch.product_id,
        -qty,
        reason || `Batch ${batch.batch_number} outward disposal`,
        batch.batch_number,
        batch.expiry_date,
        batch.purchase_price,
        user || 'system',
      ],
    )

    await client.query('COMMIT')
    return { success: true, message: `Disposed ${qty} units from lot ${batch.batch_number}.` }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function getPharmacySummary(businessId) {
  const pool = getPgPool()
  const bId = toObjectId(businessId, 'businessId')

  const res = await pool.query(
    `SELECT 
       COUNT(DISTINCT b.id) AS "totalLots",
       COUNT(DISTINCT b.id) FILTER (WHERE b.current_stock > 0 AND b.expiry_date >= NOW()) AS "activeLots",
       COUNT(DISTINCT b.id) FILTER (WHERE b.current_stock > 0 AND b.expiry_date < NOW()) AS "expiredLots",
       COALESCE(SUM(b.current_stock) FILTER (WHERE b.expiry_date < NOW()), 0) AS "expiredStockUnits",
       COUNT(DISTINCT b.id) FILTER (WHERE b.current_stock > 0 AND b.expiry_date >= NOW() AND b.expiry_date <= NOW() + INTERVAL '30 days') AS "expiring30DaysLots",
       COALESCE(SUM(b.current_stock) FILTER (WHERE b.expiry_date >= NOW() AND b.expiry_date <= NOW() + INTERVAL '30 days'), 0) AS "expiring30DaysUnits",
       COUNT(DISTINCT b.id) FILTER (WHERE b.current_stock > 0 AND b.expiry_date > NOW() + INTERVAL '30 days' AND b.expiry_date <= NOW() + INTERVAL '60 days') AS "expiring60DaysLots",
       COALESCE(SUM(b.current_stock) FILTER (WHERE b.expiry_date > NOW() + INTERVAL '30 days' AND b.expiry_date <= NOW() + INTERVAL '60 days'), 0) AS "expiring60DaysUnits",
       COALESCE(SUM(b.current_stock), 0) AS "totalUnits"
     FROM product_batches b
     WHERE b.business_id = $1`,
    [bId],
  )

  const row = res.rows[0] || {}
  const totalUnits = Number(row.totalUnits || 0)
  const expiredUnits = Number(row.expiredStockUnits || 0)
  const expiring30Units = Number(row.expiring30DaysUnits || 0)
  const expiring60Units = Number(row.expiring60DaysUnits || 0)

  const healthyUnits = Math.max(0, totalUnits - (expiredUnits + expiring30Units + expiring60Units))
  const healthPercent = totalUnits > 0 ? Math.round((healthyUnits / totalUnits) * 100) : 100

  return {
    totalLots: Number(row.totalLots || 0),
    activeLots: Number(row.activeLots || 0),
    expiredLots: Number(row.expiredLots || 0),
    expiredStockUnits: expiredUnits,
    expiring30DaysLots: Number(row.expiring30DaysLots || 0),
    expiring30DaysUnits: expiring30Units,
    expiring60DaysLots: Number(row.expiring60DaysLots || 0),
    expiring60DaysUnits: expiring60Units,
    totalUnits,
    healthyUnits,
    healthMeter: healthPercent,
  }
}
