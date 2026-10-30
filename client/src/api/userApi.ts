import { apiClient } from './client'

export const userApi = {
  listMembers: () => apiClient.get('/users'),
  createMember: (payload: any) => apiClient.post('/users', payload),
  updateMember: (id: string, payload: any) => apiClient.put(`/users/${id}`, payload),
  listRoles: () => apiClient.get('/users/roles/all'),
  saveRole: (payload: any) => apiClient.post('/users/roles', payload),
  setRolePermissions: (roleId: string, permissions: string[]) =>
    apiClient.patch(`/users/roles/${roleId}/permissions`, { permissions }),
}
