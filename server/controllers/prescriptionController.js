import { asyncHandler } from '../utils/asyncHandler.js'
import { ok, created } from '../utils/respond.js'
import * as prescriptionService from '../services/prescriptionService.js'

export const listPrescriptionsController = asyncHandler(async (req, res) => {
  const result = await prescriptionService.listPrescriptions(req.businessId, req.query)
  ok(res, result)
})

export const createPrescriptionController = asyncHandler(async (req, res) => {
  const result = await prescriptionService.createPrescription(req.businessId, req.body)
  created(res, result, 'Prescription recorded.')
})

export const getPrescriptionController = asyncHandler(async (req, res) => {
  const result = await prescriptionService.getPrescription(req.businessId, req.params.id)
  ok(res, result)
})

