import { Router } from 'express'
import * as controller from '../controllers/purchaseOrderController.js'
import { requireAnyPermission } from '../middleware/auth.js'

export const purchaseOrderRoutes = Router()

purchaseOrderRoutes.get('/', requireAnyPermission('view_inventory', 'manage_replenishment', 'manage_purchase_orders'), controller.listController)
purchaseOrderRoutes.post('/', requireAnyPermission('manage_purchase_orders', 'manage_replenishment'), controller.createController)
purchaseOrderRoutes.get('/:id', requireAnyPermission('view_inventory', 'manage_replenishment', 'manage_purchase_orders'), controller.getController)
purchaseOrderRoutes.put('/:id', requireAnyPermission('manage_purchase_orders', 'manage_replenishment'), controller.updateController)
purchaseOrderRoutes.patch('/:id', requireAnyPermission('manage_purchase_orders', 'manage_replenishment'), controller.updateController)
purchaseOrderRoutes.patch('/:id/status', requireAnyPermission('manage_purchase_orders', 'manage_replenishment'), controller.statusController)
// Deprecated alias preserved for backward compatibility
purchaseOrderRoutes.post('/:id/status', requireAnyPermission('manage_purchase_orders', 'manage_replenishment'), controller.statusController)
