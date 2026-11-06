import { apiClient } from './client'

export const productImportApi = {
  extract: (file: File) => {
    const data = new FormData()
    data.append('file', file)
    return apiClient.upload('/product-imports/extract', data)
  },
  confirm: (payload: any) => apiClient.post('/product-imports/confirm', payload),
  history: () => apiClient.get('/product-imports/history'),
  downloadTemplate: async (industry?: string, format: 'xlsx' | 'pdf' = 'xlsx', businessName?: string) => {
    const params = new URLSearchParams()
    if (industry) params.set('industry', industry)
    if (businessName) params.set('businessName', businessName)
    params.set('format', format)
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('sr_token') : null
    const res = await fetch(`/api/product-imports/template?${params.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    })
    if (!res.ok) throw new Error(`Failed to download template (${res.status})`)
    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition')
    let filename = `product_import_template.${format}`
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/)
      if (match?.[1]) filename = match[1]
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },
}
