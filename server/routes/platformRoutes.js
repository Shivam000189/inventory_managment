/**
 * platformRoutes.js
 *
 * Routes for the platform super-admin area.
 * These routes intentionally skip requireBusiness — platform queries
 * are cross-tenant and super-admins may not own any business.
 *
 * Authentication and platform-role authorization are applied by the
 * platformGuard array in routes/index.js before this router is mounted.
 */

import { Router } from 'express'
import {
  overviewController,
  businessesController,
  businessAdminsController,
  createBusinessController,
  businessStatusController,
  businessAdminStatusController,
} from '../controllers/platformController.js'

export const platformRoutes = Router()

/**
 * GET /api/platform/overview
 * Returns aggregate platform metrics (counts of businesses, admins, team members).
 */
platformRoutes.get('/overview', overviewController)
platformRoutes.post('/businesses', createBusinessController)

/**
 * GET /api/platform/businesses
 * Returns a paginated, searchable list of all businesses on the platform.
 *
 * Query params:
 *   page         number (default 1)
 *   limit        number (default 20, max 100)
 *   q            string — free-text search on business name, email, owner email
 *   industry     string — exact match (must be a valid schema industry value)
 *   createdFrom  ISO date string — inclusive lower bound on created_at
 *   createdTo    ISO date string — inclusive upper bound on created_at
 */
platformRoutes.get('/businesses', businessesController)
platformRoutes.patch('/businesses/:businessId/status', businessStatusController)

/**
 * GET /api/platform/business-admins
 * Returns a paginated, searchable list of owner-role users.
 *
 * Query params:
 *   page             number (default 1)
 *   limit            number (default 20, max 100)
 *   q                string — free-text search on Business Admin name/email and business name/email
 *   withoutBusiness  'true' | '1' — filter to owners who have not completed setup
 */
platformRoutes.get('/business-admins', businessAdminsController)
platformRoutes.patch('/business-admins/:userId/status', businessAdminStatusController)
