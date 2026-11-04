import { Router } from 'express'
import * as controller from '../controllers/paymentController.js'
import { requireAnyPermission } from '../middleware/auth.js'

export const paymentRoutes = Router()

paymentRoutes.get('/', requireAnyPermission('view_reports', 'create_order', 'manage_payments'), controller.listController)
paymentRoutes.post('/', requireAnyPermission('manage_payments', 'create_order', 'process_pos_sale'), controller.createController)
