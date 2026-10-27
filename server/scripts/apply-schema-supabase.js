import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPgPool } from '../config/supabase.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.resolve(here, '..', '..', 'supabase', 'schema.sql')

async function applySchema() {
  console.log('Connecting to Supabase PostgreSQL database...')
  const pool = getPgPool()
  const client = await pool.connect()

  try {
    console.log(`Reading schema from: ${schemaPath}`)
    const sql = await readFile(schemaPath, 'utf8')

    console.log('Applying schema to Supabase PostgreSQL database...')
    await client.query(sql)
    console.log('✓ Schema applied successfully!')

    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)

    console.log('\nVerified tables in public schema:')
    rows.forEach((r, idx) => {
      console.log(`  ${String(idx + 1).padStart(2)}. ${r.table_name}`)
    })
    console.log(`\nTotal: ${rows.length} tables found.`)
  } catch (error) {
    console.error('Failed to apply schema:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
    process.exit(0)
  }
}

applySchema()
