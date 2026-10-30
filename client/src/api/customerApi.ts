import { apiClient } from './client'

export const customerApi = {
  list: (params?: any) => apiClient.get('/customers', { params }),
  get: (id: string) => apiClient.get(`/customers/${id}`),
  create: (payload: any) => apiClient.post('/customers', payload),
  update: (id: string, payload: any) => apiClient.put(`/customers/${id}`, payload),
  archive: (id: string) => apiClient.patch(`/customers/${id}/archive`),
  remove: (id: string) => apiClient.delete(`/customers/${id}`),
}
