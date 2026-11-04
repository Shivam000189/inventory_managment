import { request } from './client';

export interface ProductBatch {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  productSku: string;
  category: string;
  genericName?: string;
  manufacturer?: string;
  unit?: string;
  batchNumber: string;
  manufacturingDate?: string | null;
  expiryDate: string;
  mrp: number;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  supplierId?: string | null;
  supplierName?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  daysUntilExpiry: number;
  status: 'active' | 'expiring_soon' | 'critical_expiry' | 'expired' | 'depleted';
}

export interface PharmacySummary {
  totalLots: number;
  activeLots: number;
  expiredLots: number;
  expiredStockUnits: number;
  expiring30DaysLots: number;
  expiring30DaysUnits: number;
  expiring60DaysLots: number;
  expiring60DaysUnits: number;
  totalUnits: number;
  healthyUnits: number;
  healthMeter: number;
}

export const batchApi = {
  list: (params?: { productId?: string; status?: string; search?: string }) =>
    request<ProductBatch[]>('/batches', { params }),

  create: (data: {
    productId: string;
    batchNumber: string;
    expiryDate: string;
    mrp?: number;
    purchasePrice?: number;
    sellingPrice?: number;
    quantity?: number;
    manufacturingDate?: string;
    supplierId?: string;
    notes?: string;
  }) => request<ProductBatch>('/batches', { method: 'POST', body: data }),

  dispose: (id: string, data: { quantity: number; reason?: string }) =>
    request<{ success: boolean; message: string }>(`/batches/${id}/dispose`, {
      method: 'POST',
      body: data,
    }),

  getSummary: () => request<PharmacySummary>('/batches/summary'),
};

