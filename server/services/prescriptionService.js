import { getPgPool } from '../config/supabase.js'
import { ApiError } from '../utils/ApiError.js'
import { toObjectId, assert } from '../validators/assert.js'

export async function listPrescriptions(businessId, { search, status, limit = 100 } = {}) {
  const pool = getPgPool()
  const bId = toObjectId(businessId, 'businessId')

  let sql = `
    SELECT 
      rx.id,
      rx.business_id AS "businessId",
      rx.prescription_number AS "prescriptionNumber",
      rx.doctor_name AS "doctorName",
      rx.doctor_reg_number AS "doctorRegNumber",
      rx.hospital_name AS "hospitalName",
      rx.patient_name AS "patientName",
      rx.patient_phone AS "patientPhone",
      rx.patient_age AS "patientAge",
      rx.patient_gender AS "patientGender",
      rx.prescription_date AS "prescriptionDate",
      rx.diagnosis,
      rx.notes,
      rx.sales_order_id AS "salesOrderId",
      rx.items,
      rx.status,
      rx.created_at AS "createdAt",
      rx.updated_at AS "updatedAt",
      so.order_number AS "salesOrderNumber",
      so.total_amount AS "orderTotal"
    FROM prescriptions rx
    LEFT JOIN sales_orders so ON so.id = rx.sales_order_id
    WHERE rx.business_id = $1
  `
  const params = [bId]
  let pIdx = 2

  if (search && search.trim()) {
    const q = `%${search.trim().toLowerCase()}%`
    sql += ` AND (
      LOWER(rx.prescription_number) LIKE $${pIdx} OR 
      LOWER(rx.doctor_name) LIKE $${pIdx} OR 
      LOWER(rx.patient_name) LIKE $${pIdx} OR 
      LOWER(rx.patient_phone) LIKE $${pIdx}
    )`
    params.push(q)
    pIdx++
  }

  if (status && status !== 'all') {
    sql += ` AND rx.status = $${pIdx++}`
    params.push(status)
  }

  sql += ` ORDER BY rx.prescription_date DESC, rx.created_at DESC LIMIT $${pIdx}`
  params.push(Math.min(Number(limit) || 100, 500))

  const res = await pool.query(sql, params)
  return res.rows
}

export async function createPrescription(businessId, payload) {
  const pool = getPgPool()
  const bId = toObjectId(businessId, 'businessId')

  const doctorName = String(payload.doctorName || '').trim()
  assert(doctorName, 400, 'Doctor name is required.')
  const patientName = String(payload.patientName || '').trim()
  assert(patientName, 400, 'Patient name is required.')

  const rxCountRes = await pool.query(
    'SELECT COUNT(*) FROM prescriptions WHERE business_id = $1',
    [bId],
  )
  const count = Number(rxCountRes.rows[0]?.count || 0) + 1
  const rxNum = payload.prescriptionNumber || `RX-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`

  const sql = `
    INSERT INTO prescriptions (
      business_id, prescription_number, doctor_name, doctor_reg_number, hospital_name,
      patient_name, patient_phone, patient_age, patient_gender, prescription_date,
      diagnosis, notes, sales_order_id, items, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `
  const res = await pool.query(sql, [
    bId,
    rxNum,
    doctorName,
    payload.doctorRegNumber || '',
    payload.hospitalName || '',
    patientName,
    payload.patientPhone || '',
    payload.patientAge ? Number(payload.patientAge) : null,
    payload.patientGender || '',
    payload.prescriptionDate || new Date().toISOString().slice(0, 10),
    payload.diagnosis || '',
    payload.notes || '',
    payload.salesOrderId || null,
    JSON.stringify(payload.items || []),
    payload.status || 'Active',
  ])

  return res.rows[0]
}

export async function getPrescription(businessId, id) {
  const pool = getPgPool()
  const bId = toObjectId(businessId, 'businessId')
  const rxId = toObjectId(id, 'id')

  const res = await pool.query(
    `SELECT rx.*, so.order_number, so.total_amount 
     FROM prescriptions rx 
     LEFT JOIN sales_orders so ON so.id = rx.sales_order_id 
     WHERE rx.business_id = $1 AND rx.id = $2`,
    [bId, rxId],
  )
  if (res.rows.length === 0) throw ApiError.notFound('Prescription not found.')
  return res.rows[0]
}

