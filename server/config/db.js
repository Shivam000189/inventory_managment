import { env } from './env.js'
import { isSupabaseConfigured, testSupabaseConnection, getPgPool } from './supabase.js'
import { ApiError } from '../utils/ApiError.js'

let isSupabaseConnectedState = false

export function isDatabaseConnected() {
  return isSupabaseConnectedState
}

export function getDatabaseStatus() {
  return {
    driver: 'supabase',
    supabase: isSupabaseConnectedState ? 'connected' : (isSupabaseConfigured() ? 'connecting' : 'not_configured'),
  }
}

/**
 * Connects exclusively to Supabase (REST and direct PostgreSQL pool).
 */
export async function connectDatabase() {
  if (!isSupabaseConfigured()) {
    console.warn('[Database] Supabase is not configured. Please define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env')
    return
  }

  console.log(`[Database] Connecting to Supabase PostgreSQL (${env.supabase.url})...`)
  try {
    const check = await testSupabaseConnection()
    if (check.restConnected || check.directDbConnected) {
      isSupabaseConnectedState = true
      console.log(`✓ [Database] Supabase connected successfully: ${env.supabase.url}`)
      if (check.directDbConnected) {
        console.log(`✓ [Database] PostgreSQL direct connection pool ready (database: "${check.details.database || 'postgres'}")`)
      }
    } else {
      console.warn('[Database] Supabase connection check failed:', check.details)
    }
  } catch (err) {
    console.error('[Database] Supabase connection error:', err.message)
  }
}

export async function disconnectDatabase() {
  try {
    const pool = getPgPool()
    await pool.end()
  } catch {
    // ignore
  }
  isSupabaseConnectedState = false
}

/**
 * Runs `work` inside an isolated PostgreSQL transaction using the direct connection pool.
 *
 * Guarantees:
 * 1. Connection acquisition and BEGIN happen before `work(client)` is invoked.
 * 2. If the transaction cannot be opened, throws a 500 ApiError immediately.
 * 3. Never falls back to nontransactional execution.
 * 4. Never reruns `work()` after an error has occurred.
 * 5. Rolls back on any exception inside `work` and releases the connection in all cases.
 */
export async function withTransaction(work) {
  let client
  try {
    const pool = getPgPool()
    client = await pool.connect()
    await client.query('BEGIN')
  } catch (setupErr) {
    if (client) {
      try {
        client.release()
      } catch {
        // ignore release error
      }
    }
    throw new ApiError(500, `Database transaction initialization failed: ${setupErr.message}`)
  }

  try {
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (workErr) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackErr) {
      console.error('[Database] Transaction rollback error:', rollbackErr.message)
    }
    throw workErr
  } finally {
    try {
      client.release()
    } catch {
      // ignore release error
    }
  }
}
