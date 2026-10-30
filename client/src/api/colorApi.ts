import { apiClient } from './client'

export const colorApi = {
  list: (params?: any) => apiClient.get('/colors', { params }),
  create: (payload: any) => apiClient.post('/colors', payload),
  update: (colorId: string, payload: any) => apiClient.patch(`/colors/${colorId}`, payload),
}
