import { Business } from '../models/index.js'
import { ApiError } from '../utils/ApiError.js'
import { normalizeConfigValue, resolveBusinessCapabilities } from '../shared/industryConfig.js'

function presentBusiness(business) {
  const data = business.toJSON()
  const settings = data.settings || {}
  return {
    ...data,
    ...settings,
    drugLicenseNumber: settings.drugLicenseNumber || data.drugLicenseNumber || '',
    drugLicense20B: settings.drugLicense20B || data.drugLicense20B || '',
    drugLicense21B: settings.drugLicense21B || data.drugLicense21B || '',
    pharmacistInCharge: settings.pharmacistInCharge || data.pharmacistInCharge || '',
    upiId: settings.upiId || data.upiId || '',
    capabilities: resolveBusinessCapabilities(data),
  }
}

export async function getBusiness(businessId) {
  const business = await Business.findById(businessId)
  if (!business) throw ApiError.notFound('Business not found.')
  return presentBusiness(business)
}

export async function updateBusiness(businessId, payload = {}) {
  const business = await Business.findById(businessId)
  if (!business) throw ApiError.notFound('Business not found.')
  const fields = ['name', 'industry', 'businessType', 'phone', 'email', 'address', 'city', 'state', 'country', 'currency', 'gstin', 'enabledModules']
  for (const field of fields) {
    if (payload[field] !== undefined) business[field] = ['industry', 'businessType'].includes(field) ? normalizeConfigValue(payload[field]) : typeof payload[field] === 'string' ? payload[field].trim() : payload[field]
  }

  const settingsObj = { ...(business.settings?.toObject?.() || business.settings || {}) }
  if (payload.settings && typeof payload.settings === 'object') {
    Object.assign(settingsObj, payload.settings)
  }
  const complianceFields = ['drugLicenseNumber', 'drugLicense20B', 'drugLicense21B', 'pharmacistInCharge', 'upiId', 'taxEnabled', 'defaultGstRate', 'allowNegativeStock', 'lowStockThreshold']
  for (const cf of complianceFields) {
    if (payload[cf] !== undefined) {
      settingsObj[cf] = payload[cf]
    }
  }
  business.settings = settingsObj

  await business.save()
  return presentBusiness(business)
}
