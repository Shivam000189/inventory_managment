import { Supplier } from '../models/index.js'
import { createCrudService } from './crudService.js'
import { ApiError } from '../utils/ApiError.js'
import { requireFields, assert, isEmail } from '../validators/assert.js'

const base = createCrudService(Supplier, {
  searchFields: ['supplierName', 'contactPerson', 'email', 'city'],
  label: 'Supplier',
})

const PHONE = /^[+\d][\d\s()-]{6,}$/
const normalizeName = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')

async function findNameDuplicate(businessId, supplierName, excludedId) {
  const suppliers = await Supplier.find({ business: base.scoped(businessId).business, ...(excludedId ? { _id: { $ne: excludedId } } : {}) }).select('supplierName').lean()
  const normalizedName = normalizeName(supplierName)
  return suppliers.find((supplier) => normalizeName(supplier.supplierName) === normalizedName)
}

function normalize(payload) {
  const out = { ...payload }
  if (payload.name && !payload.supplierName) out.supplierName = String(payload.name).trim()
  if (payload.supplierName) out.supplierName = String(payload.supplierName).trim()
  if (payload.gstin && !payload.taxNumber) out.taxNumber = String(payload.gstin).trim()
  if (payload.taxNumber) out.taxNumber = String(payload.taxNumber).trim()
  if (payload.phone) out.phone = String(payload.phone).trim()
  if (payload.contactPerson) out.contactPerson = String(payload.contactPerson).trim()
  if (payload.email) out.email = String(payload.email).trim().toLowerCase()
  if (payload.address) out.address = String(payload.address).trim()
  if (payload.city) out.city = String(payload.city).trim()
  if (payload.state) out.state = String(payload.state).trim()
  if (payload.paymentTerms) out.paymentTerms = String(payload.paymentTerms).trim()
  if (!out.status) out.status = 'active'
  return out
}

function validate(payload, { partial } = {}) {
  const name = payload.supplierName || payload.name
  if (!partial) {
    assert(Boolean(name && String(name).trim().length > 0), 'Supplier name is required.')
    requireFields(payload, ['phone'])
  }
  if (payload.phone !== undefined && payload.phone !== '') assert(PHONE.test(payload.phone), 'Enter a valid supplier phone number.')
  if (payload.email) assert(isEmail(payload.email), 'Enter a valid supplier email address.')
}

async function create(businessId, payload) {
  const data = normalize(payload)
  validate(data)
  const nameDupe = await findNameDuplicate(businessId, data.supplierName)
  if (nameDupe) throw ApiError.conflict('A supplier with this name already exists.')
  if (data.email) {
    const dupe = await Supplier.findOne({ business: base.scoped(businessId).business, email: String(data.email).toLowerCase() })
    if (dupe) throw ApiError.conflict('A supplier with this email already exists.')
  }
  return base.create(businessId, data)
}

async function update(businessId, id, payload) {
  const data = normalize(payload)
  validate(data, { partial: true })
  if (data.supplierName !== undefined) {
    const duplicate = await findNameDuplicate(businessId, data.supplierName, id)
    if (duplicate) throw ApiError.conflict('A supplier with this name already exists.')
  }
  return base.update(businessId, id, data)
}

async function archive(businessId, id) {
  return base.update(businessId, id, { status: 'archived' })
}

export const supplierService = { ...base, create, update, archive }
