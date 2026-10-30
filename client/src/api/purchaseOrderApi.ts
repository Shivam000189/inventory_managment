import { apiClient } from './client'

export const purchaseOrderApi = {
  list: (params?: any) => apiClient.get('/purchase-orders', { params }),
  get: (id: string) => apiClient.get(`/purchase-orders/${id}`),
  create: (payload: any) => apiClient.post('/purchase-orders', payload),
  update: (id: string, payload: any) => apiClient.put(`/purchase-orders/${id}`, payload),
  setStatus: (id: string, status: string) =>
    apiClient.patch(`/purchase-orders/${id}/status`, { status }),
}
