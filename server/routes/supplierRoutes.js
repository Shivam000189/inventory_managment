import { Router } from 'express'
import { supplierService } from '../services/supplierService.js'
import { resourceController } from '../controllers/resourceController.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/respond.js'
import { requireAnyPermission } from '../middleware/auth.js'

const controller = resourceController(supplierService, {
  messages: { created: 'Supplier added.', updated: 'Supplier updated.', removed: 'Supplier removed.' },
})

export const supplierRoutes = Router()

supplierRoutes.get('/', requireAnyPermission('view_inventory', 'manage_suppliers'), controller.list)
supplierRoutes.post('/', requireAnyPermission('manage_suppliers', 'edit_product'), controller.create)
supplierRoutes.get('/:id', requireAnyPermission('view_inventory', 'manage_suppliers'), controller.get)
supplierRoutes.put('/:id', requireAnyPermission('manage_suppliers', 'edit_product'), controller.update)
supplierRoutes.patch('/:id', requireAnyPermission('manage_suppliers', 'edit_product'), controller.update)
supplierRoutes.patch('/:id/archive', requireAnyPermission('manage_suppliers', 'edit_product'), asyncHandler(async (req, res) => {
  ok(res, await supplierService.archive(req.businessId, req.params.id), 'Supplier archived.')
}))
supplierRoutes.delete('/:id', requireAnyPermission('manage_suppliers', 'edit_product'), controller.remove)
