import { User } from '../models/index.js'
import { connectDatabase, disconnectDatabase } from '../config/db.js'
import { assertStrongPassword } from '../validators/password.js'

const [email] = process.argv.slice(2)
const password = process.env.ACCOUNT_RECOVERY_PASSWORD

if (!email || !password) {
  console.error('Recovery failed: provide the account email and set ACCOUNT_RECOVERY_PASSWORD securely.')
  process.exitCode = 1
} else {
  try {
    assertStrongPassword(password, email)
  } catch {
    console.error('Recovery failed: ACCOUNT_RECOVERY_PASSWORD does not meet the password policy.')
    process.exitCode = 1
  }
}

if (process.exitCode !== 1) {
  try {
    await connectDatabase()
    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password')
    if (!user) throw new Error('Account not found.')
    user.password = password
    user.mustChangePassword = true
    user.resetPasswordTokenHash = null
    user.resetPasswordExpires = null
    user.tokenVersion = (user.tokenVersion || 0) + 1
    user.failedLoginAttempts = 0
    user.lockUntil = null
    await user.save()
    console.log('Recovery succeeded. Existing sessions were revoked and a password change is required at next sign-in.')
  } catch {
    console.error('Recovery failed. Verify the account and database configuration; no recovery secret was logged.')
    process.exitCode = 1
  } finally {
    await disconnectDatabase()
  }
}
