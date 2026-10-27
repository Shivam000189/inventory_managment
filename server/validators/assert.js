import { ApiError } from '../utils/ApiError.js'
import { objectIdToUuid } from '../utils/mongoSupabaseMapper.js'

export function assert(condition, message, statusCode = 400) {
  if (!condition) throw new ApiError(statusCode, message)
}

export function requireFields(body, fields) {
  const missing = fields.filter((field) => {
    const value = body?.[field]
    return value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
  })
  assert(missing.length === 0, `Missing required field(s): ${missing.join(', ')}`)
}

export function toObjectId(value, label = 'id') {
  if (!value) throw new ApiError(400, `Invalid ${label}.`)
  const str = String(value?._id || value?.id || value).trim()
  assert(str.length > 0, `Invalid ${label}.`)
  const uuid = objectIdToUuid(str)
  assert(Boolean(uuid), `Invalid ${label}.`)
  return uuid
}

export function toNumber(value, label, { min, integer } = {}) {
  const num = Number(value)
  assert(Number.isFinite(num), `${label} must be a number.`)
  assert(min === undefined || num >= min, `${label} must be at least ${min}.`)
  assert(!integer || Number.isInteger(num), `${label} must be a whole number.`)
  return num
}

export function isEmail(value) {
  return /^\S+@\S+\.\S+$/.test(String(value || ''))
}
