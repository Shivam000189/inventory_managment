import { request } from './client';

export interface PrescriptionItem {
  medicineName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  quantity?: number;
}

export interface Prescription {
  id: string;
  businessId: string;
  prescriptionNumber: string;
  doctorName: string;
  doctorRegNumber?: string;
  hospitalName?: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: number | null;
  patientGender?: string;
  prescriptionDate: string;
  diagnosis?: string;
  notes?: string;
  salesOrderId?: string | null;
  salesOrderNumber?: string | null;
  orderTotal?: number | null;
  items: PrescriptionItem[];
  status: 'Active' | 'Dispensed' | 'Expired' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export const prescriptionApi = {
  list: (params?: { search?: string; status?: string }) =>
    request<Prescription[]>('/prescriptions', { params }),

  create: (data: {
    prescriptionNumber?: string;
    doctorName: string;
    doctorRegNumber?: string;
    hospitalName?: string;
    patientName: string;
    patientPhone?: string;
    patientAge?: number;
    patientGender?: string;
    prescriptionDate?: string;
    diagnosis?: string;
    notes?: string;
    salesOrderId?: string;
    items?: PrescriptionItem[];
    status?: string;
  }) => request<Prescription>('/prescriptions', { method: 'POST', body: data }),

  get: (id: string) => request<Prescription>(`/prescriptions/${id}`),
};

