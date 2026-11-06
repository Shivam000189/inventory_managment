import { Customer } from '../models/index.js'
import { createCrudService } from './crudService.js'
import { requireFields, assert, isEmail } from '../validators/assert.js'
import { getSupabaseAdmin } from '../config/supabase.js'
import { objectIdToUuid } from '../utils/mongoSupabaseMapper.js'

const base = createCrudService(Customer, {
  searchFields: ['name', 'email', 'phone', 'city'],
  label: 'Customer',
})

const PHONE = /^[+\d][\d\s()-]{6,}$/
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000

/**
 * Automatically purges customer records older than 2 weeks (14 days) from Supabase.
 */
export async function purgeOldCustomers(businessId) {
  try {
    const cutoffIso = new Date(Date.now() - TWO_WEEKS_MS).toISOString()
    const supabase = getSupabaseAdmin()
    let query = supabase.from('customers').delete().lt('created_at', cutoffIso)
    if (businessId) {
      const bUuid = objectIdToUuid(businessId) || businessId
      query = query.eq('business_id', bUuid)
    }
    const { error } = await query
    if (error) {
      console.warn('[customerService] Error auto-purging customers older than 2 weeks:', error.message)
    }
  } catch (err) {
    console.warn('[customerService] Auto-purge exception:', err.message)
  }
}

// Scheduled periodic purge (runs every 6 hours and on startup)
setTimeout(() => {
  purgeOldCustomers().catch(() => {})
}, 5000)
setInterval(() => {
  purgeOldCustomers().catch(() => {})
}, 6 * 60 * 60 * 1000)

function validate(payload, { partial } = {}) {
  if (!partial) requireFields(payload, ['name'])
  if (payload.email) assert(isEmail(payload.email), 'Enter a valid customer email.')
  if (payload.phone) assert(PHONE.test(payload.phone), 'Enter a valid customer phone number.')
}

async function list(businessId, query = {}) {
  // Purge any customers older than 2 weeks first
  await purgeOldCustomers(businessId)

  // Retrieve base results and ensure strictly within 2-week window
  const items = await base.list(businessId, query)
  const cutoffTime = Date.now() - TWO_WEEKS_MS

  if (Array.isArray(items)) {
    return items.filter((item) => {
      const created = item.createdAt ? new Date(item.createdAt).getTime() : 0
      return !created || created >= cutoffTime
    })
  }

  if (items && Array.isArray(items.items)) {
    items.items = items.items.filter((item) => {
      const created = item.createdAt ? new Date(item.createdAt).getTime() : 0
      return !created || created >= cutoffTime
    })
    return items
  }

  return items
}

async function create(businessId, payload) {
  validate(payload)
  return base.create(businessId, payload)
}

async function update(businessId, id, payload) {
  validate(payload, { partial: true })
  return base.update(businessId, id, payload)
}

async function archive(businessId, id) {
  return base.update(businessId, id, { status: 'archived' })
}

export const customerService = { ...base, list, create, update, archive }
