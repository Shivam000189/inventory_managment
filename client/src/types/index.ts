// Re-export core dashboard domain types
export * from '../dashboard/types';

// API Response Envelopes
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface Paginated<T = unknown> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export type QueryFilter = Record<string, string | number | boolean | undefined | null>;

// Category
export interface Category {
  id: string;
  categoryId?: string;
  name: string;
  slug?: string;
  description?: string;
  productCount?: number;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

// Product Variant
export interface ProductVariant {
  id?: string;
  variantId?: string;
  sku?: string;
  name?: string;
  size?: string;
  color?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  stock?: number;
  barcode?: string;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
}

// Extended Product model for features/pages
export interface DetailedProduct {
  id: string;
  productId?: string;
  name: string;
  sku: string;
  barcode?: string;
  category?: string;
  categoryId?: string;
  brand?: string;
  unit?: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp?: number;
  taxRate?: number;
  currentStock?: number;
  stock?: number;
  minimumStock?: number;
  reorderLevel?: number;
  batchNumber?: string;
  expiryDate?: string;
  rackLocation?: string;
  supplierId?: string;
  supplierName?: string;
  description?: string;
  active?: boolean;
  variants?: ProductVariant[];
  [key: string]: unknown;
}

// Stock Transactions & Adjustments
export interface StockTransaction {
  id: string;
  transactionId?: string;
  date: string;
  type: string;
  productId: string;
  productName?: string;
  sku?: string;
  quantity: number;
  qtyDelta?: number;
  unitPrice?: number;
  totalAmount?: number;
  reference?: string;
  reason?: string;
  batchNumber?: string;
  expiryDate?: string;
  location?: string;
  performedBy?: string;
  notes?: string;
  createdAt?: string;
  [key: string]: unknown;
}

// Sales Orders
export interface SalesOrderItem {
  productId?: string;
  product_id?: string;
  productName?: string;
  name?: string;
  sku?: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  taxRate?: number;
  discount?: number;
  total?: number;
  [key: string]: unknown;
}

export interface SalesOrder {
  id: string;
  salesOrderId?: string;
  orderNumber: string;
  order_number?: string;
  date?: string;
  customerId?: string;
  customer_id?: string;
  customerName?: string;
  customer_name?: string;
  customerPhone?: string;
  customer_phone?: string;
  status: 'Pending' | 'Completed' | 'Cancelled' | 'Refunded' | string;
  paymentStatus?: 'Paid' | 'Unpaid' | 'Partial' | 'Credit' | string;
  payment_status?: string;
  paymentMethod?: string;
  payment_method?: string;
  items: SalesOrderItem[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  totalAmount?: number;
  total_amount?: number;
  total?: number;
  notes?: string;
  createdAt?: string;
  created_at?: string;
  [key: string]: unknown;
}

// Payments
export interface Payment {
  id: string;
  paymentId?: string;
  orderId?: string;
  salesOrderId?: string;
  amount: number;
  paymentMethod: string;
  method?: string;
  status: string;
  reference?: string;
  date?: string;
  createdAt?: string;
  [key: string]: unknown;
}

// User & Session types
export interface Account {
  userId: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  roleId?: string;
  permissions?: string[];
  avatar?: string;
  onboarding?: {
    status: string;
    [key: string]: unknown;
  };
  businessId?: string;
  [key: string]: unknown;
}

export interface UserSession {
  user: Account;
  account?: Account;
  business?: import('../dashboard/types').BusinessProfile;
  token?: string;
  [key: string]: unknown;
}
