import { apiClient } from './client'

export const salesOrderApi = {
  list: (params?: any) => apiClient.get('/sales-orders', { params }),
  get: (id: string) => apiClient.get(`/sales-orders/${id}`),
  create: (payload: any) => apiClient.post('/sales-orders', payload),
  update: (id: string, payload: any) => apiClient.put(`/sales-orders/${id}`, payload),
  complete: (id: string) => apiClient.patch(`/sales-orders/${id}/complete`),
  cancel: (id: string) => apiClient.patch(`/sales-orders/${id}/cancel`),
}
