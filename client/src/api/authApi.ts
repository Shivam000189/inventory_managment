import { apiClient } from './client'

export const authApi = {
  register: (payload: any) => apiClient.post('/auth/register', payload),
  login: (payload: any) => apiClient.post('/auth/login', payload),
  logout: () => apiClient.post('/auth/logout'),
  logoutAll: () => apiClient.post('/auth/logout-all'),
  forgotPassword: (payload: any) => apiClient.post('/auth/forgot-password', payload),
  resetPassword: (payload: any) => apiClient.post('/auth/reset-password', payload),
  me: () => apiClient.get('/auth/me'),
  saveOnboarding: (payload: any) => apiClient.patch('/auth/onboarding', payload),
}
