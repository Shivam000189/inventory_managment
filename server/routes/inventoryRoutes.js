import { Router } from 'express'
import * as controller from '../controllers/inventoryController.js'
import { requirePermission } from '../middleware/auth.js'
import { normalizeInventoryOperation, permissionForInventoryOperation } from '../services/inventoryService.js'

export const inventoryRoutes = Router()

inventoryRoutes.get('/transactions', requirePermission('view_inventory'), controller.listTransactionsController)

inventoryRoutes.post(
  '/operations',
  (req, res, next) => {
    try {
      const rawOp = req.body?.section || req.body?.operation || req.body?.type
      const normalized = normalizeInventoryOperation(rawOp)
      req.normalizedOperation = normalized
      const requiredPermission = permissionForInventoryOperation(normalized)
      return requirePermission(requiredPermission)(req, res, next)
    } catch (err) {
      return next(err)
    }
  },
  controller.recordOperationController,
)
