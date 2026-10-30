import { apiClient } from './client'

export const receivingApi = {
  list: (params?: any) => apiClient.get('/receiving', { params }),
  pendingOrders: () => apiClient.get('/receiving/pending-orders'),
  create: (payload: any) => apiClient.post('/receiving', payload),
}
