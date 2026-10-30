import { apiClient } from './client'

export const inventoryApi = {
  transactions: (params?: any) => apiClient.get('/inventory/transactions', { params }),
  recordOperation: (payload: any) => apiClient.post('/inventory/operations', payload),
}
