import { apiClient } from './client'

export const returnApi = {
  list: (params?: any) => apiClient.get('/returns', { params }),
  eligibleOrders: (params?: any) => apiClient.get('/returns/eligible-orders/list', { params }),
  create: (payload: any) => apiClient.post('/returns', payload),
  get: (returnId: string) => apiClient.get(`/returns/${returnId}`),
  refund: (returnId: string, payload: any) =>
    apiClient.post(`/returns/${returnId}/refunds`, payload),
  updateRefund: (returnId: string, refundId: string, payload: any) =>
    apiClient.patch(`/returns/${returnId}/refunds/${refundId}`, payload),
  cancel: (returnId: string) => apiClient.patch(`/returns/${returnId}/cancel`),
}
