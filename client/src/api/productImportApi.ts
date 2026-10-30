import { apiClient } from './client'

export const productImportApi = {
  extract: (file: File) => {
    const data = new FormData()
    data.append('file', file)
    return apiClient.upload('/product-imports/extract', data)
  },
  confirm: (payload: any) => apiClient.post('/product-imports/confirm', payload),
  history: () => apiClient.get('/product-imports/history'),
}
