/**
 * Inventory UI utilities for vibrant component styling & status mapping
 */

const AVATAR_COLORS = [
  'avatar-blue',
  'avatar-purple',
  'avatar-green',
  'avatar-amber',
  'avatar-rose',
  'avatar-cyan',
]

/**
 * Returns a deterministic, vibrant avatar color class based on the product name or identifier.
 */
export function getProductAvatarClass(name = '') {
  const str = String(name || '').trim()
  if (!str) return 'avatar-blue'
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/**
 * Maps stock level to semantic state: 'out' | 'low' | 'in'
 */
export function getStockLevelState(currentStock, minimumStock = 10) {
  const stock = Number(currentStock || 0)
  const min = Number(minimumStock || 10)
  if (stock <= 0) return 'out'
  if (stock <= min) return 'low'
  return 'in'
}

/**
 * Maps stock level to badge tone: 'danger' | 'warning' | 'success'
 */
export function getStockBadgeTone(currentStock, minimumStock = 10) {
  const state = getStockLevelState(currentStock, minimumStock)
  if (state === 'out') return 'danger'
  if (state === 'low') return 'warning'
  return 'success'
}

/**
 * Maps stock level to human status label
 */
export function getStockStatusLabel(currentStock, minimumStock = 10) {
  const state = getStockLevelState(currentStock, minimumStock)
  if (state === 'out') return 'Out of Stock'
  if (state === 'low') return 'Low Stock'
  return 'In Stock'
}
