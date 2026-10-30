import { apiClient } from './client'

export const productApi = {
  list: (params?: any) => apiClient.get('/products', { params }),
  get: (id: string) => apiClient.get(`/products/${id}`),
  create: (payload: any) => apiClient.post('/products', payload),
  update: (id: string, payload: any) => apiClient.put(`/products/${id}`, payload),
  remove: (id: string) => apiClient.delete(`/products/${id}`),
}
