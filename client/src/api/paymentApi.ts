import { apiClient } from './client'

export const paymentApi = {
  list: (params?: any) => apiClient.get('/payments', { params }),
  create: (payload: any) => apiClient.post('/payments', payload),
}
