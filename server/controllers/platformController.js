/**
 * platformController.js
 *
 * Express route handlers for the platform super-admin area.
 * Each controller wraps its service call in asyncHandler to propagate
 * errors to the centralized error-handling middleware.
 */

import { asyncHandler } from '../utils/asyncHandler.js'
import {
  fetchPlatformOverview,
  fetchPlatformBusinesses,
  fetchPlatformBusinessAdmins,
  createPlatformBusiness,
  setPlatformBusinessStatus,
  setPlatformBusinessAdminStatus,
} from '../services/platformService.js'
import { created, ok } from '../utils/respond.js'

// ---------------------------------------------------------------------------
// GET /api/platform/overview
// ---------------------------------------------------------------------------

export const overviewController = asyncHandler(async (_req, res) => {
  const data = await fetchPlatformOverview()
  res.json({ success: true, data })
})

// ---------------------------------------------------------------------------
// GET /api/platform/businesses
// ---------------------------------------------------------------------------

export const businessesController = asyncHandler(async (req, res) => {
  const result = await fetchPlatformBusinesses(req.query)
  res.json({ success: true, data: result })
})

export const createBusinessController = asyncHandler(async (req, res) => {
  const result = await createPlatformBusiness(req.user, req.body, req)
  created(res, result, 'Business and Business Admin created. Store the temporary password securely; it is shown only once.')
})

export const businessStatusController = asyncHandler(async (req, res) => {
  const result = await setPlatformBusinessStatus(req.user, req.params.businessId, req.body, req)
  ok(res, result, 'Business status updated.')
})

export const businessAdminStatusController = asyncHandler(async (req, res) => {
  const result = await setPlatformBusinessAdminStatus(req.user, req.params.userId, req.body, req)
  ok(res, result, 'Business Admin status updated.')
})

// ---------------------------------------------------------------------------
// GET /api/platform/business-admins
// ---------------------------------------------------------------------------

export const businessAdminsController = asyncHandler(async (req, res) => {
  const result = await fetchPlatformBusinessAdmins(req.query)
  res.json({ success: true, data: result })
})
