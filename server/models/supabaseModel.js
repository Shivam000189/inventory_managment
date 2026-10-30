import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from '../config/supabase.js'
import { objectIdToUuid, uuidToObjectId } from '../utils/mongoSupabaseMapper.js'

export const TABLE_COLUMNS = {
  users: new Set([
    'id', 'name', 'email', 'password', 'role', 'business_id',
    'onboarding', 'token_version', 'failed_login_attempts',
    'lock_until', 'reset_password_token_hash', 'reset_password_expires',
    'created_at', 'updated_at',
  ]),
  businesses: new Set([
    'id', 'name', 'industry', 'business_type', 'phone', 'email',
    'address', 'city', 'state', 'country', 'currency', 'gstin',
    'enabled_modules', 'owner_id', 'settings', 'created_at', 'updated_at',
  ]),
  roles: new Set([
    'id', 'business_id', 'role_id', 'name', 'description', 'permissions',
    'created_at', 'updated_at',
  ]),
  members: new Set([
    'id', 'business_id', 'account_id', 'name', 'email', 'role_id', 'status',
    'created_at', 'updated_at',
  ]),
  suppliers: new Set([
    'id', 'business_id', 'supplier_name', 'normalized_name', 'contact_person',
    'phone', 'email', 'address', 'city', 'state', 'tax_number', 'payment_terms',
    'status', 'notes', 'created_at', 'updated_at',
  ]),
  customers: new Set([
    'id', 'business_id', 'name', 'phone', 'email', 'address', 'city', 'state',
    'gstin', 'customer_type', 'credit_limit', 'payment_terms', 'notes', 'status',
    'total_purchases', 'outstanding_balance', 'credit_balance', 'loyalty_points',
    'created_at', 'updated_at',
  ]),
  products: new Set([
    'id', 'business_id', 'name', 'sku', 'category', 'brand', 'generic_name',
    'manufacturer', 'batch_number', 'manufacturing_date', 'expiry_date', 'mrp',
    'model', 'serial_number', 'imei', 'warranty_months', 'size', 'dimensions',
    'material', 'color', 'weight', 'description', 'purchase_price', 'selling_price',
    'wholesale_price', 'wholesale_min_quantity', 'dealer_price', 'barcode',
    'hsn_code', 'gst_rate', 'current_stock', 'non_sellable_stock', 'minimum_stock',
    'reorder_level', 'warehouse', 'rack_location', 'conversion_factor',
    'purchase_unit', 'unit', 'supplier', 'supplier_id', 'variants',
    'created_at', 'updated_at',
  ]),
  product_variants: new Set([
    'id', 'product_id', 'business_id', 'size', 'color', 'sku', 'barcode',
    'selling_price', 'purchase_price', 'current_stock', 'non_sellable_stock',
    'minimum_stock', 'reorder_point', 'target_stock', 'reorder_quantity',
    'preferred_supplier_id', 'replenishment_enabled', 'active', 'rfid_enabled',
    'rfid_identifier', 'created_at', 'updated_at',
  ]),
  colors: new Set([
    'id', 'business_id', 'name', 'normalized_name', 'hex_code', 'status',
    'created_at', 'updated_at',
  ]),
  promotions: new Set([
    'id', 'business_id', 'name', 'type', 'discount_value', 'minimum_quantity',
    'buy_quantity', 'get_quantity', 'product_ids', 'category_names', 'variant_ids',
    'start_date', 'end_date', 'active', 'usage_count', 'discount_granted',
    'created_at', 'updated_at',
  ]),
  coupons: new Set([
    'id', 'business_id', 'code', 'discount_type', 'discount_value',
    'minimum_order_value', 'maximum_discount', 'valid_from', 'valid_until',
    'total_usage_limit', 'per_customer_usage_limit', 'product_ids',
    'category_names', 'variant_ids', 'active', 'usage_count', 'usages',
    'created_at', 'updated_at',
  ]),
  gift_cards: new Set([
    'id', 'business_id', 'code', 'initial_value', 'current_balance',
    'issue_date', 'expiry_date', 'active', 'customer_id', 'customer_name',
    'transactions', 'created_at', 'updated_at',
  ]),
  loyalty_transactions: new Set([
    'id', 'business_id', 'customer_id', 'order_id', 'type', 'points',
    'balance_after', 'processed_by', 'created_at', 'updated_at',
  ]),
  store_credit_transactions: new Set([
    'id', 'business_id', 'customer_id', 'order_id', 'refund_id', 'type',
    'amount', 'balance_after', 'processed_by', 'created_at', 'updated_at',
  ]),
  cashier_shifts: new Set([
    'id', 'business_id', 'cashier_id', 'cashier_name', 'opening_cash',
    'started_at', 'ended_at', 'actual_closing_cash', 'expected_closing_cash',
    'difference', 'cash_in', 'cash_out', 'status', 'closed_by',
    'created_at', 'updated_at',
  ]),
  sales_orders: new Set([
    'id', 'business_id', 'order_number', 'invoice_number', 'channel',
    'billing_type', 'customer_id', 'customer_name', 'customer_snapshot',
    'items', 'subtotal', 'discount', 'tax', 'cgst', 'sgst', 'igst',
    'offer_discount', 'promotion_id', 'promotion_name', 'coupon_code',
    'round_off', 'total_amount', 'status', 'payment_status', 'notes',
    'created_by', 'cashier_id', 'cashier_name', 'amount_paid', 'balance_due',
    'payment_summary', 'cancelled_at', 'refunded_amount', 'returned_value',
    'return_adjustment_amount', 'created_at', 'updated_at',
  ]),
  purchase_orders: new Set([
    'id', 'business_id', 'order_number', 'supplier_id', 'supplier_name',
    'items', 'subtotal', 'discount', 'tax', 'shipping_charges',
    'total_amount', 'status', 'payment_status', 'expected_delivery_date',
    'notes', 'created_by', 'created_at', 'updated_at',
  ]),
  receivings: new Set([
    'id', 'business_id', 'purchase_order_id', 'supplier_id', 'items',
    'received_by', 'notes', 'created_at', 'updated_at',
  ]),
  returns: new Set([
    'id', 'business_id', 'type', 'order_id', 'order_model', 'product_id',
    'variant_id', 'variant_sku', 'variant_size', 'variant_color',
    'product_name', 'product_sku', 'product_variant', 'order_number',
    'customer_id', 'customer_name', 'quantity', 'reason', 'reason_details',
    'condition', 'sold_quantity', 'unit_selling_price', 'line_discount',
    'line_tax', 'return_value', 'outstanding_before', 'outstanding_adjustment',
    'refund_required', 'refund_amount', 'remaining_refund', 'refund_method',
    'refund_status', 'inventory_action', 'status', 'processed_by',
    'completed_at', 'cancelled_at', 'idempotency_key', 'created_at', 'updated_at',
  ]),
  refunds: new Set([
    'id', 'business_id', 'return_id', 'order_id', 'customer_id',
    'customer_name', 'amount', 'method', 'resolved_method', 'allocations',
    'status', 'transaction_reference', 'notes', 'processed_by',
    'processed_at', 'created_at', 'updated_at',
  ]),
  payments: new Set([
    'id', 'business_id', 'type', 'reference_id', 'reference_model',
    'amount', 'payment_method', 'payment_date', 'notes', 'recorded_by',
    'transaction_reference', 'offer_code', 'created_at', 'updated_at',
  ]),
  stock_transactions: new Set([
    'id', 'business_id', 'product_id', 'variant_id', 'variant_sku',
    'variant_size', 'variant_color', 'type', 'quantity', 'previous_stock',
    'new_stock', 'stock_bucket', 'reason', 'reference_id', 'created_by',
    'created_at', 'updated_at',
  ]),
  notifications: new Set([
    'id', 'business_id', 'recipient_id', 'type', 'category', 'severity',
    'title', 'message', 'related_entity', 'related_entity_id',
    'navigation_target', 'dedupe_key', 'read_at', 'dismissed_at',
    'resolved_at', 'created_at', 'updated_at',
  ]),
  product_imports: new Set([
    'id', 'business_id', 'file_name', 'file_type', 'purchase_reference',
    'variant_mode', 'supplier_id', 'supplier_name', 'imported_by',
    'imported_by_name', 'status', 'total_rows', 'created_count',
    'updated_count', 'merged_count', 'skipped_count', 'failed_count',
    'failures', 'created_at', 'updated_at',
  ]),
}

function snakeToCamel(str) {
  if (typeof str !== 'string') return str
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase())
}

function camelToSnake(str) {
  if (typeof str !== 'string') return str
  if (str === '_id' || str === 'id') return 'id'
  if (str === 'business' || str === 'businessId') return 'business_id'
  if (str === 'supplierId') return 'supplier_id'
  if (str === 'customerId') return 'customer_id'
  if (str === 'orderId') return 'order_id'
  if (str === 'productId') return 'product_id'
  if (str === 'variantId') return 'variant_id'
  if (str === 'purchaseOrderId') return 'purchase_order_id'
  if (str === 'cashierId') return 'cashier_id'
  if (str === 'recipient' || str === 'recipientId') return 'recipient_id'
  if (str === 'account' || str === 'accountId') return 'account_id'
  if (str === 'owner' || str === 'ownerId') return 'owner_id'
  if (str === 'createdAt') return 'created_at'
  if (str === 'updatedAt') return 'updated_at'
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/**
 * Normalizes a database row into a document object with both camelCase
 * and snake_case properties, plus MongoDB-compatible _id.
 */
function rowToDocData(row, idField) {
  if (!row || typeof row !== 'object') return row
  const doc = {}

  // 1. Map all columns to camelCase and keep raw snake_case
  for (const [key, val] of Object.entries(row)) {
    const camel = snakeToCamel(key)
    doc[camel] = val
    doc[key] = val
  }

  // 2. Consistent ID and Business mapping
  const id = row.id || row._id
  doc._id = id
  doc.id = id
  if (idField && idField !== 'id') {
    doc[idField] = id
  }

  if (row.business_id) {
    doc.business = row.business_id
    doc.businessId = row.business_id
  }

  return doc
}

/**
 * Formats a document object into a database row strictly containing
 * only valid columns for that table.
 */
function docToRowData(doc, tableName) {
  const validCols = TABLE_COLUMNS[tableName]
  const row = {}

  if (validCols) {
    for (const col of validCols) {
      if (col === 'id') {
        const idVal = doc.id !== undefined ? doc.id : (doc._id !== undefined ? doc._id : (doc._model?._idField ? doc[doc._model._idField] : undefined))
        if (idVal !== undefined) row.id = objectIdToUuid(idVal) || idVal
        continue
      }
      if (col === 'business_id') {
        const bVal = doc.business_id !== undefined ? doc.business_id : (doc.businessId !== undefined ? doc.businessId : doc.business)
        if (bVal !== undefined) row.business_id = objectIdToUuid(bVal) || bVal
        continue
      }
      if (col === 'owner_id') {
        const oVal = doc.owner_id !== undefined ? doc.owner_id : (doc.ownerId !== undefined ? doc.ownerId : doc.owner)
        if (oVal !== undefined) row.owner_id = objectIdToUuid(oVal) || oVal
        continue
      }
      if (col === 'recipient_id') {
        const rVal = doc.recipient_id !== undefined ? doc.recipient_id : (doc.recipientId !== undefined ? doc.recipientId : doc.recipient)
        if (rVal !== undefined) row.recipient_id = objectIdToUuid(rVal) || rVal
        continue
      }
      if (col === 'account_id') {
        const aVal = doc.account_id !== undefined ? doc.account_id : (doc.accountId !== undefined ? doc.accountId : doc.account)
        if (aVal !== undefined) row.account_id = objectIdToUuid(aVal) || aVal
        continue
      }

      const camel = snakeToCamel(col)
      const orig = doc._original || {}
      let val
      if (doc[camel] !== undefined && doc[camel] !== orig[camel]) {
        val = doc[camel]
      } else if (doc[col] !== undefined && doc[col] !== orig[col]) {
        val = doc[col]
      } else if (doc[camel] !== undefined) {
        val = doc[camel]
      } else if (doc[col] !== undefined) {
        val = doc[col]
      }

      if (val !== undefined && typeof val !== 'function') {
        if (col.endsWith('_id')) {
          row[col] = objectIdToUuid(val) || val
        } else {
          row[col] = val
        }
      }
    }
    return row
  }

  for (const [key, val] of Object.entries(doc)) {
    if (key.startsWith('_') && key !== '_id') continue
    if (typeof val === 'function') continue

    // Handle primary key
    if (key === 'id' || key === '_id') {
      row.id = objectIdToUuid(val) || val
      continue
    }

    // Determine snake_case column name
    let snake = camelToSnake(key)
    if (key === 'business' || key === 'businessId') {
      snake = tableName === 'businesses' ? 'id' : 'business_id'
    } else if (key === 'owner' || key === 'ownerId') {
      snake = 'owner_id'
    } else if (key === 'recipient' || key === 'recipientId') {
      snake = 'recipient_id'
    } else if (key === 'account' || key === 'accountId') {
      snake = tableName === 'users' ? 'id' : 'account_id'
    }

    // Strictly skip properties that are not physical columns in this table!
    if (validCols && !validCols.has(snake)) {
      continue
    }

    // Convert foreign key UUIDs if needed
    if (snake.endsWith('_id') || snake === 'id') {
      row[snake] = objectIdToUuid(val) || val
    } else {
      row[snake] = val
    }
  }

  return row
}

export class SupabaseDocument {
  constructor(data, model) {
    this._model = model
    this._original = { ...data }
    Object.assign(this, data)

    // Bind custom model methods
    if (model._methods) {
      for (const [name, fn] of Object.entries(model._methods)) {
        this[name] = fn.bind(this)
      }
    }
  }

  isModified(field) {
    if (!field) return true
    return this[field] !== this._original[field]
  }

  async save(options = {}) {
    // Run pre-save hooks
    if (this._model._preSave) {
      for (const hook of this._model._preSave) {
        await hook.call(this)
      }
    }

    const row = docToRowData(this, this._model._tableName)
    row.updated_at = new Date().toISOString()
    const id = row.id || this.id || this._id

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from(this._model._tableName)
      .update(row)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to update ${this._model._tableName}: ${error.message}`)
    }

    if (data) {
      const refreshed = rowToDocData(data, this._model._idField)
      Object.assign(this, refreshed)
      this._original = { ...refreshed }
    }
    return this
  }

  toJSON() {
    const raw = { ...this }
    delete raw._model
    delete raw._original
    delete raw.__v

    if (this._model._toJSONTransform) {
      return this._model._toJSONTransform(this, raw)
    }

    if (this._model._idField && this._model._idField !== 'id') {
      raw[this._model._idField] = String(raw._id || raw.id)
    }
    if (raw.business != null) {
      raw.businessId = String(raw.business)
    }
    return raw
  }

  toObject() {
    return this.toJSON()
  }
}

export class SupabaseQuery {
  constructor(model, filter = {}, single = false) {
    this._model = model
    this._filter = { ...filter }
    this._single = single
    this._sort = null
    this._limit = null
    this._skip = null
    this._select = null
    this._session = null
    this._lean = false
  }

  sort(sortSpec) {
    this._sort = sortSpec
    return this
  }

  limit(n) {
    this._limit = Number(n)
    return this
  }

  skip(n) {
    this._skip = Number(n)
    return this
  }

  select(fields) {
    this._select = fields
    return this
  }

  lean() {
    this._lean = true
    return this
  }

  session(s) {
    this._session = s
    return this
  }

  populate() {
    return this
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject)
  }

  catch(reject) {
    return this.exec().catch(reject)
  }

  async exec() {
    const supabase = getSupabaseAdmin()
    let query = supabase.from(this._model._tableName).select('*')

    // Apply filters
    for (const [key, value] of Object.entries(this._filter)) {
      if (value === undefined) continue

      if (key === '$or' && Array.isArray(value)) {
        const conditions = []
        for (const item of value) {
          for (const [k, v] of Object.entries(item)) {
            const col = camelToSnake(k)
            if (v instanceof RegExp) {
              const clean = v.source.replace(/\\/g, '').replace(/^\^|\$$/g, '')
              conditions.push(`${col}.ilike.%${clean}%`)
            } else if (v === null) {
              conditions.push(`${col}.is.null`)
            } else {
              const val = (k === 'id' || k === '_id' || k === 'account' || k === 'business') ? objectIdToUuid(v) : v
              conditions.push(`${col}.eq.${val}`)
            }
          }
        }
        if (conditions.length > 0) {
          query = query.or(conditions.join(','))
        }
        continue
      }

      if (key.startsWith('$')) {
        continue
      }

      const col = camelToSnake(key)
      let val = value

      if (key === '_id' || key === 'id' || key === 'business' || key === 'businessId' || key === 'customerId' || key === 'supplierId' || key === 'orderId' || key === 'productId' || key === 'variantId') {
        if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof RegExp)) {
          // nested operator like { $in: [...] } or { $ne: val }
          if (val.$in) {
            val = { $in: val.$in.map(objectIdToUuid) }
          }
          if (val.$ne !== undefined) {
            val = { $ne: objectIdToUuid(val.$ne) }
          }
        } else if (val) {
          val = objectIdToUuid(val)
        }
      }

      if (val === null) {
        query = query.is(col, null)
      } else if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof RegExp)) {
        if (val.$in !== undefined) {
          query = query.in(col, val.$in)
        } else if (val.$ne !== undefined) {
          if (val.$ne === null) {
            query = query.not(col, 'is', null)
          } else {
            query = query.neq(col, val.$ne)
          }
        } else if (val.$gte !== undefined) {
          query = query.gte(col, val.$gte)
          if (val.$lte !== undefined) query = query.lte(col, val.$lte)
        } else if (val.$gt !== undefined) {
          query = query.gt(col, val.$gt)
          if (val.$lt !== undefined) query = query.lt(col, val.$lt)
        } else if (val.$lte !== undefined) {
          query = query.lte(col, val.$lte)
        } else if (val.$lt !== undefined) {
          query = query.lt(col, val.$lt)
        }
      } else if (val instanceof RegExp) {
        const clean = val.source.replace(/\\/g, '').replace(/^\^|\$$/g, '')
        query = query.ilike(col, `%${clean}%`)
      } else {
        query = query.eq(col, val)
      }
    }

    // Apply Sorting
    if (this._sort) {
      if (typeof this._sort === 'string') {
        const parts = this._sort.split(/\s+/).filter(Boolean)
        for (const p of parts) {
          const desc = p.startsWith('-')
          const colName = camelToSnake(desc ? p.slice(1) : p)
          query = query.order(colName, { ascending: !desc })
        }
      } else if (typeof this._sort === 'object') {
        for (const [k, dir] of Object.entries(this._sort)) {
          const colName = camelToSnake(k)
          query = query.order(colName, { ascending: Number(dir) > 0 })
        }
      }
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Pagination
    if (this._skip != null && this._limit != null) {
      query = query.range(this._skip, this._skip + this._limit - 1)
    } else if (this._limit != null) {
      query = query.limit(this._limit)
    }

    if (this._single) {
      const { data, error } = await query.limit(1).maybeSingle()
      if (error) {
        throw new Error(`Failed query on ${this._model._tableName}: ${error.message}`)
      }
      if (!data) return null
      const docData = rowToDocData(data, this._model._idField)
      return this._lean ? docData : new SupabaseDocument(docData, this._model)
    }

    const { data, error } = await query
    if (error) {
      throw new Error(`Failed query on ${this._model._tableName}: ${error.message}`)
    }

    const docs = (data || []).map((row) => {
      const docData = rowToDocData(row, this._model._idField)
      return this._lean ? docData : new SupabaseDocument(docData, this._model)
    })
    return docs
  }
}

/**
 * Creates a Model connected directly to Supabase PostgreSQL.
 * Provides the complete Mongoose API: find, findOne, findById, create,
 * updateOne, updateMany, findOneAndUpdate, countDocuments, aggregate, etc.
 */
export function createSupabaseModel(tableName, { idField = 'id', methods = {}, statics = {}, preSave = [], toJSONTransform = null } = {}) {
  class Model {
    constructor(data) {
      const normalized = { ...data }
      if (!normalized.id && !normalized._id) {
        normalized.id = crypto.randomUUID()
        normalized._id = normalized.id
      }
      return new SupabaseDocument(normalized, Model)
    }

    static _tableName = tableName
    static _idField = idField
    static _methods = methods
    static _statics = statics
    static _preSave = preSave
    static _toJSONTransform = toJSONTransform

    static find(filter = {}) {
      return new SupabaseQuery(Model, filter, false)
    }

    static findOne(filter = {}) {
      return new SupabaseQuery(Model, filter, true)
    }

    static findById(id) {
      const uuid = objectIdToUuid(id) || id
      return new SupabaseQuery(Model, { id: uuid }, true)
    }

    static async create(payload, options = {}) {
      const isArray = Array.isArray(payload)
      const items = isArray ? payload : [payload]
      const rows = []

      for (const item of items) {
        const doc = { ...item }
        if (!doc.id && !doc._id) {
          doc.id = crypto.randomUUID()
          doc._id = doc.id
        }

        // Run pre-save hooks (e.g. bcrypt hash for password on User)
        if (preSave.length > 0) {
          for (const hook of preSave) {
            await hook.call(doc)
          }
        }

        const row = docToRowData(doc, tableName)
        if (!row.created_at) row.created_at = new Date().toISOString()
        if (!row.updated_at) row.updated_at = new Date().toISOString()
        rows.push(row)
      }

      const supabase = getSupabaseAdmin()
      const { data, error } = await supabase
        .from(tableName)
        .insert(rows)
        .select()

      if (error) {
        const err = new Error(`Failed to create ${tableName}: ${error.message}`)
        err.code = error.code
        err.detail = error.details || error.message
        throw err
      }

      const createdDocs = (data || []).map((row) => {
        const docData = rowToDocData(row, idField)
        return new SupabaseDocument(docData, Model)
      })

      return isArray ? createdDocs : createdDocs[0]
    }

    static async insertMany(items, options = {}) {
      return Model.create(items, options)
    }

    static exists(filter) {
      const query = Model.findOne(filter)
      const promise = query.exec().then((doc) => (doc ? { _id: doc._id, id: doc.id } : null))
      promise.session = function () {
        return this
      }
      return promise
    }

    static async bulkWrite(operations = [], options = {}) {
      let insertedCount = 0
      let matchedCount = 0
      let modifiedCount = 0
      let deletedCount = 0
      let upsertedCount = 0

      for (const op of operations) {
        if (op.insertOne?.document) {
          await Model.create(op.insertOne.document)
          insertedCount += 1
        } else if (op.updateOne) {
          const { filter, update, upsert } = op.updateOne
          const existing = await Model.findOne(filter)
          if (existing) {
            const changes = update.$set ? { ...update.$set } : { ...update }
            if (update.$inc) {
              for (const [k, v] of Object.entries(update.$inc)) {
                changes[k] = (Number(existing[k]) || 0) + Number(v)
              }
            }
            Object.assign(existing, changes)
            await existing.save()
            matchedCount += 1
            modifiedCount += 1
          } else if (upsert) {
            const initial = {
              ...(update.$setOnInsert || {}),
              ...(update.$set || {}),
              ...filter,
            }
            await Model.create(initial)
            upsertedCount += 1
          }
        } else if (op.deleteOne) {
          const res = await Model.deleteOne(op.deleteOne.filter)
          deletedCount += res.deletedCount || 0
        }
      }

      return {
        ok: 1,
        insertedCount,
        matchedCount,
        modifiedCount,
        deletedCount,
        upsertedCount,
      }
    }

    static async updateOne(filter = {}, update = {}, options = {}) {
      const doc = await Model.findOne(filter)
      if (!doc) return { matchedCount: 0, modifiedCount: 0 }

      const changes = update.$set ? { ...update.$set } : { ...update }
      delete changes.$inc
      delete changes.$push

      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) {
          changes[k] = (Number(doc[k]) || 0) + Number(v)
        }
      }

      Object.assign(doc, changes)
      await doc.save()
      return { matchedCount: 1, modifiedCount: 1, acknowledged: true }
    }

    static async updateMany(filter = {}, update = {}, options = {}) {
      const docs = await Model.find(filter)
      for (const doc of docs) {
        const changes = update.$set ? { ...update.$set } : { ...update }
        if (update.$inc) {
          for (const [k, v] of Object.entries(update.$inc)) {
            changes[k] = (Number(doc[k]) || 0) + Number(v)
          }
        }
        Object.assign(doc, changes)
        await doc.save()
      }
      return { matchedCount: docs.length, modifiedCount: docs.length, acknowledged: true }
    }

    static async findOneAndUpdate(filter = {}, update = {}, options = {}) {
      const doc = await Model.findOne(filter)
      if (!doc) return null

      const changes = update.$set ? { ...update.$set } : { ...update }
      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) {
          changes[k] = (Number(doc[k]) || 0) + Number(v)
        }
      }

      Object.assign(doc, changes)
      await doc.save()
      return doc
    }

    static async findByIdAndUpdate(id, update = {}, options = {}) {
      return Model.findOneAndUpdate({ id: objectIdToUuid(id) || id }, update, options)
    }

    static async deleteOne(filter = {}) {
      const doc = await Model.findOne(filter)
      if (!doc) return { deletedCount: 0 }

      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from(tableName).delete().eq('id', doc.id)
      if (error) throw new Error(`Failed to delete from ${tableName}: ${error.message}`)
      return { deletedCount: 1 }
    }

    static async deleteMany(filter = {}) {
      const docs = await Model.find(filter)
      if (!docs.length) return { deletedCount: 0 }

      const ids = docs.map((d) => d.id)
      const supabase = getSupabaseAdmin()
      const { error } = await supabase.from(tableName).delete().in('id', ids)
      if (error) throw new Error(`Failed to delete many from ${tableName}: ${error.message}`)
      return { deletedCount: docs.length }
    }

    static async findOneAndDelete(filter = {}) {
      const doc = await Model.findOne(filter)
      if (!doc) return null
      await Model.deleteOne({ id: doc.id })
      return doc
    }

    static async findByIdAndDelete(id) {
      return Model.findOneAndDelete({ id: objectIdToUuid(id) || id })
    }

    static async countDocuments(filter = {}) {
      const supabase = getSupabaseAdmin()
      let query = supabase.from(tableName).select('id', { count: 'exact', head: true })

      for (const [key, value] of Object.entries(filter)) {
        if (value === undefined) continue
        const col = camelToSnake(key)
        let val = value
        if (key === '_id' || key === 'id' || key === 'business' || key === 'businessId') {
          val = objectIdToUuid(val) || val
        }

        if (val === null) {
          query = query.is(col, null)
        } else if (typeof val === 'object' && !Array.isArray(val)) {
          if (val.$ne !== undefined) {
            query = val.$ne === null ? query.not(col, 'is', null) : query.neq(col, val.$ne)
          } else if (val.$in !== undefined) {
            query = query.in(col, val.$in)
          }
        } else {
          query = query.eq(col, val)
        }
      }

      const { count, error } = await query
      if (error) throw new Error(`Failed count on ${tableName}: ${error.message}`)
      return count || 0
    }

    static async distinct(field, filter = {}) {
      const docs = await Model.find(filter)
      const set = new Set()
      for (const doc of docs) {
        const val = doc[field]
        if (val != null && val !== '') set.add(val)
      }
      return Array.from(set)
    }

    static async aggregate(pipeline = []) {
      const docs = await Model.find({})
      let result = docs.map((d) => (d.toJSON ? d.toJSON() : d))

      for (const stage of pipeline) {
        if (stage.$match) {
          result = result.filter((d) => {
            for (const [k, v] of Object.entries(stage.$match)) {
              if (v && typeof v === 'object' && v.$in) {
                const inVals = v.$in.map(String)
                if (!inVals.includes(String(d[k]))) return false
              } else if (v && typeof v === 'object' && v.$ne !== undefined) {
                if (String(d[k] || '') === String(v.$ne || '')) return false
              } else if (v && typeof v === 'object' && v.$type === 'string') {
                if (typeof d[k] !== 'string') return false
              } else if (v !== undefined && String(d[k]) !== String(v)) {
                return false
              }
            }
            return true
          })
        }

        if (stage.$group) {
          const groups = new Map()
          const idSpec = stage.$group._id

          for (const d of result) {
            let key = idSpec
            if (typeof idSpec === 'string' && idSpec.startsWith('$')) {
              key = d[idSpec.slice(1)]
            } else if (typeof idSpec === 'object' && idSpec?.$toLower) {
              const input = idSpec.$toLower?.$trim?.input || idSpec.$toLower
              const val = typeof input === 'string' && input.startsWith('$') ? d[input.slice(1)] : input
              key = String(val || '').trim().toLowerCase()
            }
            key = String(key ?? '')

            if (!groups.has(key)) {
              groups.set(key, { _id: key })
            }
            const group = groups.get(key)

            for (const [outField, acc] of Object.entries(stage.$group)) {
              if (outField === '_id') continue
              if (acc.$sum) {
                const val = typeof acc.$sum === 'string' && acc.$sum.startsWith('$') ? Number(d[acc.$sum.slice(1)] || 0) : Number(acc.$sum || 0)
                group[outField] = (group[outField] || 0) + val
              }
              if (acc.$push) {
                if (!group[outField]) group[outField] = []
                const pushed = {}
                for (const [pk, pv] of Object.entries(acc.$push)) {
                  let fieldVal = pv
                  if (typeof pv === 'string' && pv.startsWith('$')) {
                    fieldVal = d[pv.slice(1)]
                  } else if (typeof pv === 'object' && pv?.$toString) {
                    const raw = pv.$toString.startsWith('$') ? d[pv.$toString.slice(1)] : pv.$toString
                    fieldVal = String(raw || '')
                  }
                  pushed[pk] = fieldVal
                }
                group[outField].push(pushed)
              }
            }
          }
          result = Array.from(groups.values())
        }
      }

      // Chainable session/promise support
      result.session = function () {
        return this
      }
      return result
    }
  }

  // Attach statics
  for (const [name, fn] of Object.entries(statics)) {
    Model[name] = fn.bind(Model)
  }

  return Model
}
