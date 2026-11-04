import { User, Business, Member, Role, DEFAULT_PERMISSIONS } from '../models/index.js'
import bcrypt from 'bcryptjs'
import { ApiError } from '../utils/ApiError.js'
import { signToken } from '../utils/token.js'
import { assert, requireFields } from '../validators/assert.js'
import { assertStrongPassword } from '../validators/password.js'
import { resolveBusinessCapabilities } from '../shared/industryConfig.js'

// A real bcrypt hash to compare against when the account does not exist, so an
// unknown email costs the same wall-clock time as a wrong password.
const DUMMY_HASH = bcrypt.hashSync('a-string-no-one-will-guess-0000', 10)

async function buildSession(user) {
  if ((user.status || 'active') !== 'active') {
    throw ApiError.unauthorized('Invalid email or password.')
  }
  const business = user.business ? await Business.findById(user.business) : null
  if (user.business && (!business || (business.status || 'active') !== 'active')) {
    throw ApiError.unauthorized('Invalid email or password.')
  }
  const member = user.business ? await Member.findOne({ business: user.business, account: user._id }) : null
  if (user.business && (!member || member.status !== 'active')) {
    throw ApiError.unauthorized('Invalid email or password.')
  }
  if (user.role === 'owner' && user.business && member.roleId !== 'ROLE-ADMIN') {
    throw ApiError.unauthorized('Invalid email or password.')
  }
  if (user.role === 'team' && member?.roleId === 'ROLE-ADMIN') {
    throw ApiError.unauthorized('Invalid email or password.')
  }
  const role = member ? await Role.findOne({ business: user.business, roleId: member.roleId }) : null
  const account = { ...user.toJSON(), roleId: member?.roleId || null, roleName: role?.name || null, permissions: role?.permissions || (user.role === 'owner' && user.platformRole === 'super_admin' ? DEFAULT_PERMISSIONS : []) }
  return {
    token: signToken(user),
    account,
    user: account,
    business: business ? { ...business.toJSON(), capabilities: resolveBusinessCapabilities(business.toJSON()) } : null,
  }
}

export async function login({ email, password } = {}) {
  requireFields({ email, password }, ['email', 'password'])
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password +failedLoginAttempts +lockUntil')

  if (!user) {
    // Keep the timing indistinguishable from a real account with a wrong password.
    await bcrypt.compare(String(password), DUMMY_HASH)
    throw ApiError.unauthorized('Invalid email or password.')
  }

  if (user.isLocked()) {
    throw new ApiError(429, 'Too many attempts. Try again later.')
  }

  if (!(await user.comparePassword(String(password)))) {
    const lockedForMinutes = await user.registerFailedLogin()
    if (lockedForMinutes) {
      throw new ApiError(429, 'Too many attempts. Try again later.')
    }
    throw ApiError.unauthorized('Invalid email or password.')
  }

  if ((user.status || 'active') !== 'active') {
    throw ApiError.unauthorized('Invalid email or password.')
  }
  await user.clearLoginLock()
  return buildSession(user)
}

export async function currentSession(user) {
  return buildSession(user)
}

/** Invalidates every issued token for this user (used by "sign out everywhere"). */
export async function revokeAllSessions(user) {
  await User.updateOne({ _id: user._id }, { $inc: { tokenVersion: 1 } })
}

export async function updateOnboarding(user, payload = {}) {
  assert(user.role === 'owner', 'Team members inherit their business setup and do not use owner onboarding.')
  assert(user.business, 'Only a Super Admin-provisioned business can use onboarding.')
  const onboarding = user.onboarding?.toObject?.() || user.onboarding || { status: 'pending', currentStep: 1, setupVersion: 1, draft: {} }
  if (payload.currentStep !== undefined) onboarding.currentStep = Math.min(7, Math.max(1, Number(payload.currentStep) || 1))
  if (payload.draft && typeof payload.draft === 'object') onboarding.draft = { ...(onboarding.draft || {}), ...payload.draft }
  if (payload.ownerName !== undefined) user.name = String(payload.ownerName).trim()
  onboarding.status = payload.complete ? 'completed' : 'in_progress'
  if (payload.complete) {
    assert(user.business, 'Create the business before completing onboarding.')
    onboarding.currentStep = 7
    onboarding.completedAt = new Date()
  }
  user.onboarding = onboarding
  await user.save()
  return buildSession(user)
}

export async function changePassword(userIdentity, { currentPassword, newPassword } = {}) {
  requireFields({ currentPassword, newPassword }, ['currentPassword', 'newPassword'])
  const user = await User.findById(userIdentity._id || userIdentity.id).select('+password')
  if (!user || !(await user.comparePassword(String(currentPassword)))) {
    throw ApiError.unauthorized('Current password is incorrect.')
  }
  assertStrongPassword(newPassword, user.email)
  user.password = String(newPassword)
  user.mustChangePassword = false
  user.tokenVersion = (user.tokenVersion || 0) + 1
  user.failedLoginAttempts = 0
  user.lockUntil = null
  await user.save()
  return buildSession(user)
}
