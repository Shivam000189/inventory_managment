import { DEFAULT_ROLES } from '../models/index.js'
/**
 * Standalone Supabase Seed Script
 *
 * Usage:
 *   node server/scripts/seed-supabase.js
 *   node server/scripts/seed-supabase.js --fresh
 *
 * Seeds Supabase with:
 * - Demo account (demo@stockroom.test / demo12345)
 * - Demo business
 * - Standard System Roles (Admin, Manager, Staff, Accountant, Salesperson)
 * - Sample products, variants, suppliers, and customers
 */

import bcrypt from 'bcryptjs'
import { getSupabaseAdmin, isSupabaseConfigured } from '../config/supabase.js'

const flags = new Set(process.argv.slice(2))
const isFresh = flags.has('--fresh')

async function runSeed() {
  console.log('\n======================================================')
  console.log('  Stockroom / IMB: Supabase Direct Seed')
  console.log('======================================================\n')

  if (!isSupabaseConfigured()) {
    console.error('ERROR: Supabase is not configured.')
    console.error('Please define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env')
    process.exit(1)
  }

  const supabase = getSupabaseAdmin()

  const DEMO_EMAIL = 'demo@stockroom.test'

  // Check if demo user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', DEMO_EMAIL)
    .maybeSingle()

  if (existingUser && !isFresh) {
    console.log(`Demo user (${DEMO_EMAIL}) already exists in Supabase.`)
    console.log('Run with --fresh if you want to reset demo data.')
    return
  }

  console.log('Seeding demo data into Supabase...')

  const passwordHash = await bcrypt.hash('demo12345', 10)

  // 1. Create or update User
  let userId = existingUser?.id
  if (!userId) {
    const { data: newUser, error: userErr } = await supabase
      .from('users')
      .insert({
        name: 'Demo Owner',
        email: DEMO_EMAIL,
        password: passwordHash,
        role: 'owner',
      })
      .select('id')
      .single()

    if (userErr) throw new Error(`User creation failed: ${userErr.message}`)
    userId = newUser.id
  }

  // 2. Create Business
  let businessId
  const { data: existingBiz } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  if (existingBiz) {
    businessId = existingBiz.id
  } else {
    const { data: newBiz, error: bizErr } = await supabase
      .from('businesses')
      .insert({
        name: 'Demo Supply Co',
        industry: 'retail',
        business_type: 'retail',
        city: 'New Delhi',
        country: 'India',
        currency: 'INR',
        owner_id: userId,
        enabled_modules: ['inventory', 'orders', 'purchases', 'pos', 'reports', 'clothing'],
      })
      .select('id')
      .single()

    if (bizErr) throw new Error(`Business creation failed: ${bizErr.message}`)
    businessId = newBiz.id
  }

  // Link business to user
  await supabase.from('users').update({ business_id: businessId }).eq('id', userId)

  // 3. Create Default Roles
  const rolesPayload = DEFAULT_ROLES.map((role) => ({
    business_id: businessId,
    role_id: role.roleId,
    name: role.name,
    description: role.description || '',
    permissions: role.permissions,
  }))
  await supabase.from('roles').upsert(rolesPayload, { onConflict: 'business_id,role_id' })

  // 4. Create Member
  await supabase.from('members').upsert(
    {
      business_id: businessId,
      account_id: userId,
      name: 'Demo Owner',
      email: DEMO_EMAIL,
      role_id: 'ROLE-ADMIN',
      status: 'active',
    },
    { onConflict: 'business_id,email' },
  )

  // 5. Create Supplier
  const { data: supplier } = await supabase
    .from('suppliers')
    .upsert(
      {
        business_id: businessId,
        supplier_name: 'Sharma Wholesale Ltd',
        normalized_name: 'sharma wholesale ltd',
        contact_person: 'Ramesh Sharma',
        phone: '+91 98765 43210',
        email: 'ramesh@sharmawholesale.test',
        city: 'New Delhi',
        state: 'Delhi',
        payment_terms: 'Net 30',
      },
      { onConflict: 'business_id,normalized_name' },
    )
    .select('id')
    .single()

  // 6. Create Customer
  const { data: _customer } = await supabase
    .from('customers')
    .insert({
      business_id: businessId,
      name: 'Priya Sharma',
      phone: '+91 91234 56789',
      email: 'priya@example.test',
      city: 'New Delhi',
      customer_type: 'retail',
      loyalty_points: 150,
    })
    .select('id')
    .single()

  // 7. Create Sample Products
  const sampleProducts = [
    {
      business_id: businessId,
      name: 'Classic Canvas Tote',
      sku: 'TOTE-001',
      category: 'Accessories',
      purchase_price: 160,
      selling_price: 280,
      current_stock: 48,
      minimum_stock: 10,
      barcode: '8901234001',
      unit: 'piece',
      supplier_id: supplier?.id || null,
    },
    {
      business_id: businessId,
      name: 'Daily Planner 2026',
      sku: 'PLAN-014',
      category: 'Stationery',
      purchase_price: 90,
      selling_price: 180,
      current_stock: 42,
      minimum_stock: 10,
      barcode: '8901234002',
      unit: 'piece',
      supplier_id: supplier?.id || null,
    },
    {
      business_id: businessId,
      name: 'Ceramic Travel Mug',
      sku: 'MUG-032',
      category: 'Drinkware',
      purchase_price: 120,
      selling_price: 240,
      current_stock: 35,
      minimum_stock: 5,
      barcode: '8901234003',
      unit: 'piece',
      supplier_id: supplier?.id || null,
    },
  ]

  for (const prod of sampleProducts) {
    await supabase.from('products').upsert(prod, { onConflict: 'business_id,sku' })
  }

  console.log('\n✓ Supabase demo seeding complete!')
  console.log('------------------------------------------------------')
  console.log(`Demo User:     ${DEMO_EMAIL}`)
  console.log(`Password:      demo12345`)
  console.log(`Business:      Demo Supply Co (ID: ${businessId})`)
  console.log('------------------------------------------------------\n')
}

runSeed().catch((err) => {
  console.error('\nSeed failed:', err.message)
  process.exit(1)
})
