import { ApiError } from '../utils/ApiError.js'
import { isProduction } from '../config/env.js'

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`))
}

// eslint-disable-next-line no-unused-vars -- Express requires the 4-arg signature.
export function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || 500
  let message = error.message || 'Something went wrong.'
  let details

  if (error.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation failed.'
    details = error.errors ? Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, value?.message || value])) : undefined
  } else if (error.name === 'CastError') {
    statusCode = 400
    message = `Invalid ${error.path}: ${error.value}`
  } else if (error.code === 11000 || error.code === '23505') {
    statusCode = 409
    message = error.detail || `Duplicate entry for a unique field.`
  } else if (error.code === '23503') {
    statusCode = 400
    message = `Referenced record does not exist (${error.detail || ''}).`
  } else if (error.name === 'MulterError') {
    statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    message = error.code === 'LIMIT_FILE_SIZE' ? 'The upload exceeds the 15 MB file limit.' : `Invalid upload: ${error.message}`
  }

  const unexpected = statusCode >= 500 && !error.isOperational

  if (unexpected) {
    console.error(error)
    if (isProduction) message = 'Something went wrong. Please try again.'
  } else if (statusCode >= 500) {
    console.warn(`${statusCode} ${message}`)
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { errors: details } : {}),
    ...(!isProduction && unexpected ? { stack: error.stack } : {}),
  })
}
