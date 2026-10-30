export type UserRole = 'admin' | 'salesperson';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarInitials: string;
  status: 'active' | 'suspended';
  lastLogin: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  businessType: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  taxNumber: string; // GSTIN
  invoicePrefix: string;
  startingInvoiceNumber: number;
  defaultTaxRate: number; // e.g. 18
  isTaxInclusive: boolean;
  allowNegativeStock: boolean;
  receiptFooterText: string;
  receiptPaperSize: '58mm' | '80mm' | 'A4';
  upiId: string;
  lowStockThreshold: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  taxRate: number;
  stock: number;
  reorderLevel: number;
  supplierId: string;
  supplierName?: string;
  description?: string;
  active: boolean;
  iconType?: 'shirt' | 'pill' | 'mouse' | 'shoe' | 'box' | 'coffee' | 'phone' | 'bottle' | 'book';
}

export type MovementType = 'Sale' | 'Purchase' | 'Stock In' | 'Stock Out' | 'Adjustment' | 'Return';

export interface StockMovement {
  id: string;
  date: string;
  type: MovementType;
  productId: string;
  productName: string;
  sku?: string;
  qtyDelta: number;
  balanceAfter: number;
  reference: string;
  user: string;
  amount?: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  paymentTerms: 'COD' | 'Net 15' | 'Net 30' | 'Net 60';
  outstandingBalance: number;
  lastOrderDate: string;
  status: 'active' | 'inactive';
  notes?: string;
}

export interface POItem {
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  taxRate: number;
  lineTotal: number;
}

export type POStatus = 'Draft' | 'Ordered' | 'Partially received' | 'Received' | 'Cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string;
  items: POItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
  status: POStatus;
  notes?: string;
}

export interface BillItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  total: number;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Credit';
export type BillStatus = 'Paid' | 'Partial' | 'Credit' | 'Cancelled';

export interface Bill {
  id: string;
  billNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: BillStatus;
  createdBy: string;
  salespersonId: string;
  cashTendered?: number;
  changeDue?: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: 'Retail' | 'Wholesale';
  totalSpent: number;
  lastPurchase: string;
  outstanding: number;
  creditLimit: number;
  address?: string;
  gstin?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'low_stock' | 'po_due' | 'payment' | 'sale';
  time: string;
  dateGroup: 'Today' | 'Earlier';
  unread: boolean;
  link?: string;
}
