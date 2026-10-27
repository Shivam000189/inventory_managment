import { isDatabaseConnected } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * Guards data routes: if Supabase PostgreSQL is not connected yet, return a clear 503.
 */
export function requireDatabase(_req, _res, next) {
  if (isDatabaseConnected()) return next()
  next(
    new ApiError(
      503,
      'The database is not connected. Please ensure Supabase credentials (SUPABASE_URL and DATABASE_URL) in server/.env are valid, then try again.',
    ),
  )
}
