import { apiClient } from './client'

export const inventoryApi = {
  transactions: async (params?: any) => {
    const res: any = await apiClient.get('/inventory/transactions', { params })
    return Array.isArray(res) ? res : (res?.items || [])
  },
  recordOperation: (payload: any) => apiClient.post('/inventory/operations', payload),
}
