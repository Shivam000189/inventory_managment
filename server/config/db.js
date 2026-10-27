import { env } from './env.js'
import { isSupabaseConfigured, testSupabaseConnection, getPgPool } from './supabase.js'

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
 * Runs `work` inside a PostgreSQL transaction using the direct connection pool.
 */
export async function withTransaction(work) {
  try {
    const pool = getPgPool()
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await work(client)
      await client.query('COMMIT')
      return result
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch {
    // If pool or transaction fails to initialize, execute work directly
    return work(null)
  }
}
