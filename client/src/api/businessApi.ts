import { apiClient } from './client'

export const businessApi = {
  create: (payload: any) => apiClient.post('/businesses', payload),
  me: () => apiClient.get('/businesses/me'),
  update: (payload: any) => apiClient.patch('/businesses/me', payload),
  remove: () => apiClient.delete('/businesses/me'),
}
