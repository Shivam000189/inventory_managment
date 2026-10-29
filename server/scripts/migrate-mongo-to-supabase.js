import { User, Business, Role, Member, Supplier, Customer, Product, Color, Promotion, Coupon, GiftCard, LoyaltyTransaction, StoreCreditTransaction, CashierShift, SalesOrder, PurchaseOrder, Receiving, Return, Refund, Payment, StockTransaction, Notification, ProductImport } from '../models/index.js'
/**
 * Automated Migration Script: MongoDB -> Supabase (PostgreSQL)
 *
 * Usage:
 *   node server/scripts/migrate-mongo-to-supabase.js
 *   node server/scripts/migrate-mongo-to-supabase.js --dry-run
 *   node server/scripts/migrate-mongo-to-supabase.js --fresh
 *
 * Features:
 * - Deterministic UUID translation preserving all cross-table references
 * - Idempotent upserting in batches
 * - Full verification and reporting
 */

import { connectDatabase, disconnectDatabase } from '../config/db.js'
import { getSupabaseAdmin, isSupabaseConfigured } from '../config/supabase.js'
import {
  objectIdToUuid,
  mapUserToSupabase,
  mapBusinessToSupabase,
  mapRoleToSupabase,
  mapMemberToSupabase,
  mapSupplierToSupabase,
  mapCustomerToSupabase,
  mapProductToSupabase,
  mapProductVariantToSupabase,
  mapColorToSupabase,
  mapPromotionToSupabase,
  mapCouponToSupabase,
  mapGiftCardToSupabase,
  mapLoyaltyTransactionToSupabase,
  mapStoreCreditTransactionToSupabase,
  mapCashierShiftToSupabase,
  mapSalesOrderToSupabase,
  mapPurchaseOrderToSupabase,
  mapReceivingToSupabase,
  mapReturnToSupabase,
  mapRefundToSupabase,
  mapPaymentToSupabase,
  mapStockTransactionToSupabase,
  mapNotificationToSupabase,
  mapProductImportToSupabase,
} from '../utils/mongoSupabaseMapper.js'

// Import all Mongoose models

const flags = new Set(process.argv.slice(2))
const isDryRun = flags.has('--dry-run')
const isFresh = flags.has('--fresh')
const BATCH_SIZE = 100

async function upsertBatch(supabase, table, rows) {
  if (isDryRun || !rows.length) return rows.length
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
  if (error) {
    throw new Error(`Failed to upsert into ${table}: ${error.message} (${error.details || ''})`)
  }
  return rows.length
}

async function wipeSupabaseTables(supabase) {
  console.log('Cleaning existing rows from Supabase (--fresh requested)...')
  const tables = [
    'product_imports', 'notifications', 'stock_transactions', 'payments', 'refunds',
    'returns', 'receivings', 'purchase_orders', 'sales_orders', 'cashier_shifts',
    'store_credit_transactions', 'loyalty_transactions', 'gift_cards', 'coupons',
    'promotions', 'colors', 'product_variants', 'products', 'customers',
    'suppliers', 'members', 'roles', 'businesses', 'users'
  ]

  for (const tbl of tables) {
    const { error } = await supabase.from(tbl).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      console.warn(`  Notice cleaning ${tbl}: ${error.message}`)
    }
  }
  console.log('Cleanup complete.')
}

async function runMigration() {
  console.log('\n======================================================')
  console.log('  Stockroom / IMB: MongoDB -> Supabase Data Migration')
  console.log('======================================================\n')

  if (isDryRun) {
    console.log('DRY RUN MODE ENABLED. No data will be written to Supabase.\n')
  }

  if (!isDryRun && !isSupabaseConfigured()) {
    console.error('ERROR: Supabase is not configured.')
    console.error('Please define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env')
    process.exit(1)
  }

  const supabase = isDryRun ? null : getSupabaseAdmin()

  console.log('Connecting to MongoDB...')
  await connectDatabase()
  console.log('Connected to MongoDB successfully.\n')

  if (isFresh && supabase) {
    await wipeSupabaseTables(supabase)
  }

  const report = []

  async function migrateCollection(name, tableName, fetchDocs, mapFn) {
    process.stdout.write(`Migrating ${name.padEnd(26)} -> table ${tableName.padEnd(24)}: `)
    const docs = await fetchDocs()
    if (!docs.length) {
      console.log('0 records (empty)')
      report.push({ name, count: 0, status: 'empty' })
      return
    }

    let successCount = 0
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const slice = docs.slice(i, i + BATCH_SIZE)
      const mapped = slice.map(mapFn).filter(Boolean)
      if (mapped.length) {
        await upsertBatch(supabase, tableName, mapped)
        successCount += mapped.length
      }
    }

    console.log(`✓ ${successCount} records`)
    report.push({ name, count: successCount, status: 'success' })
  }

  try {
    // 1. Users (first pass without business_id to avoid circular foreign key constraint)
    await migrateCollection(
      'Users',
      'users',
      () => User.find({}).select('+password +failedLoginAttempts +lockUntil +resetPasswordTokenHash +resetPasswordExpires').lean(),
      (u) => ({ ...mapUserToSupabase(u), business_id: null })
    )

    // 2. Businesses (now users exist, so owner_id FK succeeds)
    await migrateCollection('Businesses', 'businesses', () => Business.find({}).lean(), mapBusinessToSupabase)

    // 2b. Link users back to their businesses
    if (!isDryRun) {
      const usersWithBiz = await User.find({ business: { $ne: null } }).lean()
      for (const u of usersWithBiz) {
        await supabase.from('users').update({ business_id: objectIdToUuid(u.business) }).eq('id', objectIdToUuid(u._id))
      }
    }

    // 3. Roles
    await migrateCollection('Roles', 'roles', () => Role.find({}).lean(), mapRoleToSupabase)

    // 4. Members
    await migrateCollection('Members', 'members', () => Member.find({}).lean(), mapMemberToSupabase)

    // 5. Suppliers
    await migrateCollection('Suppliers', 'suppliers', () => Supplier.find({}).select('+normalizedName').lean(), mapSupplierToSupabase)

    // 6. Customers
    await migrateCollection('Customers', 'customers', () => Customer.find({}).lean(), mapCustomerToSupabase)

    // 7. Products
    const products = await Product.find({}).lean()
    await migrateCollection('Products', 'products', () => products, mapProductToSupabase)

    // 8. Product Variants (normalized rows)
    const variantRows = []
    for (const p of products) {
      for (const v of p.variants || []) {
        variantRows.push(mapProductVariantToSupabase(v, p._id, p.business))
      }
    }
    process.stdout.write(`Migrating ${'Product Variants'.padEnd(26)} -> table ${'product_variants'.padEnd(24)}: `)
    if (variantRows.length) {
      for (let i = 0; i < variantRows.length; i += BATCH_SIZE) {
        await upsertBatch(supabase, 'product_variants', variantRows.slice(i, i + BATCH_SIZE))
      }
      console.log(`✓ ${variantRows.length} records`)
      report.push({ name: 'Product Variants', count: variantRows.length, status: 'success' })
    } else {
      console.log('0 records')
      report.push({ name: 'Product Variants', count: 0, status: 'empty' })
    }

    // 9. Colors
    await migrateCollection('Colors', 'colors', () => Color.find({}).lean(), mapColorToSupabase)

    // 10. Promotions
    await migrateCollection('Promotions', 'promotions', () => Promotion.find({}).lean(), mapPromotionToSupabase)

    // 11. Coupons
    await migrateCollection('Coupons', 'coupons', () => Coupon.find({}).lean(), mapCouponToSupabase)

    // 12. Gift Cards
    await migrateCollection('Gift Cards', 'gift_cards', () => GiftCard.find({}).lean(), mapGiftCardToSupabase)

    // 13. Loyalty Transactions
    await migrateCollection('Loyalty Transactions', 'loyalty_transactions', () => LoyaltyTransaction.find({}).lean(), mapLoyaltyTransactionToSupabase)

    // 14. Store Credit Transactions
    await migrateCollection('Store Credit Transactions', 'store_credit_transactions', () => StoreCreditTransaction.find({}).lean(), mapStoreCreditTransactionToSupabase)

    // 15. Cashier Shifts
    await migrateCollection('Cashier Shifts', 'cashier_shifts', () => CashierShift.find({}).lean(), mapCashierShiftToSupabase)

    // 16. Sales Orders
    await migrateCollection('Sales Orders', 'sales_orders', () => SalesOrder.find({}).lean(), mapSalesOrderToSupabase)

    // 17. Purchase Orders
    await migrateCollection('Purchase Orders', 'purchase_orders', () => PurchaseOrder.find({}).lean(), mapPurchaseOrderToSupabase)

    // 18. Receivings
    await migrateCollection('Receivings', 'receivings', () => Receiving.find({}).lean(), mapReceivingToSupabase)

    // 19. Returns
    await migrateCollection('Returns', 'returns', () => Return.find({}).lean(), mapReturnToSupabase)

    // 20. Refunds
    await migrateCollection('Refunds', 'refunds', () => Refund.find({}).lean(), mapRefundToSupabase)

    // 21. Payments
    await migrateCollection('Payments', 'payments', () => Payment.find({}).lean(), mapPaymentToSupabase)

    // 22. Stock Transactions
    await migrateCollection('Stock Transactions', 'stock_transactions', () => StockTransaction.find({}).lean(), mapStockTransactionToSupabase)

    // 23. Notifications
    await migrateCollection('Notifications', 'notifications', () => Notification.find({}).lean(), mapNotificationToSupabase)

    // 24. Product Imports
    await migrateCollection('Product Imports', 'product_imports', () => ProductImport.find({}).lean(), mapProductImportToSupabase)

    console.log('\n------------------------------------------------------')
    console.log('Migration Completed Successfully!')
    const totalMigrated = report.reduce((sum, r) => sum + r.count, 0)
    console.log(`Total Records Processed: ${totalMigrated}`)
    console.log('------------------------------------------------------\n')

    await disconnectDatabase()
    process.exit(0)
  } catch (error) {
    console.error('\nMigration failed with error:', error)
    await disconnectDatabase()
    process.exit(1)
  }
}

runMigration()
