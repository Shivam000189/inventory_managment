import { apiClient } from './client'

export const businessApi = {
  me: () => apiClient.get('/businesses/me'),
  update: (payload: any) => apiClient.patch('/businesses/me', payload),
}
