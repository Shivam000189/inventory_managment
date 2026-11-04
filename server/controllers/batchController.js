import { asyncHandler } from '../utils/asyncHandler.js'
import { ok, created } from '../utils/respond.js'
import * as batchService from '../services/batchService.js'

export const listBatchesController = asyncHandler(async (req, res) => {
  const result = await batchService.listBatches(req.businessId, req.query)
  ok(res, result)
})

export const createBatchController = asyncHandler(async (req, res) => {
  const result = await batchService.createBatch(
    req.businessId,
    req.body,
    req.user?.name || req.user?.email || 'user',
  )
  created(res, result, 'Batch created successfully.')
})

export const disposeBatchController = asyncHandler(async (req, res) => {
  const result = await batchService.disposeBatch(
    req.businessId,
    req.params.id,
    req.body,
    req.user?.name || req.user?.email || 'user',
  )
  ok(res, result)
})

export const getPharmacySummaryController = asyncHandler(async (req, res) => {
  const result = await batchService.getPharmacySummary(req.businessId)
  ok(res, result)
})

