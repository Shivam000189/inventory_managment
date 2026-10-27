import { createClient } from '@supabase/supabase-js'
import pg from 'pg'
import { env } from './env.js'

const { Pool } = pg

let supabaseAdminClient = null
let pgPoolInstance = null

/**
 * Checks whether Supabase environment variables are provided.
 */
export function isSupabaseConfigured() {
  return Boolean(env.supabase?.url && (env.supabase?.serviceRoleKey || env.supabase?.anonKey))
}

/**
 * Returns a Supabase client with admin / service_role privileges.
 * Used on the Node.js backend to bypass RLS and perform system operations.
 */
export function getSupabaseAdmin() {
  if (!supabaseAdminClient) {
    if (!env.supabase?.url) {
      throw new Error('Supabase is not configured. Please define SUPABASE_URL in server/.env')
    }
    const key = env.supabase.serviceRoleKey || env.supabase.anonKey
    if (!key) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in server/.env')
    }

    supabaseAdminClient = createClient(env.supabase.url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabaseAdminClient
}

/**
 * Returns a PostgreSQL connection pool for direct SQL access.
 * Useful for bulk migrations, transactions, and complex joins.
 */
export function getPgPool() {
  if (!pgPoolInstance) {
    const connectionString = env.supabase?.databaseUrl || process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('Direct PostgreSQL connection string not found. Please set DATABASE_URL or SUPABASE_DB_URL in server/.env')
    }

    pgPoolInstance = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Supabase requires SSL
      max: 10,
      idleTimeoutMillis: 30000,
    })
  }
  return pgPoolInstance
}

/**
 * Tests connection to Supabase via both REST and direct PostgreSQL (if configured).
 */
export async function testSupabaseConnection() {
  const results = {
    configured: isSupabaseConfigured(),
    restConnected: false,
    directDbConnected: false,
    details: {},
  }

  if (!results.configured) {
    return results
  }

  // 1. Test Supabase Client REST
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('businesses').select('id').limit(1)
    if (!error) {
      results.restConnected = true
    } else {
      results.details.restError = error.message
    }
  } catch (err) {
    results.details.restError = err.message
  }

  // 2. Test Direct PostgreSQL Connection (if DATABASE_URL provided)
  if (env.supabase?.databaseUrl || process.env.DATABASE_URL) {
    try {
      const pool = getPgPool()
      const client = await pool.connect()
      try {
        const res = await client.query('SELECT NOW() as current_time, current_database() as db_name')
        results.directDbConnected = true
        results.details.database = res.rows[0]?.db_name
      } finally {
        client.release()
      }
    } catch (err) {
      results.details.directDbError = err.message
    }
  }

  return results
}
