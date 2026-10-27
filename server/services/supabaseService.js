/**
 * Supabase Service Layer
 * Provides business-scoped CRUD and query utilities for PostgreSQL via Supabase,
 * mirroring the Mongoose service conventions so switching or merging is seamless.
 */

import { getSupabaseAdmin } from '../config/supabase.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * Creates a business-scoped CRUD service for a Supabase table.
 * Matches the API of server/services/crudService.js.
 */
export function createSupabaseCrudService(tableName, { searchFields = [], defaultSort = 'created_at', label = 'Record', idField = 'id' } = {}) {
  const getClient = () => getSupabaseAdmin()

  async function list(businessId, query = {}) {
    const supabase = getClient()
    let builder = supabase.from(tableName).select('*', { count: 'exact' }).eq('business_id', businessId)

    if (query.status && query.status !== 'all') {
      builder = builder.eq('status', query.status)
    }

    if (query.search && searchFields.length > 0) {
      const term = `%${String(query.search).trim()}%`
      const orCondition = searchFields.map((field) => `${field}.ilike.${term}`).join(',')
      builder = builder.or(orCondition)
    }

    // Sort order
    const isDesc = defaultSort.startsWith('-')
    const sortColumn = isDesc ? defaultSort.slice(1) : defaultSort
    builder = builder.order(sortColumn, { ascending: !isDesc })

    // Pagination
    const hasPaging = query.page !== undefined || query.limit !== undefined
    const page = Math.max(1, Number(query.page) || 1)
    const limit = hasPaging ? Math.min(100, Math.max(1, Number(query.limit) || 20)) : 0

    if (limit > 0) {
      const from = (page - 1) * limit
      const to = from + limit - 1
      builder = builder.range(from, to)
    }

    const { data, count, error } = await builder
    if (error) throw new ApiError(500, `Failed to fetch ${tableName}: ${error.message}`)

    const items = (data || []).map((row) => normalizeRow(row, idField))

    if (!hasPaging) return items

    const total = count || 0
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

  async function get(businessId, id) {
    const supabase = getClient()
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('business_id', businessId)
      .eq('id', id)
      .maybeSingle()

    if (error) throw new ApiError(500, `Failed to load ${label}: ${error.message}`)
    if (!data) throw ApiError.notFound(`${label} not found.`)

    return normalizeRow(data, idField)
  }

  async function create(businessId, payload) {
    const supabase = getClient()
    const row = denormalizePayload(payload)
    row.business_id = businessId

    const { data, error } = await supabase
      .from(tableName)
      .insert(row)
      .select()
      .single()

    if (error) throw new ApiError(400, `Failed to create ${label}: ${error.message}`)
    return normalizeRow(data, idField)
  }

  async function update(businessId, id, payload) {
    const supabase = getClient()
    const row = denormalizePayload(payload)
    delete row.business_id
    delete row.id

    const { data, error } = await supabase
      .from(tableName)
      .update(row)
      .eq('business_id', businessId)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) throw new ApiError(400, `Failed to update ${label}: ${error.message}`)
    if (!data) throw ApiError.notFound(`${label} not found.`)

    return normalizeRow(data, idField)
  }

  async function remove(businessId, id) {
    const supabase = getClient()
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('business_id', businessId)
      .eq('id', id)

    if (error) throw new ApiError(400, `Failed to delete ${label}: ${error.message}`)
    return { deleted: true }
  }

  return { list, get, create, update, remove }
}

/**
 * Normalizes PostgreSQL snake_case columns to frontend-friendly properties.
 */
function normalizeRow(row, idField) {
  if (!row) return row
  const normalized = { ...row }
  if (idField && idField !== 'id') {
    normalized[idField] = row.id
  }
  normalized._id = row.id
  if (row.business_id) {
    normalized.business = row.business_id
    normalized.businessId = row.business_id
  }
  return normalized
}

/**
 * Strips client ids and formats payload for database insertion.
 */
function denormalizePayload(payload) {
  const row = { ...payload }
  delete row._id
  delete row.__v
  return row
}
