import bcrypt from 'bcryptjs'
import { getPgPool } from '../config/supabase.js'
import { assertStrongPassword } from '../validators/password.js'
import { insertPlatformAuditEvent } from '../services/platformAuditService.js'

const email = 'aflix@gmail.com'
const secret = process.env.INITIAL_SUPER_ADMIN_PASSWORD

if (!secret) {
  console.error('Bootstrap failed: INITIAL_SUPER_ADMIN_PASSWORD is required.')
  process.exitCode = 1
} else {
  try {
    assertStrongPassword(secret, email)
  } catch {
    console.error('Bootstrap failed: INITIAL_SUPER_ADMIN_PASSWORD does not meet the password policy.')
    process.exitCode = 1
  }
}

if (process.exitCode !== 1) {
  let pool
  try {
    pool = getPgPool()
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const existing = await client.query(
        `SELECT id, role, platform_role, status, business_id
         FROM users WHERE lower(email) = $1 FOR UPDATE`,
        [email],
      )
      if (existing.rowCount) {
        if (existing.rowCount !== 1) {
          throw new Error('Duplicate target account records exist.')
        }
        const account = existing.rows[0]
        if (
          account.role !== 'owner' ||
          account.platform_role !== 'super_admin' ||
          account.status !== 'active' ||
          account.business_id !== null
        ) {
          throw new Error('The target account exists in an unexpected state.')
        }
        await client.query('COMMIT')
        console.log('Bootstrap unchanged: the expected Super Admin account already exists.')
      } else {
        const passwordHash = await bcrypt.hash(secret, 10)
        const inserted = await client.query(
          `INSERT INTO users (name, email, password, role, platform_role, status, must_change_password)
           VALUES ('Platform Administrator', $1, $2, 'owner', 'super_admin', 'active', true)
           RETURNING id`,
          [email, passwordHash],
        )
        await insertPlatformAuditEvent(client, {
          actorUserId: inserted.rows[0].id,
          action: 'super_admin.bootstrapped',
          targetType: 'user',
          targetId: inserted.rows[0].id,
          metadata: { email },
        })
        await client.query('COMMIT')
        console.log('Bootstrap succeeded: the initial Super Admin account was created.')
      }
    } catch (error) {
      try {
        await client.query('ROLLBACK')
      } catch {
        // The connection may already have rolled back after a failed transaction.
      }
      throw error
    } finally {
      client.release()
    }
  } catch {
    console.error('Bootstrap failed: database error or ambiguous target account state; no password was changed.')
    process.exitCode = 1
  } finally {
    if (pool) await pool.end().catch(() => {})
  }
}
