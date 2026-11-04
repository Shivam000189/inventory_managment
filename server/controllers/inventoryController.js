import { asyncHandler } from '../utils/asyncHandler.js'
import { ok, created } from '../utils/respond.js'
import * as inventoryService from '../services/inventoryService.js'
import { notificationEvents } from '../services/notificationEvents.js'

export const listTransactionsController = asyncHandler(async (req, res) => {
  ok(res, await inventoryService.listTransactions(req.businessId, req.query))
})

export const recordOperationController = asyncHandler(async (req, res) => {
  const result = await inventoryService.recordOperation(req.businessId, {
    ...req.body,
    operation: req.normalizedOperation || req.body.section || req.body.type,
    createdBy: req.user.name || req.user.email,
  })

  // Best-effort notification: failure to persist notification must not fail the committed primary operation
  try {
    await notificationEvents.inventory(req.businessId, result)
  } catch (err) {
    console.warn('[Notification] Inventory notification dispatch failed:', err.message)
  }

  created(res, result, 'Inventory operation recorded.')
})
