import { apiClient } from '../api/client'

export type BusinessStatus = 'active' | 'suspended' | 'deactivated'
export type BusinessAdminStatus = 'active' | 'inactive'

export interface PlatformMeta {
  page: number
  limit: number
  total: number
  pages: number
}

export interface PlatformPage<T> {
  items: T[]
  meta: PlatformMeta
}

export interface PlatformOverview {
  businesses: {
    total: number
    active: number
    suspended: number
    deactivated: number
    createdThisMonth: number
  }
  businessAdmins: {
    total: number
    active: number
    inactive: number
  }
  salespeople: {
    total: number
    active: number
    pending: number
    inactive: number
  }
}

export interface PlatformBusiness {
  id: string
  name: string
  industry: string
  businessType: string
  phone: string | null
  email: string | null
  city: string | null
  state: string | null
  country: string | null
  status: BusinessStatus
  createdAt: string
  updatedAt: string
  businessAdmin: { id: string; name: string; email: string } | null
}

export interface PlatformBusinessAdmin {
  id: string
  name: string
  email: string
  status: BusinessAdminStatus
  createdAt: string
  business: { id: string; name: string; industry: string } | null
}

export interface PlatformListFilters {
  page: number
  limit: number
  q?: string
  status?: string
  industry?: string
  createdFrom?: string
  createdTo?: string
  withoutBusiness?: boolean
}

export interface CreateBusinessInput {
  name: string
  industry: string
  businessType: string
  country: string
  currency: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  gstin?: string
  adminName: string
  adminEmail: string
}

export interface CreatedBusinessCredentials {
  business: { id: string; name: string; industry: string; businessType: string; status: BusinessStatus }
  businessAdmin: {
    id: string
    name: string
    email: string
    status: BusinessAdminStatus
    mustChangePassword: boolean
  }
  temporaryPassword: string
}

export interface BusinessStatusResult {
  id: string
  name: string
  status: BusinessStatus
}

export interface BusinessAdminStatusResult {
  id: string
  name: string
  email: string
  status: BusinessAdminStatus
}

export const platformApi = {
  overview: () => apiClient.get<PlatformOverview>('/platform/overview'),
  businesses: (filters: PlatformListFilters) =>
    apiClient.get<PlatformPage<PlatformBusiness>>('/platform/businesses', { params: { ...filters } }),
  businessAdmins: (filters: PlatformListFilters) =>
    apiClient.get<PlatformPage<PlatformBusinessAdmin>>('/platform/business-admins', { params: { ...filters } }),
  createBusiness: (input: CreateBusinessInput) =>
    apiClient.post<CreatedBusinessCredentials>('/platform/businesses', input),
  setBusinessStatus: (businessId: string, status: BusinessStatus) =>
    apiClient.patch<BusinessStatusResult>(`/platform/businesses/${encodeURIComponent(businessId)}/status`, { status }),
  setBusinessAdminStatus: (userId: string, status: BusinessAdminStatus) =>
    apiClient.patch<BusinessAdminStatusResult>(`/platform/business-admins/${encodeURIComponent(userId)}/status`, { status }),
}
