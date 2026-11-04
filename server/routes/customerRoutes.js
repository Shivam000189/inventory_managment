import { Router } from 'express'
import { customerService } from '../services/customerService.js'
import { resourceController } from '../controllers/resourceController.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/respond.js'
import { requirePermission, requireAnyPermission } from '../middleware/auth.js'

const controller = resourceController(customerService, {
  messages: { created: 'Customer added.', updated: 'Customer updated.', removed: 'Customer removed.' },
})

export const customerRoutes = Router()

customerRoutes.get('/', requireAnyPermission('create_order', 'view_reports', 'manage_customers'), controller.list)
customerRoutes.post('/', requireAnyPermission('manage_customers', 'create_order'), controller.create)
customerRoutes.get('/:id', requireAnyPermission('create_order', 'view_reports', 'manage_customers'), controller.get)
customerRoutes.put('/:id', requireAnyPermission('manage_customers', 'create_order'), controller.update)
customerRoutes.patch('/:id', requireAnyPermission('manage_customers', 'create_order'), controller.update)
customerRoutes.patch('/:id/archive', requirePermission('manage_customers'), asyncHandler(async (req, res) => {
  ok(res, await customerService.archive(req.businessId, req.params.id), 'Customer archived.')
}))
customerRoutes.delete('/:id', requirePermission('manage_customers'), controller.remove)
