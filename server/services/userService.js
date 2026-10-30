import { User, Member, Role, DEFAULT_ROLES } from '../models/index.js'
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

export async function createMember(businessId, payload) {
  requireFields(payload, ['name', 'email'])
  assert(isEmail(payload.email), 'Enter a valid email address.')
  const normalizedEmail = String(payload.email).trim().toLowerCase()
  const roleId = await resolveRoleId(businessId, payload.roleId || payload.role)

  const exists = await Member.findOne(scoped(businessId, { email: normalizedEmail }))
  if (exists) throw ApiError.conflict('A team member with this email already exists.')

  const rawPassword = payload.password || payload.tempPassword || 'Pass@1234'

  // Find or create user in users table so they can immediately sign in
  let user = await User.findOne({ email: normalizedEmail })
  if (!user) {
    user = await User.create({
      name: payload.name.trim(),
      email: normalizedEmail,
      password: rawPassword,
      role: 'team',
      business: businessId,
    })
  } else {
    user.business = businessId
    user.role = 'team'
    if (payload.password || payload.tempPassword) {
      user.password = rawPassword
    }
    await user.save()
  }

  // Create active member record linked to user account
  const doc = await Member.create({
    business: scoped(businessId).business,
    account: user._id || user.id,
    name: payload.name.trim(),
    email: normalizedEmail,
    roleId,
    status: payload.status || 'active',
  })

  return {
    ...doc.toJSON(),
    userId: doc.toJSON().id || doc.toJSON()._id,
    accountId: user._id || user.id,
  }
}

export async function updateMember(businessId, id, payload) {
  const doc = await Member.findOne(scoped(businessId, { _id: toObjectId(id, 'user id') }))
  if (!doc) throw ApiError.notFound('Team member not found.')
  if (payload.name !== undefined) doc.name = payload.name.trim()
  if (payload.email !== undefined) {
    assert(isEmail(payload.email), 'Enter a valid email address.')
    doc.email = payload.email.trim().toLowerCase()
  }
  if (payload.roleId !== undefined || payload.role !== undefined) doc.roleId = await resolveRoleId(businessId, payload.roleId || payload.role)
  if (payload.status !== undefined) {
    assert(['pending', 'active', 'inactive'].includes(payload.status), 'Invalid status.')
    doc.status = payload.status
  }
  await doc.save()

  // Keep corresponding user account synced
  if (doc.account || doc.email) {
    const user = await User.findOne(doc.account ? { _id: doc.account } : { email: doc.email })
    if (user) {
      if (payload.name) user.name = payload.name.trim()
      if (payload.password || payload.tempPassword) user.password = payload.password || payload.tempPassword
      await user.save()
    }
  }

  return doc.toJSON()
}

export async function deleteMember(businessId, id) {
  const doc = await Member.findOne(scoped(businessId, { _id: toObjectId(id, 'user id') }))
  if (!doc) return { deleted: false }
  const accountId = doc.account
  await Member.deleteOne({ _id: doc._id })
  if (accountId) {
    const remaining = await Member.find({ account: accountId })
    if (!remaining || remaining.length === 0) {
      await User.deleteOne({ _id: accountId })
    }
  }
  return { deleted: true }
}

async function resolveRoleId(businessId, roleOrId) {
  if (!roleOrId) return 'ROLE-SALESPERSON'
  const roles = await Role.find(scoped(businessId))
  const match = roles.find((role) => role.roleId === roleOrId || role.name === roleOrId)
  return match ? match.roleId : DEFAULT_ROLES.find((role) => role.name === roleOrId)?.roleId || 'ROLE-SALESPERSON'
}

/* ---------- Roles ---------- */

export async function listRoles(businessId) {
  let docs = await Role.find(scoped(businessId)).sort('createdAt')
  if (docs.length === 0) {
    docs = await Role.insertMany(DEFAULT_ROLES.map((role) => ({ ...role, business: scoped(businessId).business })))
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
