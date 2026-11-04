import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import * as prescriptionController from '../controllers/prescriptionController.js'

const router = Router()

router.use(authenticate)

router.get('/', prescriptionController.listPrescriptionsController)
router.post('/', prescriptionController.createPrescriptionController)
router.get('/:id', prescriptionController.getPrescriptionController)

export default router

