import { getPgPool } from '../config/supabase.js'

export function escapeLike(raw) {
  return String(raw).replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

function addDateFilters(where, params, column, createdFrom, createdTo) {
  if (createdFrom) {
    params.push(createdFrom)
    where.push(`${column} >= ($${params.length}::date::timestamp AT TIME ZONE 'UTC')`)
  }
  if (createdTo) {
    params.push(createdTo)
    where.push(`${column} < (($${params.length}::date + 1)::timestamp AT TIME ZONE 'UTC')`)
  }
}

function businessFilters({ q, status, industry, createdFrom, createdTo }) {
  const params = []
  const where = []
  if (q) {
    params.push(`%${escapeLike(q)}%`)
    where.push(`(b.name ILIKE $${params.length} ESCAPE '\\' OR b.email ILIKE $${params.length} ESCAPE '\\' OR u.name ILIKE $${params.length} ESCAPE '\\' OR u.email ILIKE $${params.length} ESCAPE '\\')`)
  }
  if (status) {
    params.push(status)
    where.push(`b.status = $${params.length}`)
  }
  if (industry) {
    params.push(industry)
    where.push(`b.industry = $${params.length}`)
  }
  addDateFilters(where, params, 'b.created_at', createdFrom, createdTo)
  return { params, where }
}

export function buildPlatformBusinessAdminFilters({ q, status, industry, createdFrom, createdTo, withoutBusiness }) {
  const params = []
  const where = [`u.role = 'owner'`, `u.platform_role = 'user'`]
  if (q) {
    params.push(`%${escapeLike(q)}%`)
    where.push(`(u.name ILIKE $${params.length} ESCAPE '\\' OR u.email ILIKE $${params.length} ESCAPE '\\' OR b.name ILIKE $${params.length} ESCAPE '\\' OR b.email ILIKE $${params.length} ESCAPE '\\')`)
  }
  if (status) {
    params.push(status)
    where.push(`u.status = $${params.length}`)
  }
  if (industry) {
    params.push(industry)
    where.push(`b.industry = $${params.length}`)
  }
  if (withoutBusiness) where.push('u.business_id IS NULL')
  addDateFilters(where, params, 'u.created_at', createdFrom, createdTo)
  return { params, where }
}

export async function getPlatformOverview() {
  const { rows } = await getPgPool().query(`
    SELECT
      (SELECT COUNT(*) FROM businesses)::int AS businesses_total,
      (SELECT COUNT(*) FROM businesses WHERE status = 'active')::int AS businesses_active,
      (SELECT COUNT(*) FROM businesses WHERE status = 'suspended')::int AS businesses_suspended,
      (SELECT COUNT(*) FROM businesses WHERE status = 'deactivated')::int AS businesses_deactivated,
      (SELECT COUNT(*) FROM businesses
        WHERE created_at >= (date_trunc('month', NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'))::int
        AS businesses_this_month,
      (SELECT COUNT(*) FROM users WHERE role = 'owner' AND platform_role = 'user')::int AS admins_total,
      (SELECT COUNT(*) FROM users u WHERE u.role = 'owner' AND u.platform_role = 'user'
        AND u.status = 'active' AND EXISTS (
          SELECT 1 FROM members m WHERE m.account_id = u.id AND m.business_id = u.business_id
            AND m.role_id = 'ROLE-ADMIN' AND m.status = 'active'
        ))::int
        AS admins_active,
      (SELECT COUNT(*) FROM users u WHERE u.role = 'owner' AND u.platform_role = 'user'
        AND (u.status = 'inactive' OR NOT EXISTS (
          SELECT 1 FROM members m WHERE m.account_id = u.id AND m.business_id = u.business_id
            AND m.role_id = 'ROLE-ADMIN' AND m.status = 'active'
        )))::int
        AS admins_inactive,
      (SELECT COUNT(*) FROM members m
        LEFT JOIN users u ON u.id = m.account_id
        WHERE m.role_id <> 'ROLE-ADMIN'
          AND (u.id IS NULL OR (u.role = 'team' AND u.platform_role = 'user')))::int AS salespeople_total,
      (SELECT COUNT(*) FROM members m
        JOIN users u ON u.id = m.account_id
        WHERE u.role = 'team' AND u.platform_role = 'user' AND m.status = 'active' AND u.status = 'active')::int
        AS salespeople_active,
      (SELECT COUNT(*) FROM members m
        LEFT JOIN users u ON u.id = m.account_id
        WHERE m.status = 'pending' AND (u.id IS NULL OR (u.role = 'team' AND u.platform_role = 'user')))::int
        AS salespeople_pending,
      (SELECT COUNT(*) FROM members m
        JOIN users u ON u.id = m.account_id
        WHERE u.role = 'team' AND u.platform_role = 'user'
          AND (m.status = 'inactive' OR u.status = 'inactive'))::int AS salespeople_inactive
  `)
  return rows[0]
}

export async function listPlatformBusinesses({ page, limit, ...filters }) {
  const { params, where } = businessFilters(filters)
  const offset = (page - 1) * limit
  params.push(limit, offset)
  const { rows } = await getPgPool().query(
    `SELECT b.id, b.name, b.industry, b.business_type, b.phone, b.email,
            b.city, b.state, b.country, b.status, b.created_at, b.updated_at,
            u.id AS admin_id, u.name AS admin_name, u.email AS admin_email
     FROM businesses b
     LEFT JOIN users u ON u.id = b.owner_id AND u.business_id = b.id AND u.role = 'owner'
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY b.created_at DESC, b.id DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )
  return rows
}

export async function countPlatformBusinesses(filters) {
  const { params, where } = businessFilters(filters)
  const { rows } = await getPgPool().query(
    `SELECT COUNT(*)::int AS total
     FROM businesses b
     LEFT JOIN users u ON u.id = b.owner_id AND u.business_id = b.id AND u.role = 'owner'
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
    params,
  )
  return rows[0].total
}

export async function listPlatformBusinessAdmins({ page, limit, ...filters }, pool = getPgPool()) {
  const { params, where } = buildPlatformBusinessAdminFilters(filters)
  const offset = (page - 1) * limit
  params.push(limit, offset)
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.status, u.created_at,
            b.id AS business_id, b.name AS business_name, b.industry AS business_industry
     FROM users u
     LEFT JOIN businesses b ON b.id = u.business_id AND b.owner_id = u.id
     WHERE ${where.join(' AND ')}
     ORDER BY u.created_at DESC, u.id DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )
  return rows
}

export async function countPlatformBusinessAdmins(filters, pool = getPgPool()) {
  const { params, where } = buildPlatformBusinessAdminFilters(filters)
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total
     FROM users u
     LEFT JOIN businesses b ON b.id = u.business_id AND b.owner_id = u.id
     WHERE ${where.join(' AND ')}`,
    params,
  )
  return rows[0].total
}
