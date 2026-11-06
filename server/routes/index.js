import { Router } from 'express'
import { authenticate, requireBusiness, requireModule, requirePermission, requirePlatformRole } from '../middleware/auth.js'
import { requireDatabase } from '../middleware/database.js'
import { getDatabaseStatus } from '../config/db.js'
import { getPgPool } from '../config/supabase.js'
import { authRoutes } from './authRoutes.js'
import { businessRoutes } from './businessRoutes.js'
import { productRoutes } from './productRoutes.js'
import { supplierRoutes } from './supplierRoutes.js'
import { customerRoutes } from './customerRoutes.js'
import { purchaseOrderRoutes } from './purchaseOrderRoutes.js'
import { salesOrderRoutes } from './salesOrderRoutes.js'
import { receivingRoutes } from './receivingRoutes.js'
import { paymentRoutes } from './paymentRoutes.js'
import { inventoryRoutes } from './inventoryRoutes.js'
import { returnRoutes } from './returnRoutes.js'
import { userRoutes } from './userRoutes.js'
import { reportController } from '../controllers/reportController.js'
import { notificationRoutes } from './notificationRoutes.js'
import { posRoutes } from './posRoutes.js'
import { productImportRoutes } from './productImportRoutes.js'
import * as productImportController from '../controllers/productImportController.js'
import { colorRoutes } from './colorRoutes.js'
import { clothingRoutes } from './clothingRoutes.js'
import { platformRoutes } from './platformRoutes.js'
import batchRoutes from './batchRoutes.js'
import prescriptionRoutes from './prescriptionRoutes.js'

export const api = Router()

// Health check never depends on the database being up.
api.get('/health', (_req, res) => {
  const dbStatus = getDatabaseStatus()
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'stockroom-api',
      driver: dbStatus.driver,
      db: dbStatus[dbStatus.driver] || 'unknown',
      databases: dbStatus,
    },
  })
})

// Readiness check with bounded PostgreSQL ping (3000ms timeout)
api.get('/ready', async (_req, res) => {
  const pool = getPgPool()
  if (!pool) {
    return res.status(503).json({
      status: 'unready',
      database: 'not_configured',
      error: 'Database connection pool is not configured.',
    })
  }

  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database ping timed out')), 3000)
    })
    await Promise.race([
      pool.query('SELECT 1'),
      timeoutPromise,
    ])

    res.json({
      status: 'ready',
      database: 'connected',
    })
  } catch (error) {
    res.status(503).json({
      status: 'unready',
      database: 'disconnected',
      error: error.message || 'Database ping failed',
    })
  }
})

// Auth + business routes still need the database.
api.use('/auth', requireDatabase, authRoutes)
api.use('/businesses', requireDatabase, businessRoutes)

// Platform routes: authenticated super-admin only, intentionally cross-tenant (no requireBusiness).
const platformGuard = [requireDatabase, authenticate, requirePlatformRole('super_admin')]
api.use('/platform', platformGuard, platformRoutes)

// Public template download endpoint (returns Excel .xlsx or PDF for bulk importing products)
api.get('/product-imports/template', productImportController.downloadTemplate)

// Business-scoped resources: DB up + authenticated user + completed business workspace.
const guard = [requireDatabase, authenticate, requireBusiness]
api.use('/products', guard, requireModule('products'), productRoutes)
api.use('/suppliers', guard, requireModule('suppliers'), supplierRoutes)
api.use('/customers', guard, requireModule('customers'), customerRoutes)
api.use('/purchase-orders', guard, requireModule('purchases'), purchaseOrderRoutes)
api.use('/sales-orders', guard, requireModule('sales'), salesOrderRoutes)
api.use('/receiving', guard, requireModule('purchases'), receivingRoutes)
api.use('/payments', guard, requireModule('payments'), paymentRoutes)
api.use('/inventory', guard, requireModule('inventory'), inventoryRoutes)
api.use('/returns', guard, requireModule('sales'), returnRoutes)
api.use('/users', guard, requireModule('team'), userRoutes)
api.get('/reports/summary', guard, requireModule('reports'), requirePermission('view_reports'), reportController)
api.use('/notifications', guard, notificationRoutes)
api.use('/pos', guard, requireModule('pos'), posRoutes)
api.use('/product-imports', guard, requireModule('products'), productImportRoutes)
api.use('/colors', guard, requireModule('colors'), colorRoutes)
api.use('/clothing', guard, clothingRoutes)
api.use('/batches', guard, batchRoutes)
api.use('/prescriptions', guard, prescriptionRoutes)
