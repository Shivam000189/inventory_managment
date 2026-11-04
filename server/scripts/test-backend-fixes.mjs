import { withTransaction, getDatabaseStatus } from '../config/db.js'
import { getPgPool } from '../config/supabase.js'
import { Product, StockTransaction, User, DEFAULT_PERMISSIONS } from '../models/index.js'
import { normalizeInventoryOperation, permissionForInventoryOperation, recordOperation } from '../services/inventoryService.js'
import { notificationEvents } from '../services/notificationEvents.js'
import { listCatalog, listCustomers, listInvoices } from '../services/posService.js'
import { listReturns, listEligibleOrders } from '../services/returnService.js'
import { listReceivings } from '../services/receivingService.js'
import { history as listHistory } from '../services/productImportService.js'

let passed = 0
let failed = 0

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`)
    failed++
    throw new Error(message)
  } else {
    console.log(`✅ PASS: ${message}`)
    passed++
  }
}

async function run() {
  console.log('=== Running Comprehensive Backend Fix Verification Suite ===\n')

  // 1. Database Connection & Readiness
  console.log('--- 1. Database Health & Readiness ---')
  const status = getDatabaseStatus()
  assert(status.driver === 'supabase', 'Driver is supabase')
  const pool = getPgPool()
  assert(Boolean(pool), 'Direct PostgreSQL pool is configured')
  const readyCheck = await pool.query('SELECT 1 as ready')
  assert(readyCheck.rows[0].ready === 1, 'PostgreSQL direct ping succeeded')

  // 2. Transaction Rollback & No Replay
  console.log('\n--- 2. Transaction Semantics & Rollback ---')
  let workCalls = 0
  let caughtError = false
  try {
    await withTransaction(async (session) => {
      workCalls++
      await session.query('SELECT 1')
      throw new Error('Simulated failure during business mutation')
    })
  } catch (err) {
    caughtError = true
    assert(err.message === 'Simulated failure during business mutation', 'Exact work error rethrown')
  }
  assert(caughtError, 'Transaction failed and threw')
  assert(workCalls === 1, 'Work callback was invoked exactly once with no rerun/replay')

  // 3. Normalizer & Permissions
  console.log('\n--- 3. Operation Normalizer & Permissions ---')
  assert(normalizeInventoryOperation('stock_in') === 'stock_in', 'stock_in normalized')
  assert(normalizeInventoryOperation('stock in') === 'stock_in', 'stock in alias normalized')
  assert(normalizeInventoryOperation('inward') === 'stock_in', 'inward alias normalized')
  assert(normalizeInventoryOperation('stock-out') === 'stock_out', 'stock-out alias normalized')
  assert(normalizeInventoryOperation('outward') === 'stock_out', 'outward alias normalized')
  assert(normalizeInventoryOperation('adjustments') === 'adjustment', 'adjustments alias normalized')

  assert(permissionForInventoryOperation('stock_in') === 'stock_in', 'stock_in permission is stock_in')
  assert(permissionForInventoryOperation('stock_out') === 'stock_out', 'stock_out permission is stock_out')
  assert(permissionForInventoryOperation('adjustment') === 'edit_product', 'adjustment permission is edit_product')

  let invalidOpCaught = false
  try {
    normalizeInventoryOperation('hacked_action')
  } catch (err) {
    invalidOpCaught = true
    assert(err.statusCode === 400, 'Invalid operation rejects with HTTP 400')
  }
  assert(invalidOpCaught, 'Invalid operation correctly rejected')

  // 4. Default Permissions Catalog
  console.log('\n--- 4. Canonical Permissions Catalog ---')
  assert(DEFAULT_PERMISSIONS.includes('manage_suppliers'), 'manage_suppliers in DEFAULT_PERMISSIONS')
  assert(DEFAULT_PERMISSIONS.includes('manage_customers'), 'manage_customers in DEFAULT_PERMISSIONS')
  assert(DEFAULT_PERMISSIONS.includes('manage_purchase_orders'), 'manage_purchase_orders in DEFAULT_PERMISSIONS')
  assert(DEFAULT_PERMISSIONS.includes('manage_payments'), 'manage_payments in DEFAULT_PERMISSIONS')

  // 5. Non-Blocking Notifications
  console.log('\n--- 5. Non-Blocking Notifications ---')
  const dummyBusinessId = '00000000-0000-0000-0000-000000000001'
  const notifResult = await notificationEvents.purchaseCreated(dummyBusinessId, {
    orderNumber: 'PO-TEST-001',
    supplierName: 'Test Supplier',
    items: [],
  })
  assert(notifResult !== undefined, 'Notification call completed without throwing error')

  // 6. Pagination Standard Shape across List Endpoints
  console.log('\n--- 6. Pagination Shape Standard ---')
  const catalogRes = await listCatalog(dummyBusinessId, { page: 1, limit: 10 })
  assert(Array.isArray(catalogRes.items), 'listCatalog returns items array')
  assert(typeof catalogRes.meta?.page === 'number', 'listCatalog returns meta.page')
  assert(typeof catalogRes.meta?.limit === 'number', 'listCatalog returns meta.limit')
  assert(typeof catalogRes.meta?.total === 'number', 'listCatalog returns meta.total')
  assert(typeof catalogRes.meta?.pages === 'number', 'listCatalog returns meta.pages')

  const customersRes = await listCustomers(dummyBusinessId, { page: 1, limit: 10 })
  assert(Array.isArray(customersRes.items) && customersRes.meta, 'listCustomers returns { items, meta }')

  const invoicesRes = await listInvoices(dummyBusinessId, { page: 1, limit: 10 })
  assert(Array.isArray(invoicesRes.items) && invoicesRes.meta, 'listInvoices returns { items, meta }')

  const returnsRes = await listReturns(dummyBusinessId, { page: 1, limit: 10 })
  assert(Array.isArray(returnsRes.items) && returnsRes.meta, 'listReturns returns { items, meta }')

  const eligibleRes = await listEligibleOrders(dummyBusinessId, { page: 1, limit: 10 })
  assert(Array.isArray(eligibleRes.items) && eligibleRes.meta, 'listEligibleOrders returns { items, meta }')

  const receivingsRes = await listReceivings(dummyBusinessId, { page: 1, limit: 10 })
  assert(Array.isArray(receivingsRes.items) && receivingsRes.meta, 'listReceivings returns { items, meta }')

  const historyRes = await listHistory(dummyBusinessId, { page: 1, limit: 10 })
  assert(Array.isArray(historyRes.items) && historyRes.meta, 'productImport history returns { items, meta }')

  console.log(`\n======================================================`)
  console.log(`Verification Complete: ${passed} passed, ${failed} failed`)
  console.log(`======================================================\n`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((err) => {
  console.error('Fatal error during test run:', err)
  process.exit(1)
})
