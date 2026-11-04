import { User, Member, Role, Business } from '../models/index.js'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { signToken, verifyToken, tokenTimeToLiveMs } from '../utils/token.js'
import { refreshSessionCookie } from '../utils/cookies.js'
import { hasModule, resolveBusinessCapabilities } from '../shared/industryConfig.js'

export { signToken }

// Re-issue the browser cookie once the token is more than halfway to expiry so
// an active session never lapses, while an idle one still times out.
const RENEW_AFTER_RATIO = 0.5

function readToken(req) {
  const cookieToken = req.cookies?.[env.cookie.name]
  if (cookieToken) return { token: cookieToken, via: 'cookie' }
  const header = req.headers.authorization || ''
  if (header.startsWith('Bearer ')) return { token: header.slice(7).trim(), via: 'bearer' }
  return { token: null, via: null }
}

/** Verifies the session (cookie or Bearer token) and loads the user onto req.user. */
export const authenticate = asyncHandler(async (req, res, next) => {
  const { token, via } = readToken(req)
  if (!token) throw ApiError.unauthorized('Authentication token is missing.')

  let payload
  try {
    payload = verifyToken(token)
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.')
  }

  const user = await User.findById(payload.sub)
  if (!user) throw ApiError.unauthorized('Account no longer exists.')
  if ((payload.tv || 0) !== (user.tokenVersion || 0)) {
    throw ApiError.unauthorized('Your session ended. Please sign in again.')
  }
  if ((user.status || 'active') !== 'active') {
    throw ApiError.unauthorized('Your account is unavailable. Please contact your administrator.')
  }

  req.user = user
  req.authVia = via

  let member = null
  let permissions = []
  let business = null
  if (user.business) {
    business = await Business.findById(user.business)
    if (!business || (business.status || 'active') !== 'active') {
      throw ApiError.forbidden('Business access is unavailable.')
    }
    member = await Member.findOne({ business: user.business, account: user._id })
    if (!member || member.status !== 'active') {
      throw ApiError.forbidden('Your business access is inactive. Contact your administrator.')
    }
    const role = await Role.findOne({ business: user.business, roleId: member.roleId })
    if (user.role === 'owner' && member.roleId !== 'ROLE-ADMIN') {
      throw ApiError.forbidden('Business administrator access is unavailable.')
    }
    if (user.role === 'team' && member.roleId === 'ROLE-ADMIN') {
      throw ApiError.forbidden('Your team access is unavailable.')
    }
    if (!role) throw ApiError.forbidden('Your business role is unavailable.')
    permissions = role.permissions || []
  }

  if (user.mustChangePassword) {
    const pathname = req.originalUrl?.split('?')[0]
    const allowedPaths = [
      '/api/auth/me',
      '/api/auth/password',
      '/api/auth/logout',
      '/api/auth/logout-all',
    ]
    if (!allowedPaths.includes(pathname)) {
      throw ApiError.forbidden('Change your temporary password before continuing.')
    }
  }

  // Sliding renewal for cookie sessions happens only after current access checks.
  if (via === 'cookie' && typeof payload.exp === 'number') {
    const ttl = tokenTimeToLiveMs()
    const remaining = payload.exp * 1000 - Date.now()
    if (remaining < ttl * RENEW_AFTER_RATIO) refreshSessionCookie(res, user, req.cookies?.[env.cookie.csrfName])
  }

  req.member = member
  req.permissions = permissions
  req.auth = { userId: String(user._id), businessId: user.business ? String(user.business) : null, roleId: member?.roleId || null, permissions }
  req.business = business
  req.capabilities = req.business ? resolveBusinessCapabilities(req.business.toJSON()) : null
  next()
})

/** Ensures the authenticated user has completed business setup. */
export function requireBusiness(req, _res, next) {
  if (!req.user?.business) throw ApiError.forbidden('Create your business workspace first.')
  req.businessId = String(req.user.business)
  next()
}

export function requireModule(module) {
  return (req, _res, next) => {
    if (!req.business || !hasModule(req.business.toJSON(), module)) throw ApiError.forbidden(`The ${module} module is not enabled for this business.`)
    next()
  }
}

export function requirePermission(permission) {
  return (req, _res, next) => {
    if (!req.permissions?.includes(permission)) throw ApiError.forbidden(`Missing required permission: ${permission}.`)
    next()
  }
}

export function requireAnyPermission(...permissions) {
  return (req, _res, next) => {
    if (!permissions.some((permission) => req.permissions?.includes(permission))) throw ApiError.forbidden(`Missing required permission: ${permissions.join(' or ')}.`)
    next()
  }
}


/**
 * Middleware: Requires the authenticated user to have a specific platform_role.
 *
 * Authorization derives exclusively from the database user loaded by `authenticate`.
 * Never reads platform_role from the request body, query string, headers, or JWT
 * claims — those paths are untrusted and intentionally ignored.
 *
 * Usage:
 *   const platformGuard = [requireDatabase, authenticate, requirePlatformRole('super_admin')]
 *   api.use('/platform', platformGuard, platformRoutes)
 *
 * @param {'super_admin'|'user'} role The required platform_role value.
 */
export function requirePlatformRole(role) {
  return (req, _res, next) => {
    // req.user is the full DB document populated by authenticate().
    // platformRole is the camelCase mapping of the platform_role column.
    const userPlatformRole = req.user?.platformRole ?? req.user?.platform_role ?? 'user'
    if (userPlatformRole !== role) {
      throw ApiError.forbidden('Platform access denied.')
    }
    next()
  }
}
