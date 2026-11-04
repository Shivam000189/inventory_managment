import { apiClient } from './client'
import type { UserSession } from '../types'

export const authApi = {
  login: (payload: { email: string; password: string }) => apiClient.post<UserSession>('/auth/login', payload),
  logout: () => apiClient.post('/auth/logout'),
  logoutAll: () => apiClient.post('/auth/logout-all'),
  me: () => apiClient.get('/auth/me'),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient.patch<UserSession>('/auth/password', payload),
}
