import { apiClient } from './client'

export const supplierApi = {
  list: (params?: any) => apiClient.get('/suppliers', { params }),
  get: (id: string) => apiClient.get(`/suppliers/${id}`),
  create: (payload: any) => apiClient.post('/suppliers', payload),
  update: (id: string, payload: any) => apiClient.put(`/suppliers/${id}`, payload),
  archive: (id: string) => apiClient.patch(`/suppliers/${id}/archive`),
  remove: (id: string) => apiClient.delete(`/suppliers/${id}`),
}
