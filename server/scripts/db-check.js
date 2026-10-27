/* Connectivity test for Supabase PostgreSQL in server/.env */
import { testSupabaseConnection } from '../config/supabase.js'
import { env } from '../config/env.js'

console.log('Testing Supabase PostgreSQL connectivity...')
console.log(`Supabase URL: ${env.supabase.url || 'not set'}`)

try {
  const result = await testSupabaseConnection()
  if (!result.configured) {
    console.error('Supabase is not configured. Define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env')
    process.exit(1)
  }

  if (result.restConnected) {
    console.log('✓ Supabase REST API connected successfully')
  } else {
    console.warn('✗ Supabase REST connection failed:', result.details.restError)
  }

  if (result.directDbConnected) {
    console.log(`✓ Direct PostgreSQL pool connected successfully (database: "${result.details.database}")`)
  } else if (env.supabase.databaseUrl) {
    console.warn('✗ Direct PostgreSQL pool failed:', result.details.directDbError)
  }

  if (result.restConnected || result.directDbConnected) {
    console.log('\nSupabase PostgreSQL check PASSED.')
    process.exit(0)
  } else {
    console.error('\nSupabase PostgreSQL check FAILED.')
    process.exit(1)
  }
} catch (error) {
  console.error('Database check error:', error.message)
  process.exit(1)
}
