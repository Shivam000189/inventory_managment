import { Business, Member, Role, DEFAULT_ROLES, getIndustryRoles } from '../models/index.js'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { withTransaction } from '../config/db.js'
import { insertPlatformAuditEvent } from './platformAuditService.js'
import { ApiError } from '../utils/ApiError.js'
import { toObjectId, requireFields, assert, isEmail } from '../validators/assert.js'

function scoped(businessId, extra = {}) {
  return { business: toObjectId(businessId, 'business'), ...extra }
}

/* ---------- Members (the "Users" screen) ---------- */

export async function listMembers(businessId) {
  const docs = await Member.find(scoped(businessId)).sort('createdAt')
  return docs.map((doc) => doc.toJSON())
}

async function assertCanManageMembers(client, businessId, actor) {
  const actorId = toObjectId(actor?._id || actor?.id, 'actor id')
  const result = await client.query(
    `SELECT u.role, u.platform_role, u.status, m.status AS member_status,
            m.role_id, r.permissions, b.status AS business_status
     FROM users u
     JOIN members m ON m.account_id = u.id AND m.business_id = $2
     JOIN businesses b ON b.id = m.business_id
     LEFT JOIN roles r ON r.business_id = m.business_id AND r.role_id = m.role_id
     WHERE u.id = $1
     FOR UPDATE OF u`,
    [actorId, businessId],
  )
  const current = result.rows[0]
  if (
    !current ||
    current.platform_role !== 'user' ||
    current.status !== 'active' ||
    current.member_status !== 'active' ||
    current.business_status !== 'active' ||
    (current.role !== 'owner' && current.role !== 'team') ||
    (current.role === 'owner' && current.role_id !== 'ROLE-ADMIN') ||
    !current.permissions?.includes('manage_users')
  ) {
    throw ApiError.forbidden('You do not have permission to manage users in this business.')
  }
}

function assertPayloadKeys(payload, allowed) {
  const unsupported = Object.keys(payload || {}).filter((key) => !allowed.includes(key))
  if (unsupported.length) throw ApiError.badRequest(`Unsupported field(s): ${unsupported.join(', ')}.`)
}

function normalizedNameAndEmail(payload) {
  requireFields(payload, ['name', 'email'])
  assert(typeof payload.name === 'string' && payload.name.trim().length <= 120, 'Name must be no longer than 120 characters.')
  assert(isEmail(payload.email), 'Enter a valid email address.')
  const name = payload.name.trim()
  const email = String(payload.email).trim().toLowerCase()
  assert(email.length <= 254, 'Email must be no longer than 254 characters.')
  return { name, email }
}

async function resolveTeamRoleInTransaction(client, businessId, roleOrId) {
  const requested = roleOrId || 'ROLE-SALESPERSON'
  const { rows } = await client.query(
    'SELECT role_id, permissions FROM roles WHERE business_id = $1 AND (role_id = $2 OR name = $2)',
    [businessId, requested],
  )
  const role = rows[0]
  if (!role || role.role_id === 'ROLE-ADMIN' || role.permissions?.includes('manage_users')) {
    throw ApiError.badRequest('Select a valid team role that is not a Business Admin role.')
  }
  return role.role_id
}

export async function createMember(businessId, payload = {}, actor, request) {
  assertPayloadKeys(payload, ['name', 'email', 'roleId', 'role'])
  const { name, email } = normalizedNameAndEmail(payload)
  const businessUuid = toObjectId(businessId, 'business id')
  const accountId = crypto.randomUUID()
  const temporaryPassword = crypto.randomBytes(36).toString('base64url')
  const passwordHash = await bcrypt.hash(temporaryPassword, 10)

  const member = await withTransaction(async (client) => {
    await assertCanManageMembers(client, businessUuid, actor)
    const roleId = await resolveTeamRoleInTransaction(client, businessUuid, payload.roleId || payload.role)
    const duplicate = await client.query('SELECT id FROM users WHERE lower(email) = $1 FOR UPDATE', [email])
    if (duplicate.rowCount) throw ApiError.conflict('An account with this email already exists.')

    await client.query(
      `INSERT INTO users
         (id, name, email, password, role, platform_role, business_id, status, must_change_password)
       VALUES ($1, $2, $3, $4, 'team', 'user', $5, 'active', true)`,
      [accountId, name, email, passwordHash, businessUuid],
    )
    const inserted = await client.query(
      `INSERT INTO members
         (business_id, account_id, name, email, role_id, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id`,
      [businessUuid, accountId, name, email, roleId],
    )
    await insertPlatformAuditEvent(client, {
      actorUserId: actor._id || actor.id,
      action: 'salesperson.created',
      targetType: 'user',
      targetId: accountId,
      businessId: businessUuid,
      metadata: { name, email, roleId },
      request,
    })
    return { id: inserted.rows[0].id, accountId, name, email, roleId, status: 'active' }
  })

  return { ...member, temporaryPassword }
}

export async function updateMember(businessId, id, payload = {}, actor, request) {
  assertPayloadKeys(payload, ['name', 'email', 'roleId', 'role'])
  const businessUuid = toObjectId(businessId, 'business id')
  const memberId = toObjectId(id, 'member id')
  return withTransaction(async (client) => {
    await assertCanManageMembers(client, businessUuid, actor)
    const found = await client.query(
      `SELECT m.id, m.account_id, m.name, m.email, m.role_id, m.status
       FROM members m
       JOIN users u ON u.id = m.account_id
       WHERE m.id = $1 AND m.business_id = $2 AND u.role = 'team'
       FOR UPDATE OF m, u`,
      [memberId, businessUuid],
    )
    const member = found.rows[0]
    if (!member) throw ApiError.notFound('Team member not found.')

    const name = payload.name === undefined ? member.name : String(payload.name).trim()
    const email = payload.email === undefined ? member.email : String(payload.email).trim().toLowerCase()
    assert(name.length > 0 && name.length <= 120, 'Name must be between 1 and 120 characters.')
    assert(isEmail(email) && email.length <= 254, 'Enter a valid email address.')
    const roleId = payload.roleId !== undefined || payload.role !== undefined
      ? await resolveTeamRoleInTransaction(client, businessUuid, payload.roleId || payload.role)
      : member.role_id

    if (email !== member.email) {
      const duplicate = await client.query(
        'SELECT id FROM users WHERE lower(email) = $1 AND id <> $2',
        [email, member.account_id],
      )
      if (duplicate.rowCount) throw ApiError.conflict('An account with this email already exists.')
    }
    await client.query(
      `UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3`,
      [name, email, member.account_id],
    )
    await client.query(
      `UPDATE members SET name = $1, email = $2, role_id = $3, updated_at = NOW()
       WHERE id = $4 AND business_id = $5`,
      [name, email, roleId, memberId, businessUuid],
    )
    await insertPlatformAuditEvent(client, {
      actorUserId: actor._id || actor.id,
      action: 'salesperson.updated',
      targetType: 'user',
      targetId: member.account_id,
      businessId: businessUuid,
      metadata: { name, email, roleId },
      request,
    })
    return { id: memberId, accountId: member.account_id, name, email, roleId, status: member.status }
  })
}

export async function setSalespersonStatus(businessId, userId, payload = {}, actor, request) {
  assertPayloadKeys(payload, ['status'])
  assert(['active', 'inactive'].includes(payload.status), 'Status must be active or inactive.')
  const businessUuid = toObjectId(businessId, 'business id')
  const accountId = toObjectId(userId, 'user id')
  return withTransaction(async (client) => {
    await assertCanManageMembers(client, businessUuid, actor)
    const found = await client.query(
      `SELECT u.id, u.name, u.email, u.status, m.status AS member_status, m.role_id
       FROM users u
       JOIN members m ON m.account_id = u.id AND m.business_id = $2
       WHERE u.id = $1 AND u.role = 'team' AND u.platform_role = 'user'
       FOR UPDATE OF u, m`,
      [accountId, businessUuid],
    )
    const user = found.rows[0]
    if (!user || user.role_id === 'ROLE-ADMIN') throw ApiError.notFound('Salesperson not found.')
    if (user.status !== payload.status || user.member_status !== payload.status) {
      const actorId = toObjectId(actor._id || actor.id, 'actor id')
      await client.query(
        `UPDATE users
         SET status = $1,
             deactivated_at = CASE WHEN $1 = 'inactive' THEN NOW() ELSE NULL END,
             deactivated_by = CASE WHEN $1 = 'inactive' THEN $2::uuid ELSE NULL END,
             token_version = token_version + 1,
             updated_at = NOW()
         WHERE id = $3`,
        [payload.status, actorId, accountId],
      )
      await client.query(
        `UPDATE members SET status = $1, updated_at = NOW()
         WHERE account_id = $2 AND business_id = $3`,
        [payload.status, accountId, businessUuid],
      )
      await insertPlatformAuditEvent(client, {
        actorUserId: actorId,
        action: 'salesperson.status_changed',
        targetType: 'user',
        targetId: accountId,
        businessId: businessUuid,
        metadata: { previousStatus: user.status, status: payload.status },
        request,
      })
    }
    return { id: accountId, name: user.name, email: user.email, status: payload.status }
  })
}

export async function deleteMember(businessId, id, actor, request) {
  const businessUuid = toObjectId(businessId, 'business id')
  const memberId = toObjectId(id, 'member id')
  return withTransaction(async (client) => {
    await assertCanManageMembers(client, businessUuid, actor)
    const found = await client.query(
      `SELECT m.id, m.account_id, u.status
       FROM members m
       JOIN users u ON u.id = m.account_id
       WHERE m.id = $1 AND m.business_id = $2 AND u.role = 'team'
       FOR UPDATE OF m, u`,
      [memberId, businessUuid],
    )
    const member = found.rows[0]
    if (!member) return { deleted: false }
    const actorId = toObjectId(actor._id || actor.id, 'actor id')
    await client.query(
      `UPDATE users
       SET status = 'inactive', deactivated_at = NOW(), deactivated_by = $1::uuid,
           token_version = token_version + 1, updated_at = NOW()
       WHERE id = $2`,
      [actorId, member.account_id],
    )
    await client.query('DELETE FROM members WHERE id = $1 AND business_id = $2', [memberId, businessUuid])
    await insertPlatformAuditEvent(client, {
      actorUserId: actorId,
      action: 'salesperson.removed',
      targetType: 'user',
      targetId: member.account_id,
      businessId: businessUuid,
      metadata: { previousStatus: member.status, status: 'inactive' },
      request,
    })
    return { deleted: true }
  })
}

/* ---------- Roles ---------- */

export async function listRoles(businessId) {
  let docs = await Role.find(scoped(businessId)).sort('createdAt')
  if (docs.length === 0) {
    let rolesToSeed = DEFAULT_ROLES
    try {
      const business = await Business.findById(businessId)
      if (business?.industry) {
        rolesToSeed = getIndustryRoles(business.industry, business.businessType)
      }
    } catch {
      // Fallback to DEFAULT_ROLES
    }
    docs = await Role.insertMany(rolesToSeed.map((role) => ({ ...role, business: scoped(businessId).business })))
  }
  return docs.map((doc) => doc.toJSON())
}

export async function saveRole(businessId, payload) {
  requireFields(payload, ['name'])
  const roleId = payload.roleId || `ROLE-${Date.now()}`
  const doc = await Role.findOneAndUpdate(
    scoped(businessId, { roleId }),
    {
      $set: {
        name: payload.name.trim(),
        description: (payload.description || '').trim(),
        ...(Array.isArray(payload.permissions) ? { permissions: payload.permissions } : {}),
      },
      $setOnInsert: { business: scoped(businessId).business, roleId },
    },
    { returnDocument: 'after', upsert: true },
  )
  return doc.toJSON()
}

export async function setRolePermissions(businessId, roleId, permissions) {
  assert(Array.isArray(permissions), 'permissions must be an array.')
  const doc = await Role.findOneAndUpdate(scoped(businessId, { roleId }), { $set: { permissions } }, { returnDocument: 'after' })
  if (!doc) throw ApiError.notFound('Role not found.')
  return doc.toJSON()
}

export const userService = { listMembers, createMember, updateMember, deleteMember, listRoles, saveRole, setRolePermissions }
