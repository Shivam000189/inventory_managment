import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import * as batchController from '../controllers/batchController.js'

const router = Router()

router.use(authenticate)

router.get('/', batchController.listBatchesController)
router.post('/', batchController.createBatchController)
router.post('/:id/dispose', batchController.disposeBatchController)
router.get('/summary', batchController.getPharmacySummaryController)

export default router

