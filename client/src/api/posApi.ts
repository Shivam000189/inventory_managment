import { apiClient } from './client'

export const posApi = {
  catalog: (params?: any) => apiClient.get('/pos/catalog', { params }),
  customers: (params?: any) => apiClient.get('/pos/customers', { params }),
  checkout: (payload: any) => apiClient.post('/pos/checkout', payload),
  invoices: (params?: any) => apiClient.get('/pos/invoices', { params }),
  invoice: (id: string) => apiClient.get(`/pos/invoices/${id}`),
}
