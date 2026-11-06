import { asyncHandler } from '../utils/asyncHandler.js'
import { created, ok } from '../utils/respond.js'
import * as productImportService from '../services/productImportService.js'
import * as templateService from '../services/importTemplateService.js'
import { Business } from '../models/index.js'

export const extract = asyncHandler(async (req, res) => ok(res, await productImportService.extract(req.businessId, req.file)))
export const confirm = asyncHandler(async (req, res) => created(res, await productImportService.confirm(req.businessId, req.body, { id: req.auth.userId, name: req.user.name || req.user.email }), 'Product import completed.'))
export const history = asyncHandler(async (req, res) => ok(res, await productImportService.history(req.businessId, req.query)))

export const downloadTemplate = asyncHandler(async (req, res) => {
  const format = String(req.query.format || 'xlsx').toLowerCase()
  let industry = req.query.industry
  let businessName = req.query.businessName || req.query.store || ''

  if (req.businessId && !businessName) {
    try {
      const business = await Business.findById(req.businessId).lean()
      if (business) {
        if (!industry) industry = business.industry
        businessName = business.name || ''
      }
    } catch {}
  }

  if (format === 'pdf') {
    const { filename, buffer } = await templateService.generatePdfTemplate(industry, businessName)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.send(buffer)
  }

  // Default to xlsx
  const { filename, buffer } = await templateService.generateExcelTemplate(industry, businessName)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  return res.send(buffer)
})
