import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/respond.js'
import * as businessService from '../services/businessService.js'

export const getMyBusinessController = asyncHandler(async (req, res) => {
  ok(res, await businessService.getBusiness(req.businessId))
})

export const updateMyBusinessController = asyncHandler(async (req, res) => {
  ok(res, await businessService.updateBusiness(req.businessId, req.body), 'Business profile saved.')
})
