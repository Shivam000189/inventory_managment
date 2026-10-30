import { apiClient } from './client'

export const reportApi = {
  summary: () => apiClient.get('/reports/summary'),
}
