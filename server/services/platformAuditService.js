import { objectIdToUuid } from '../utils/mongoSupabaseMapper.js'

const SECRET_FIELD = /password|token|secret|hash|credential|cookie/i

function stripSensitive(value) {
  if (Array.isArray(value)) return value.map(stripSensitive)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SECRET_FIELD.test(key))
      .map(([key, item]) => [key, stripSensitive(item)]),
  )
}

export async function insertPlatformAuditEvent(client, {
  actorUserId,
  action,
  targetType,
  targetId,
  businessId = null,
  metadata = {},
  request,
}) {
  await client.query(
    `INSERT INTO platform_audit_events
       (actor_user_id, action, target_type, target_id, business_id, metadata,
        request_id, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      objectIdToUuid(actorUserId),
      action,
      targetType || null,
      targetId ? objectIdToUuid(targetId) : null,
      businessId ? objectIdToUuid(businessId) : null,
      JSON.stringify(stripSensitive(metadata)),
      request?.id || null,
      request?.ip || null,
      String(request?.get?.('user-agent') || '').slice(0, 512) || null,
    ],
  )
}
