import { apiClient } from './client'

export const notificationApi = {
  list: (params?: any) => apiClient.get('/notifications', { params }),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`, {}),
  markAllRead: () => apiClient.patch('/notifications/read-all', {}),
  dismiss: (id: string) => apiClient.delete(`/notifications/${id}`),
}
