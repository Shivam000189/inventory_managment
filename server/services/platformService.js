import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { DEFAULT_ROLES, getIndustryRoles } from '../models/index.js'
import { withTransaction } from '../config/db.js'
import {
  getPlatformOverview,
  listPlatformBusinesses,
  countPlatformBusinesses,
  listPlatformBusinessAdmins,
  countPlatformBusinessAdmins,
} from '../repositories/platformRepository.js'
import { insertPlatformAuditEvent } from './platformAuditService.js'
import { ApiError } from '../utils/ApiError.js'
import { assert, isEmail, toObjectId } from '../validators/assert.js'
import { normalizeConfigValue } from '../shared/industryConfig.js'

const PLATFORM_LIST_MAX_LIMIT = 100
const PLATFORM_LIST_DEFAULT_LIMIT = 20
const VALID_INDUSTRIES = new Set([
  'retail', 'grocery', 'pharmacy', 'electronics', 'clothing',
  'hardware', 'automotive', 'food_beverage', 'books_stationery',
  'furniture', 'medical', 'general', 'other',
])
const BUSINESS_STATUSES = new Set(['active', 'suspended', 'deactivated'])
const ACCOUNT_STATUSES = new Set(['active', 'inactive'])

function assertOnlyKeys(value, allowed, label) {
  const unexpected = Object.keys(value || {}).filter((key) => !allowed.includes(key))
  if (unexpected.length) throw ApiError.badRequest(`Unsupported ${label} field(s): ${unexpected.join(', ')}.`)
}

function parseInteger(raw, name, defaultValue, maximum = Number.MAX_SAFE_INTEGER) {
  if (raw === undefined) return defaultValue
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) {
    throw ApiError.badRequest(`${name} must be a positive whole number.`)
  }
  const value = Number(raw)
  if (!Number.isSafeInteger(value) || value > maximum) {
    throw ApiError.badRequest(`${name} must not exceed ${maximum}.`)
  }
  return value
}

function parseDate(raw, name) {
  if (raw === undefined || raw === '') return null
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw ApiError.badRequest(`${name} must be a valid UTC date in YYYY-MM-DD format.`)
  }
  const date = new Date(`${raw}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) {
    throw ApiError.badRequest(`${name} must be a valid UTC date in YYYY-MM-DD format.`)
  }
  return raw
}

function parseCommonFilters(query, statusValues) {
  const page = parseInteger(query.page, 'page', 1)
  const limit = parseInteger(query.limit, 'limit', PLATFORM_LIST_DEFAULT_LIMIT, PLATFORM_LIST_MAX_LIMIT)
  const q = query.q === undefined ? null : query.q
  if (q !== null && (typeof q !== 'string' || q.length > 120)) {
    throw ApiError.badRequest('search must be a string no longer than 120 characters.')
  }
  const status = query.status === undefined || query.status === '' ? null : query.status
  if (status !== null && (!statusValues.has(status))) {
    throw ApiError.badRequest('Invalid status filter.')
  }
  const createdFrom = parseDate(query.createdFrom, 'createdFrom')
  const createdTo = parseDate(query.createdTo, 'createdTo')
  if (createdFrom && createdTo && createdFrom > createdTo) {
    throw ApiError.badRequest('createdFrom must not be after createdTo.')
  }
  return { page, limit, q: q?.trim() || null, status, createdFrom, createdTo }
}

function buildMeta(page, limit, total) {
  return { page, limit, total, pages: Math.ceil(total / limit) }
}

function safeText(value, field, { required = false, max = 120 } = {}) {
  if (value === undefined || value === null) {
    if (required) throw ApiError.badRequest(`${field} is required.`)
    return ''
  }
  if (typeof value !== 'string') throw ApiError.badRequest(`${field} must be text.`)
  const normalized = value.trim()
  if (required && !normalized) throw ApiError.badRequest(`${field} is required.`)
  if (normalized.length > max) throw ApiError.badRequest(`${field} must be no longer than ${max} characters.`)
  return normalized
}

function normalizeEmail(value, field) {
  const email = safeText(value, field, { required: true, max: 254 }).toLowerCase()
  if (!isEmail(email)) throw ApiError.badRequest(`Enter a valid ${field}.`)
  return email
}

function temporaryPassword() {
  return crypto.randomBytes(36).toString('base64url')
}

function normalizeIndustry(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function formatBusiness(row) {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    businessType: row.business_type,
    phone: row.phone || null,
    email: row.email || null,
    city: row.city || null,
    state: row.state || null,
    country: row.country || null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    businessAdmin: row.admin_id
      ? { id: row.admin_id, name: row.admin_name, email: row.admin_email }
      : null,
  }
}

function formatAdmin(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    createdAt: row.created_at,
    business: row.business_id
      ? { id: row.business_id, name: row.business_name, industry: row.business_industry }
      : null,
  }
}

export async function fetchPlatformOverview() {
  const row = await getPlatformOverview()
  return {
    businesses: {
      total: row.businesses_total,
      active: row.businesses_active,
      suspended: row.businesses_suspended,
      deactivated: row.businesses_deactivated,
      createdThisMonth: row.businesses_this_month,
    },
    businessAdmins: {
      total: row.admins_total,
      active: row.admins_active,
      inactive: row.admins_inactive,
    },
    salespeople: {
      total: row.salespeople_total,
      active: row.salespeople_active,
      pending: row.salespeople_pending,
      inactive: row.salespeople_inactive,
    },
  }
}

export async function fetchPlatformBusinesses(query = {}) {
  assertOnlyKeys(query, ['page', 'limit', 'q', 'status', 'industry', 'createdFrom', 'createdTo'], 'query')
  const filters = parseCommonFilters(query, BUSINESS_STATUSES)
  const industry = query.industry === undefined || query.industry === '' ? null : query.industry
  if (industry !== null && (typeof industry !== 'string' || !VALID_INDUSTRIES.has(industry))) {
    throw ApiError.badRequest('Invalid industry filter.')
  }
  const [rows, total] = await Promise.all([
    listPlatformBusinesses({ ...filters, industry }),
    countPlatformBusinesses({ ...filters, industry }),
  ])
  return { items: rows.map(formatBusiness), meta: buildMeta(filters.page, filters.limit, total) }
}

export async function fetchPlatformBusinessAdmins(query = {}) {
  assertOnlyKeys(query, ['page', 'limit', 'q', 'status', 'industry', 'createdFrom', 'createdTo', 'withoutBusiness'], 'query')
  const filters = parseCommonFilters(query, ACCOUNT_STATUSES)
  const industry = query.industry === undefined || query.industry === '' ? null : query.industry
  if (industry !== null && (typeof industry !== 'string' || !VALID_INDUSTRIES.has(industry))) {
    throw ApiError.badRequest('Invalid industry filter.')
  }
  let withoutBusiness = false
  if (query.withoutBusiness !== undefined) {
    if (!['true', 'false', '1', '0'].includes(query.withoutBusiness)) {
      throw ApiError.badRequest('withoutBusiness must be true or false.')
    }
    withoutBusiness = query.withoutBusiness === 'true' || query.withoutBusiness === '1'
  }
  const queryFilters = { ...filters, industry, withoutBusiness }
  const [rows, total] = await Promise.all([
    listPlatformBusinessAdmins({ ...queryFilters }),
    countPlatformBusinessAdmins(queryFilters),
  ])
  return { items: rows.map(formatAdmin), meta: buildMeta(filters.page, filters.limit, total) }
}

export async function createPlatformBusiness(actor, payload = {}, request, transaction = withTransaction) {
  assertOnlyKeys(payload, [
    'name', 'industry', 'businessType', 'country', 'currency', 'email',
    'phone', 'address', 'city', 'state', 'gstin', 'adminName', 'adminEmail',
  ], 'business')

  const name = safeText(payload.name, 'Business name', { required: true, max: 160 })
  const industry = normalizeIndustry(safeText(payload.industry, 'Industry', { required: true, max: 60 }))
  if (!VALID_INDUSTRIES.has(industry)) throw ApiError.badRequest('Invalid industry.')
  const businessType = normalizeConfigValue(safeText(payload.businessType, 'Business type', { required: true, max: 80 }))
  const country = safeText(payload.country, 'Country', { required: true, max: 100 })
  const currency = safeText(payload.currency, 'Currency', { required: true, max: 3 }).toUpperCase()
  if (!/^[A-Z]{3}$/.test(currency)) throw ApiError.badRequest('Currency must be a three-letter code.')
  const adminName = safeText(payload.adminName, 'Business Admin name', { required: true, max: 120 })
  const adminEmail = normalizeEmail(payload.adminEmail, 'Business Admin email')
  const businessEmail = payload.email ? normalizeEmail(payload.email, 'business email') : ''
  const phone = safeText(payload.phone, 'Phone', { max: 40 })
  const address = safeText(payload.address, 'Address', { max: 240 })
  const city = safeText(payload.city, 'City', { max: 100 })
  const state = safeText(payload.state, 'State', { max: 100 })
  const gstin = safeText(payload.gstin, 'GSTIN', { max: 40 }).toUpperCase()
  const temporary = temporaryPassword()
  const passwordHash = await bcrypt.hash(temporary, 10)
  const adminId = crypto.randomUUID()
  const businessId = crypto.randomUUID()
  const actorId = toObjectId(actor._id || actor.id, 'actor id')

  const result = await transaction(async (client) => {
    const duplicate = await client.query('SELECT id FROM users WHERE lower(email) = $1 FOR UPDATE', [adminEmail])
    if (duplicate.rowCount) throw ApiError.conflict('An account with this email already exists.')

    await client.query(
      `INSERT INTO users
         (id, name, email, password, role, platform_role, status, must_change_password)
       VALUES ($1, $2, $3, $4, 'owner', 'user', 'active', true)`,
      [adminId, adminName, adminEmail, passwordHash],
    )
    await client.query(
      `INSERT INTO businesses
         (id, name, industry, business_type, phone, email, address, city, state,
          country, currency, gstin, owner_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active')`,
      [businessId, name, industry, businessType, phone, businessEmail, address, city, state, country, currency, gstin, adminId],
    )
    await client.query('UPDATE users SET business_id = $1 WHERE id = $2', [businessId, adminId])

    const initialRoles = getIndustryRoles(industry, businessType)
    for (const role of initialRoles) {
      await client.query(
        `INSERT INTO roles (business_id, role_id, name, description, permissions)
         VALUES ($1, $2, $3, $4, $5)`,
        [businessId, role.roleId, role.name, role.description, role.permissions],
      )
    }
    await client.query(
      `INSERT INTO members
         (business_id, account_id, name, email, role_id, status)
       VALUES ($1, $2, $3, $4, 'ROLE-ADMIN', 'active')`,
      [businessId, adminId, adminName, adminEmail],
    )
    const actorData = { actorUserId: actorId, request }
    await insertPlatformAuditEvent(client, {
      ...actorData,
      action: 'business.created',
      targetType: 'business',
      targetId: businessId,
      businessId,
      metadata: { name, industry },
    })
    await insertPlatformAuditEvent(client, {
      ...actorData,
      action: 'business_admin.created',
      targetType: 'user',
      targetId: adminId,
      businessId,
      metadata: { name: adminName, email: adminEmail },
    })
    return {
      business: { id: businessId, name, industry, businessType, status: 'active' },
      businessAdmin: { id: adminId, name: adminName, email: adminEmail, status: 'active', mustChangePassword: true },
    }
  })

  return { ...result, temporaryPassword: temporary }
}

function validateStatus(body, allowed) {
  assertOnlyKeys(body, ['status'], 'status')
  if (!allowed.has(body.status)) throw ApiError.badRequest('Invalid status.')
  return body.status
}

export async function setPlatformBusinessStatus(actor, businessId, body, request, transaction = withTransaction) {
  const status = validateStatus(body, BUSINESS_STATUSES)
  const id = toObjectId(businessId, 'business id')
  const actorId = toObjectId(actor._id || actor.id, 'actor id')
  return transaction(async (client) => {
    const found = await client.query(
      'SELECT id, name, status FROM businesses WHERE id = $1 FOR UPDATE',
      [id],
    )
    if (!found.rowCount) throw ApiError.notFound('Business not found.')
    const business = found.rows[0]
    if (business.status !== status) {
      await client.query(
        `UPDATE businesses
         SET status = $1,
             deactivated_at = CASE WHEN $1 = 'deactivated' THEN NOW() ELSE NULL END,
             deactivated_by = CASE WHEN $1 = 'deactivated' THEN $2::uuid ELSE NULL END,
             updated_at = NOW()
         WHERE id = $3`,
        [status, actorId, id],
      )
      await client.query(
        'UPDATE users SET token_version = token_version + 1 WHERE business_id = $1',
        [id],
      )
      await insertPlatformAuditEvent(client, {
        actorUserId: actorId,
        action: 'business.status_changed',
        targetType: 'business',
        targetId: id,
        businessId: id,
        metadata: { previousStatus: business.status, status },
        request,
      })
    }
    return { id, name: business.name, status }
  })
}

export async function setPlatformBusinessAdminStatus(actor, userId, body, request, transaction = withTransaction) {
  const status = validateStatus(body, ACCOUNT_STATUSES)
  const id = toObjectId(userId, 'user id')
  const actorId = toObjectId(actor._id || actor.id, 'actor id')
  return transaction(async (client) => {
    const found = await client.query(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.platform_role, u.business_id,
              b.owner_id
       FROM users u
       LEFT JOIN businesses b ON b.id = u.business_id
       WHERE u.id = $1
       FOR UPDATE OF u`,
      [id],
    )
    const user = found.rows[0]
    if (!user || user.role === 'team' || user.platform_role !== 'user' || user.owner_id !== id) {
      throw ApiError.notFound('Business Admin not found.')
    }
    if (user.status !== status) {
      if (status === 'inactive' && user.id === actorId) {
        const activeAdmins = await client.query(
          `SELECT COUNT(*)::int AS count FROM users
           WHERE business_id = $1 AND role = 'owner' AND platform_role = 'user' AND status = 'active'`,
          [user.business_id],
        )
        if (activeAdmins.rows[0].count <= 1) {
          throw ApiError.conflict('The last active Business Admin cannot deactivate their own account.')
        }
      }
      await client.query(
        `UPDATE users
         SET status = $1,
             deactivated_at = CASE WHEN $1 = 'inactive' THEN NOW() ELSE NULL END,
             deactivated_by = CASE WHEN $1 = 'inactive' THEN $2::uuid ELSE NULL END,
             token_version = token_version + 1,
             updated_at = NOW()
         WHERE id = $3`,
        [status, actorId, id],
      )
      await client.query(
        `UPDATE members SET status = $1, updated_at = NOW()
         WHERE account_id = $2 AND business_id = $3 AND role_id = 'ROLE-ADMIN'`,
        [status, id, user.business_id],
      )
      await insertPlatformAuditEvent(client, {
        actorUserId: actorId,
        action: 'business_admin.status_changed',
        targetType: 'user',
        targetId: id,
        businessId: user.business_id,
        metadata: { previousStatus: user.status, status },
        request,
      })
    }
    return { id, name: user.name, email: user.email, status }
  })
}
