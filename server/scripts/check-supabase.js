import { testSupabaseConnection } from '../config/supabase.js'
import { env } from '../config/env.js'

console.log('Testing Supabase Connection...')
console.log(`Supabase URL: ${env.supabase.url}`)
console.log(`Database URL: ${env.supabase.databaseUrl ? env.supabase.databaseUrl.replace(/:[^@]+@/, ':****@') : 'not set'}`)

try {
  const result = await testSupabaseConnection()
  console.log('\nResults:')
  console.log(`- Supabase REST API connected: ${result.restConnected ? 'YES' : 'NO'}`)
  console.log(`- PostgreSQL Direct DB connected: ${result.directDbConnected ? 'YES' : 'NO'}`)
  if (result.details && Object.keys(result.details).length) {
    console.log('Details:', JSON.stringify(result.details, null, 2))
  }
  process.exit(result.restConnected || result.directDbConnected ? 0 : 1)
} catch (err) {
  console.error('Error testing connection:', err)
  process.exit(1)
}
