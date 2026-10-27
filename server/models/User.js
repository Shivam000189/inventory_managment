import bcrypt from 'bcryptjs'
import { createSupabaseModel } from './supabaseModel.js'

const MAX_FAILED_LOGINS = 8
const LOCK_DURATION_MS = 15 * 60 * 1000

const userMethods = {
  comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password)
  },
  isLocked() {
    return Boolean(this.lockUntil && new Date(this.lockUntil).getTime() > Date.now())
  },
  async registerFailedLogin() {
    const attempts = (Number(this.failedLoginAttempts) || 0) + 1
    const isLockedOut = attempts >= MAX_FAILED_LOGINS
    const lockUntil = isLockedOut ? new Date(Date.now() + LOCK_DURATION_MS).toISOString() : null
    this.failedLoginAttempts = isLockedOut ? 0 : attempts
    this.lockUntil = lockUntil
    await this.save()
    return lockUntil ? Math.ceil(LOCK_DURATION_MS / 60000) : null
  },
  async clearLoginLock() {
    if (!this.failedLoginAttempts && !this.lockUntil) return
    this.failedLoginAttempts = 0
    this.lockUntil = null
    await this.save()
  },
}

async function hashPasswordHook() {
  if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
    this.password = await bcrypt.hash(this.password, 10)
  }
}

function userToJSONTransform(doc, ret) {
  ret.accountId = String(ret._id || ret.id)
  delete ret.password
  delete ret.tokenVersion
  delete ret.token_version
  delete ret.failedLoginAttempts
  delete ret.failed_login_attempts
  delete ret.lockUntil
  delete ret.lock_until
  delete ret.resetPasswordTokenHash
  delete ret.reset_password_token_hash
  delete ret.resetPasswordExpires
  delete ret.reset_password_expires
  delete ret.__v
  return ret
}

export const User = createSupabaseModel('users', {
  idField: 'accountId',
  methods: userMethods,
  preSave: [hashPasswordHook],
  toJSONTransform: userToJSONTransform,
})

export { MAX_FAILED_LOGINS, LOCK_DURATION_MS }
