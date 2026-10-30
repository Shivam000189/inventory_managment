import { apiClient } from './client'

const q = (params: Record<string, any> = {}) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v && v !== 'all')).toString()

export const clothingApi = {
  variants: (params?: any) => apiClient.get(`/clothing/variants?${q(params)}`),
  saveVariants: (productId: string, variants: any) =>
    apiClient.put(`/clothing/products/${productId}/variants`, { variants }),
  variantStock: (productId: string, variantId: string, body: any) =>
    apiClient.post(`/clothing/products/${productId}/variants/${variantId}/stock`, body),
  barcode: (code: string) => apiClient.get(`/clothing/barcode/${encodeURIComponent(code)}`),
  replenishment: (params?: any) => apiClient.get(`/clothing/replenishment?${q(params)}`),
  draftPO: (body: any) => apiClient.post('/clothing/replenishment/purchase-order', body),
  list: (kind: string, params?: any) => apiClient.get(`/clothing/${kind}?${q(params)}`),
  create: (kind: string, body: any) => apiClient.post(`/clothing/${kind}`, body),
  update: (kind: string, id: string, body: any) => apiClient.patch(`/clothing/${kind}/${id}`, body),
  loyalty: (customerId: string) => apiClient.get(`/clothing/loyalty/${customerId}`),
  adjustLoyalty: (customerId: string, body: any) =>
    apiClient.post(`/clothing/loyalty/${customerId}`, body),
  shifts: () => apiClient.get('/clothing/shifts'),
  startShift: (openingCash: number) => apiClient.post('/clothing/shifts', { openingCash }),
  closeShift: (id: string, actualClosingCash: number) =>
    apiClient.patch(`/clothing/shifts/${id}/close`, { actualClosingCash }),
  cashMovement: (direction: string, amount: number) =>
    apiClient.post('/clothing/shifts/cash-movement', { direction, amount }),
  reports: () => apiClient.get('/clothing/reports'),
}
