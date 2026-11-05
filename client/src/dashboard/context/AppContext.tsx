import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  UserRole,
  BusinessProfile,
  Product,
  Supplier,
  PurchaseOrder,
  Bill,
  Customer,
  AppNotification,
  StockMovement,
  MovementType,
  POStatus,
  BillStatus,
  PaymentMethod,
} from '../types';
import {
  authApi,
  businessApi,
  productsApi,
  suppliersApi,
  customersApi,
  purchaseOrdersApi,
  salesOrdersApi,
  inventoryApi,
  posApi,
  usersApi,
  paymentsApi,
  notificationsApi,
  clearAuthSession,
} from '../lib/api';

const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

const defaultBusinessProfile: BusinessProfile = {
  id: '',
  name: '',
  legalName: '',
  gstin: '',
  pan: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  currency: 'INR',
  currencySymbol: '₹',
  financialYearStart: 'April',
  invoicePrefix: 'INV-',
  startingInvoiceNumber: 1001,
  defaultPaymentTerms: 'Due on receipt',
  defaultTaxRate: 18,
  allowNegativeStock: false,
  enableBatchTracking: false,
  enableSerialTracking: false,
  lowStockThreshold: 10,
  businessType: 'Retail',
  industry: 'general',
  taxEnabled: true,
  defaultGstRate: 18,
  upiId: '',
};

const defaultUser: User = {
  id: '',
  name: '',
  email: '',
  role: 'admin',
  avatarInitials: '',
  status: 'active',
  lastLogin: '',
};

// --- Mappers between Backend API payloads and Frontend models ---

function mapBackendProduct(p: any): Product {
  const stockVal = Number(p.currentStock ?? p.current_stock ?? p.stock ?? 0);
  return {
    id: String(p.productId || p.id || p._id || `prod-${Date.now()}`),
    name: p.name || 'Unnamed Product',
    sku: p.sku || '',
    barcode: p.barcode || '',
    category: p.category || 'General',
    unit: p.unit || 'pcs',
    purchasePrice: Number(p.purchasePrice ?? p.purchase_price ?? 0),
    sellingPrice: Number(p.sellingPrice ?? p.selling_price ?? 0),
    taxRate: Number(p.gstRate ?? p.gst_rate ?? p.taxRate ?? 0),
    stock: stockVal,
    reorderLevel: Number(p.minimumStock ?? p.minimum_stock ?? p.reorderLevel ?? 10),
    supplierId: p.supplierId || p.supplier_id || '',
    supplierName: p.supplier || p.supplierName || '',
    description: p.description || '',
    active: true,

    genericName: p.genericName || p.generic_name || '',
    manufacturer: p.manufacturer || '',
    batchNumber: p.batchNumber || p.batch_number || '',
    manufacturingDate: p.manufacturingDate || p.manufacturing_date || undefined,
    expiryDate: p.expiryDate || p.expiry_date || undefined,
    mrp: p.mrp != null ? Number(p.mrp) : undefined,
    brand: p.brand || '',
    model: p.model || '',
    serialNumber: p.serialNumber || p.serial_number || '',
    imei: p.imei || '',
    warrantyMonths: p.warrantyMonths != null ? Number(p.warrantyMonths) : (p.warranty_months != null ? Number(p.warranty_months) : undefined),
    size: p.size || '',
    color: p.color || '',
    dimensions: p.dimensions || '',
    material: p.material || '',
    weight: p.weight != null ? Number(p.weight) : undefined,
    wholesalePrice: p.wholesalePrice != null ? Number(p.wholesalePrice) : (p.wholesale_price != null ? Number(p.wholesale_price) : undefined),
    wholesaleMinQuantity: p.wholesaleMinQuantity != null ? Number(p.wholesaleMinQuantity) : (p.wholesale_min_quantity != null ? Number(p.wholesale_min_quantity) : undefined),
    dealerPrice: p.dealerPrice != null ? Number(p.dealerPrice) : (p.dealer_price != null ? Number(p.dealer_price) : undefined),
    warehouse: p.warehouse || '',
    rackLocation: p.rackLocation || p.rack_location || '',
  };
}

function mapBusinessProfileFromBackend(b: any, prev: BusinessProfile): BusinessProfile {
  if (!b) return prev;
  const settings = b.settings || {};
  const currency = b.currency || prev.currency || 'INR';
  return {
    ...prev,
    id: b.businessId || b.id || prev.id || '',
    name: b.name ?? prev.name ?? '',
    legalName: b.legalName || b.name || prev.legalName || '',
    currency,
    currencySymbol: currency === 'USD' ? '$' : '₹',
    businessType: b.businessType || prev.businessType || 'Retail',
    industry: b.industry || prev.industry || '',
    address: b.address || prev.address || '',
    city: b.city || prev.city || '',
    state: b.state || prev.state || '',
    pincode: b.pincode || prev.pincode || '',
    phone: b.phone || prev.phone || '',
    email: b.email || prev.email || '',
    taxNumber: b.gstin || b.taxNumber || settings.taxNumber || prev.taxNumber || '',
    gstin: b.gstin || settings.gstin || prev.gstin || '',
    pan: b.pan || settings.pan || prev.pan || '',
    upiId: b.upiId || settings.upiId || prev.upiId || '',
    invoicePrefix: b.invoicePrefix || settings.invoicePrefix || prev.invoicePrefix || 'INV-',
    startingInvoiceNumber: Number(b.startingInvoiceNumber || settings.startingInvoiceNumber || prev.startingInvoiceNumber || 1001),
    drugLicenseNumber: b.drugLicenseNumber || settings.drugLicenseNumber || prev.drugLicenseNumber || '',
    drugLicense20B: b.drugLicense20B || settings.drugLicense20B || prev.drugLicense20B || '',
    drugLicense21B: b.drugLicense21B || settings.drugLicense21B || prev.drugLicense21B || '',
    pharmacistInCharge: b.pharmacistInCharge || settings.pharmacistInCharge || prev.pharmacistInCharge || '',
    taxEnabled: settings.taxEnabled !== undefined ? settings.taxEnabled : prev.taxEnabled,
    defaultGstRate: settings.defaultGstRate !== undefined ? Number(settings.defaultGstRate) : prev.defaultGstRate,
    allowNegativeStock: settings.allowNegativeStock !== undefined ? settings.allowNegativeStock : prev.allowNegativeStock,
    lowStockThreshold: settings.lowStockLimit !== undefined ? Number(settings.lowStockLimit) : prev.lowStockThreshold,
  };
}

function mapProductToBackend(p: Partial<Product>) {
  return {
    name: p.name,
    sku: p.sku,
    category: p.category,
    sellingPrice: p.sellingPrice,
    purchasePrice: p.purchasePrice,
    currentStock: p.stock,
    minimumStock: p.reorderLevel,
    barcode: p.barcode,
    unit: p.unit,
    gstRate: p.taxRate,
    supplierId: p.supplierId,
    description: p.description,

    genericName: p.genericName,
    manufacturer: p.manufacturer,
    batchNumber: p.batchNumber,
    manufacturingDate: p.manufacturingDate,
    expiryDate: p.expiryDate,
    mrp: p.mrp,
    brand: p.brand,
    model: p.model,
    serialNumber: p.serialNumber,
    imei: p.imei,
    warrantyMonths: p.warrantyMonths,
    size: p.size,
    color: p.color,
    dimensions: p.dimensions,
    material: p.material,
    weight: p.weight,
    wholesalePrice: p.wholesalePrice,
    wholesaleMinQuantity: p.wholesaleMinQuantity,
    dealerPrice: p.dealerPrice,
    warehouse: p.warehouse,
    rackLocation: p.rackLocation,
  };
}

function mapBackendSupplier(s: any): Supplier {
  return {
    id: String(s.supplierId || s.id || s._id || `sup-${Date.now()}`),
    name: s.name || s.supplierName || s.supplier_name || 'Unnamed Supplier',
    contactPerson: s.contactPerson || s.contact_person || '',
    phone: s.phone || '',
    email: s.email || '',
    gstin: s.gstin || s.taxNumber || s.tax_number || s.gstNumber || '',
    address: s.address || (s.city ? `${s.city}${s.state ? `, ${s.state}` : ''}` : ''),
    paymentTerms: (s.paymentTerms as any) || s.payment_terms || 'Net 30',
    outstandingBalance: Number(s.outstandingBalance || s.outstanding_balance || 0),
    lastOrderDate: s.lastOrderDate || '-',
    status: s.status === 'inactive' ? 'inactive' : 'active',
    notes: s.notes || '',
  };
}

function mapSupplierToBackend(s: Partial<Supplier>) {
  return {
    supplierName: s.name,
    contactPerson: s.contactPerson,
    phone: s.phone,
    email: s.email,
    taxNumber: s.gstin,
    address: s.address,
    paymentTerms: s.paymentTerms,
    notes: s.notes,
    status: s.status || 'active',
  };
}

function mapBackendCustomer(c: any): Customer {
  const totalSpent = Number(
    c.totalPurchases ??
    c.total_purchases ??
    c.totalSpent ??
    c.total_spent ??
    0
  );
  const outstanding = Number(
    c.outstandingBalance ??
    c.outstanding_balance ??
    c.outstanding ??
    0
  );
  const creditLimit = Number(
    c.creditLimit ??
    c.credit_limit ??
    0
  );

  return {
    id: String(c.customerId || c.id || c._id || `cust-${Date.now()}`),
    name: c.name || '',
    phone: c.phone || '',
    email: c.email || '',
    type: (c.customerType || c.customer_type || c.type || 'Retail') as any,
    gstin: c.gstin || c.gstNumber || '',
    address: c.address || (c.city ? `${c.city}${c.state ? `, ${c.state}` : ''}` : ''),
    totalSpent,
    lastPurchase: c.lastPurchase || (totalSpent > 0 ? 'Recently' : 'Never'),
    outstanding,
    creditLimit,
  };
}

function mapBackendPurchaseOrder(po: any): PurchaseOrder {
  const rawDate = po.orderDate || po.createdAt || po.created_at;
  const parsedDate = rawDate ? new Date(rawDate) : null;
  const orderDate = parsedDate && !isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : (po.orderDate || '-');

  const expectedDate = po.expectedDeliveryDate || po.expected_delivery_date || po.expectedDate || po.expectedDelivery || '-';

  return {
    id: String(po.purchaseOrderId || po.id || po._id || `po-${Date.now()}`),
    poNumber: po.orderNumber || po.order_number || po.poNumber || `PO-${String(po.purchaseOrderId || po.id || '').slice(-6)}`,
    supplierId: po.supplierId || po.supplier_id || '',
    supplierName: po.supplierName || po.supplier_name || 'Supplier',
    orderDate,
    expectedDate,
    status: (po.status as POStatus) || 'Ordered',
    items: (po.items || []).map((item: any) => ({
      productId: item.productId || item.product_id,
      productName: item.productName || item.product_name || item.name || 'Item',
      sku: item.sku || '',
      orderedQty: Number(item.orderedQty ?? item.quantity ?? 0),
      receivedQty: Number(item.receivedQty ?? 0),
      unitCost: Number(item.unitCost ?? item.purchasePrice ?? item.purchase_price ?? 0),
      taxRate: Number(item.taxRate ?? item.gstRate ?? item.gst_rate ?? 0),
      lineTotal: Number(item.lineTotal ?? item.total ?? 0),
    })),
    subtotal: Number(po.subtotal || 0),
    discount: Number(po.discount || 0),
    tax: Number(po.tax || po.taxTotal || po.tax_total || 0),
    shipping: Number(po.shippingCharges ?? po.shipping_charges ?? po.shipping ?? 0),
    total: Number(po.totalAmount ?? po.total_amount ?? po.total ?? po.grandTotal ?? 0),
    paymentStatus: (po.paymentStatus || po.payment_status || 'Unpaid') as any,
    notes: po.notes || '',
  };
}

function mapBackendSalesOrder(so: any): Bill {
  const rawDate = so.createdAt || so.created_at || so.date;
  const parsed = rawDate ? new Date(rawDate) : new Date();
  const isValidDate = !isNaN(parsed.getTime());
  const dateStr = isValidDate
    ? parsed.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : (so.date || 'Today');

  const total = Number(
    so.totalAmount ??
    so.total_amount ??
    so.grandTotal ??
    so.grand_total ??
    so.total ??
    0
  );

  const subtotal = Number(so.subtotal ?? 0);
  const discount = Number(so.discount ?? 0);
  const tax = Number(so.tax ?? so.taxTotal ?? so.tax_total ?? 0);

  const status: BillStatus =
    so.status === 'Cancelled'
      ? 'Cancelled'
      : (so.paymentStatus === 'Credit' || so.payment_status === 'Credit' ? 'Credit' : 'Paid');

  const paymentMethod: PaymentMethod =
    (so.paymentMethod ||
      so.payment_method ||
      so.paymentSummary?.[0]?.method ||
      so.payment_summary?.[0]?.method ||
      'Cash') as PaymentMethod;

  return {
    id: String(so.salesOrderId || so.id || so._id || `bill-${Date.now()}`),
    billNumber:
      so.orderNumber ||
      so.order_number ||
      so.billNumber ||
      so.invoiceNumber ||
      so.invoice_number ||
      `INV-${String(so.salesOrderId || so.id || '').slice(-6)}`,
    date: dateStr,
    createdAt: isValidDate ? parsed.toISOString() : (typeof rawDate === 'string' ? rawDate : undefined),
    customerId: so.customerId || so.customer_id || '',
    customerName: so.customerName || so.customer_name || so.customerSnapshot?.name || 'Walk-in Customer',
    customerPhone: so.customerPhone || so.customer_phone || so.customerSnapshot?.phone,
    items: (so.items || []).map((item: any) => ({
      productId: item.productId || item.product_id,
      productName: item.productName || item.product_name || item.name || 'Item',
      sku: item.sku || item.variantSku || '',
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || item.sellingPrice || item.price || item.selling_price || 0),
      discountAmount: Number(item.discountAmount || item.discount || 0),
      taxRate: Number(item.taxRate || item.gstRate || item.tax_rate || 0),
      total: Number(item.total || 0),
    })),
    subtotal,
    discount,
    tax,
    total,
    paymentMethod,
    status,
    createdBy: so.createdBy || so.created_by || 'Staff',
    salespersonId: so.salespersonId || so.cashierId || so.cashier_id || '',
    cashTendered: so.cashTendered || so.cash_tendered,
    changeDue: so.changeDue || so.change_due,
    notes: so.notes || '',
  };
}


function mapBackendNotification(item: any): AppNotification {
  const typeMap: Record<string, AppNotification['type']> = {
    LOW_STOCK: 'low_stock',
    OUT_OF_STOCK: 'low_stock',
    PRODUCT_EXPIRED: 'low_stock',
    PRODUCT_NEAR_EXPIRY: 'low_stock',
    low_stock: 'low_stock',
    PURCHASE_DELIVERY_OVERDUE: 'po_due',
    PURCHASE_ORDER_CREATED: 'po_due',
    po_due: 'po_due',
    PAYMENT_RECORDED: 'payment',
    payment: 'payment',
    SALES_ORDER_CREATED: 'sale',
    sale: 'sale',
  };

  const categoryType: Partial<Record<string, AppNotification['type']>> = {
    inventory: 'low_stock',
    purchases: 'po_due',
    suppliers: 'po_due',
    payments: 'payment',
    sales: 'sale',
  };
  const navigationLinks: Record<string, string> = {
    Products: '/products',
    Payments: '/reports',
    'Purchase Orders': '/purchase-orders',
    Receiving: '/purchase-orders',
    Orders: '/pos',
  };

  const type = typeMap[item.type] || categoryType[item.category] || 'sale';
  const d = item.createdAt ? new Date(item.createdAt) : new Date();
  const isToday = !isNaN(d.getTime()) && new Date().toDateString() === d.toDateString();

  return {
    id: String(item.id || item.notificationId || item._id),
    title: item.title || (type === 'low_stock' ? 'Low Stock Alert' : 'Notification'),
    message: item.message || item.secondary || '',
    type,
    time: isToday ? 'Today' : (d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) || 'Earlier'),
    dateGroup: isToday ? 'Today' : 'Earlier',
    unread: item.readAt ? false : true,
    link: navigationLinks[item.navigationTarget] || '/inventory',
  };
}

function mapBackendMovement(m: any, productsList: Product[] = []): StockMovement {
  const typeMap: Record<string, MovementType> = {
    stock_in: 'Stock In',
    stock_out: 'Stock Out',
    adjustment: 'Adjustment',
    IN: 'Stock In',
    OUT: 'Stock Out',
    ADJUSTMENT: 'Adjustment',
    sale: 'Sale',
    purchase: 'Purchase',
    return: 'Return',
  };
  const resolvedType: MovementType = typeMap[m.type] || 'Stock In';
  const qty = Number(m.quantity || m.qtyDelta || 0);
  const matchedProd = productsList.find((p) => p.id === m.productId || p.sku === m.sku);
  const productName = m.productName || m.product || matchedProd?.name || 'Inventory Item';
  const sku = m.sku || matchedProd?.sku || '';

  return {
    id: String(m.transactionId || m.id || m._id || `tx-${Date.now()}`),
    date: m.date || (m.createdAt ? new Date(m.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Just now'),
    type: resolvedType,
    productId: m.productId || matchedProd?.id || '',
    productName,
    sku,
    qtyDelta: resolvedType === 'Stock Out' || resolvedType === 'Sale' ? -Math.abs(qty) : Math.abs(qty),
    balanceAfter: Number(m.newStock ?? m.new_stock ?? m.balanceAfter ?? m.balance ?? 0),
    reference: m.referenceId || m.reference_id || m.reference || m.reason || 'Movement',
    user: m.user || m.createdBy || m.created_by || 'User',
    amount: Number(m.amount || 0),
  };
}

// --- App Context Type ---

interface AppContextType {
  // Backend status & Authentication
  isBackendConnected: boolean;
  isLoadingBackend: boolean;
  loadingStates: {
    products: boolean;
    suppliers: boolean;
    customers: boolean;
    purchaseOrders: boolean;
    salesOrders: boolean;
    inventory: boolean;
  };
  refreshBackendData: () => Promise<void>;
  isAuthenticated: boolean;
  logout: () => Promise<void>;

  // Navigation & Role
  activeRoute: string;
  setActiveRoute: (route: string) => void;
  navigate: (route: string) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'lastLogin' | 'accountId' | 'memberId'>) => Promise<{ user: User; temporaryPassword: string }>;
  updateUserStatus: (id: string, status: 'active' | 'suspended') => void;
  deleteUser: (id: string) => void;

  // Business settings
  businessProfile: BusinessProfile;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Inventory & Movements
  stockMovements: StockMovement[];
  adjustStock: (productId: string, newStock: number, reason: string, note?: string) => void;
  stockIn: (productId: string, quantity: number, reference: string, note?: string) => void;
  stockOut: (productId: string, quantity: number, reason: string, note?: string) => void;

  // Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier> | Supplier;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Purchase Orders
  purchaseOrders: PurchaseOrder[];
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber'>) => Promise<PurchaseOrder> | PurchaseOrder;
  updatePOStatus: (id: string, status: POStatus) => void;
  receivePOItems: (poId: string, receivedQuantities: Record<string, number>, notes?: string) => void;

  // POS & Bills
  bills: Bill[];
  createBill: (billData: Omit<Bill, 'id' | 'billNumber' | 'date' | 'createdBy' | 'salespersonId'>) => Bill;
  cancelBill: (billId: string) => void;
  posActiveTab: 'new_bill' | 'bills';
  setPosActiveTab: (tab: 'new_bill' | 'bills') => void;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'totalSpent' | 'lastPurchase' | 'outstanding'>) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  recordCustomerPayment: (customerId: string, amount: number, method: string, notes?: string) => void;
  customersActiveTab: 'all' | 'credit';
  setCustomersActiveTab: (tab: 'all' | 'credit') => void;

  // Global Overlays
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  isNotificationDrawerOpen: boolean;
  setNotificationDrawerOpen: (open: boolean) => void;
  notifications: AppNotification[];
  markAllNotificationsAsRead: () => void;
  markNotificationAsRead: (id: string) => void;

  // Selected filter on Overview
  selectedDateRange: string;
  setSelectedDateRange: (range: string) => void;

  // Computed metrics
  metrics: {
    totalStockValue: number;
    todaySales: number;
    lowStockCount: number;
    openPOCount: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode;
  initialUser?: any;
  initialBusiness?: any;
  onLogout?: () => void;
  onNavigate?: (route: string) => void;
}

export const AppProvider: React.FC<AppProviderProps> = ({
  children,
  initialUser,
  initialBusiness,
  onLogout,
  onNavigate,
}) => {
  const [currentUser, setCurrentUser] = useState<User>(defaultUser);
  const [users, setUsers] = useState<User[]>([defaultUser]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(defaultBusinessProfile);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Backend live state
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLoadingBackend, setIsLoadingBackend] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    products: true,
    suppliers: true,
    customers: true,
    purchaseOrders: true,
    salesOrders: true,
    inventory: true,
  });
  const hasInitializedRef = React.useRef(false);

  // Navigation (React Router as single source of truth)
  const location = useLocation();
  const routerNavigate = useNavigate();
  const activeRoute = location.pathname || '/';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(initialUser));
  useEffect(() => {
    if (initialUser) {
      const u = initialUser;
      const initials = (u.name || u.email || 'US')
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      setCurrentUser({
        id: u.id || u.accountId || 'user-01',
        name: u.name || u.email || 'User',
        email: u.email || 'user@stockroom.test',
        role: u.role === 'owner' || u.role === 'admin' ? 'admin' : 'salesperson',
        avatarInitials: initials,
        status: 'active',
        lastLogin: 'Just now',
      });
      setIsAuthenticated(true);
    }
  }, [initialUser]);

  useEffect(() => {
    if (initialBusiness) {
      setBusinessProfile((prev) => mapBusinessProfileFromBackend(initialBusiness, prev));
    }
  }, [initialBusiness]);

  const [posActiveTab, setPosActiveTab] = useState<'new_bill' | 'bills'>('new_bill');
  const [customersActiveTab, setCustomersActiveTab] = useState<'all' | 'credit'>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>(() => {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return `Today, ${todayStr}`;
  });

  // Overlays
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isNotificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  // Connect to backend and fetch live database records
  const refreshBackendData = async () => {
    setIsLoadingBackend(true);
    setLoadingStates({
      products: true,
      suppliers: true,
      customers: true,
      purchaseOrders: true,
      salesOrders: true,
      inventory: true,
    });
    let session: any = null;
    try {
      // 1. Reuse session if already provided by AuthProvider to avoid duplicate network roundtrip
      if (initialUser) {
        session = { user: initialUser, business: initialBusiness };
        setIsBackendConnected(true);
      } else {
        try {
          session = await authApi.me();
          if (session?.user) {
            setIsBackendConnected(true);
            const u = session.user;
            const initials = (u.name || u.email || 'US')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            setCurrentUser({
              id: u.id || u.accountId || '',
              name: u.name || u.email || 'User',
              email: u.email || '',
              role: u.role === 'owner' || u.role === 'admin' ? 'admin' : 'salesperson',
              avatarInitials: initials,
              status: 'active',
              lastLogin: 'Just now',
            });
          }
          if (session?.business) {
            setBusinessProfile((prev) => mapBusinessProfileFromBackend(session.business, prev));
          }
        } catch {
          // Me failed
        }
      }

      // Helper to cleanly unwrap backend arrays from various wrapper shapes
      const extractArray = (res: any): any[] => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.items)) return res.items;
        if (Array.isArray(res.products)) return res.products;
        if (Array.isArray(res.suppliers)) return res.suppliers;
        if (Array.isArray(res.customers)) return res.customers;
        if (Array.isArray(res.orders)) return res.orders;
        if (Array.isArray(res.transactions)) return res.transactions;
        return [];
      };

      // 2. Fetch all live Supabase database collections in parallel for fast rendering
      const results = await Promise.allSettled([
        productsApi.list(),
        initialBusiness ? Promise.resolve(initialBusiness) : businessApi.get(),
        notificationsApi.list(),
        purchaseOrdersApi.list(),
        salesOrdersApi.list(),
        suppliersApi.list(),
        customersApi.list(),
        inventoryApi.history(),
        usersApi.listMembers(),
      ]);

      const [prodsRes, bizRes, notifsRes, posRes, sosRes, supsRes, custsRes, historyRes, usersRes] = results;

      if (bizRes.status === 'fulfilled' && bizRes.value) {
        setBusinessProfile((prev) => mapBusinessProfileFromBackend(bizRes.value, prev));
      }

      let loadedProducts: Product[] = [];
      if (prodsRes.status === 'fulfilled') {
        const prods = extractArray(prodsRes.value);
        loadedProducts = prods.map(mapBackendProduct);
        setProducts(loadedProducts);
        setIsBackendConnected(true);
      } else {
        setProducts([]);
      }

      if (notifsRes.status === 'fulfilled') {
        const notifList = extractArray(notifsRes.value);
        const validNotifications = notifList.filter((item) =>
          UUID_PATTERN.test(String(item.id || item.notificationId || item._id || '')),
        );
        setNotifications(validNotifications.map(mapBackendNotification));
      } else {
        setNotifications([]);
      }

      if (posRes.status === 'fulfilled') {
        const pos = extractArray(posRes.value);
        setPurchaseOrders(pos.map(mapBackendPurchaseOrder));
      } else {
        setPurchaseOrders([]);
      }

      if (sosRes.status === 'fulfilled') {
        const sos = extractArray(sosRes.value);
        setBills(sos.map(mapBackendSalesOrder));
      } else {
        setBills([]);
      }

      if (supsRes.status === 'fulfilled') {
        const sups = extractArray(supsRes.value);
        setSuppliers(sups.map(mapBackendSupplier));
      } else {
        setSuppliers([]);
      }

      if (custsRes.status === 'fulfilled') {
        const custs = extractArray(custsRes.value);
        setCustomers(custs.map(mapBackendCustomer));
      } else {
        setCustomers([]);
      }

      if (historyRes.status === 'fulfilled') {
        const txs = extractArray(historyRes.value);
        setStockMovements(txs.map((tx: any) => mapBackendMovement(tx, loadedProducts)));
      } else {
        setStockMovements([]);
      }

      if (usersRes.status === 'fulfilled') {
        const uList = extractArray(usersRes.value);
        if (uList.length > 0) {
          const mappedUsers: User[] = uList.map((m: any) => {
            const initials = (m.name || m.email || 'US')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return {
              id: String(m.id || m.memberId || m._id || m.userId || m.accountId || `user-${Date.now()}`),
              memberId: String(m.memberId || m.id || m._id || ''),
              accountId: String(m.accountId || m.userId || m.account_id || ''),
              name: m.name || m.email,
              email: m.email,
              role: (m.roleId === 'ROLE-ADMIN' || m.role === 'admin' || m.role === 'owner') ? 'admin' : 'salesperson',
              avatarInitials: initials,
              status: m.status === 'inactive' || m.status === 'suspended' ? 'suspended' : 'active',
              lastLogin: m.lastLogin || (m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN') : '-'),
            };
          });
          setUsers(mappedUsers);
        }
      }

      setLoadingStates({
        products: false,
        suppliers: false,
        customers: false,
        purchaseOrders: false,
        salesOrders: false,
        inventory: false,
      });

    } catch (err) {
      console.warn('Backend live sync notice:', err);
    } finally {
      setIsLoadingBackend(false);
      setLoadingStates({
        products: false,
        suppliers: false,
        customers: false,
        purchaseOrders: false,
        salesOrders: false,
        inventory: false,
      });
    }
  };

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      refreshBackendData();
    }
  }, []);

  // Global keyboard shortcuts (⌘K or / to open search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setNotificationDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const switchRole = (role: UserRole) => {
    const targetUser = users.find((u) => u.role === role);
    if (targetUser) {
      setCurrentUser(targetUser);
    } else {
      setCurrentUser((prev) => ({
        ...prev,
        role,
      }));
    }

    if (role === 'salesperson') {
      setActiveRoute('/pos');
    }
  };

  const navigate = useCallback((route: string) => {
    if (onNavigate) {
      onNavigate(route);
    }
    routerNavigate(route);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [onNavigate, routerNavigate]);

  const setActiveRoute = useCallback((route: string) => {
    routerNavigate(route);
  }, [routerNavigate]);

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // non-fatal
    }
    clearAuthSession();
    setIsAuthenticated(false);
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  const updateBusinessProfile = (profile: Partial<BusinessProfile>) => {
    setBusinessProfile((prev) => ({ ...prev, ...profile }));
    businessApi.update(profile).catch((err) => console.warn('Failed to update business on backend:', err));
  };

  // Products actions
  const addProduct = (p: Omit<Product, 'id'>) => {
    const tempId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...p,
      id: tempId,
    };
    setProducts((prev) => [newProduct, ...prev]);

    // Async sync to backend
    productsApi
      .create(mapProductToBackend(p))
      .then((created) => {
        if (created?.productId || created?.id) {
          const mapped = mapBackendProduct(created);
          setProducts((prev) => prev.map((item) => (item.id === tempId ? mapped : item)));
          refreshBackendData();
        }
      })
      .catch((err) => console.error('Failed to sync product to backend:', err));

    if (newProduct.stock > 0) {
      const movement: StockMovement = {
        id: `tx-${Date.now()}`,
        date: 'Today, Just now',
        type: 'Stock In',
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        qtyDelta: newProduct.stock,
        balanceAfter: newProduct.stock,
        reference: 'OPEN-STOCK',
        user: currentUser.name.split(' ')[0],
        amount: newProduct.purchasePrice * newProduct.stock,
      };
      setStockMovements((prev) => [movement, ...prev]);
    }
    return newProduct;
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    productsApi.update(id, mapProductToBackend(updated)).catch((err) =>
      console.warn('Failed to update product on backend:', err)
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    productsApi.delete(id).catch((err) => console.warn('Failed to delete product on backend:', err));
  };


  // Stock operations
  const adjustStock = (productId: string, newStock: number, reason: string, note?: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const prevStock = target.stock;
    const diff = newStock - target.stock;
    if (diff === 0) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );

    const movement: StockMovement = {
      id: `tx-${Date.now()}`,
      date: 'Today, Just now',
      type: 'Adjustment',
      productId: target.id,
      productName: target.name,
      sku: target.sku,
      qtyDelta: diff,
      balanceAfter: newStock,
      reference: `ADJ-${reason.slice(0, 4).toUpperCase()}`,
      user: currentUser.name.split(' ')[0],
      amount: Math.abs(diff) * target.sellingPrice,
    };
    setStockMovements((prev) => [movement, ...prev]);

    inventoryApi
      .recordMovement({
        productId,
        type: 'ADJUSTMENT',
        quantity: newStock,
        reason: `${reason}${note ? ` - ${note}` : ''}`,
      })
      .catch((err) => console.warn('Failed to record adjustment on backend:', err));
  };

  const stockIn = (productId: string, quantity: number, reference: string, note?: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const newStock = target.stock + quantity;

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );

    const movement: StockMovement = {
      id: `tx-${Date.now()}`,
      date: 'Today, Just now',
      type: 'Stock In',
      productId: target.id,
      productName: target.name,
      sku: target.sku,
      qtyDelta: quantity,
      balanceAfter: newStock,
      reference: reference || 'STK-IN',
      user: currentUser.name.split(' ')[0],
      amount: quantity * target.purchasePrice,
    };
    setStockMovements((prev) => [movement, ...prev]);

    inventoryApi
      .recordMovement({
        productId,
        type: 'IN',
        quantity,
        reference: reference || 'STK-IN',
        reason: note || 'Supplier receipt',
      })
      .catch((err) => console.warn('Failed to record stock in on backend:', err));
  };

  const stockOut = (productId: string, quantity: number, reason: string, note?: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const newStock = Math.max(0, target.stock - quantity);

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );

    const movement: StockMovement = {
      id: `tx-${Date.now()}`,
      date: 'Today, Just now',
      type: 'Stock Out',
      productId: target.id,
      productName: target.name,
      sku: target.sku,
      qtyDelta: -quantity,
      balanceAfter: newStock,
      reference: `OUT-${reason.slice(0, 4).toUpperCase()}`,
      user: currentUser.name.split(' ')[0],
      amount: quantity * target.sellingPrice,
    };
    setStockMovements((prev) => [movement, ...prev]);

    inventoryApi
      .recordMovement({
        productId,
        type: 'OUT',
        quantity,
        reference: `OUT-${reason.slice(0, 4).toUpperCase()}`,
        reason: `${reason}${note ? ` - ${note}` : ''}`,
      })
      .catch((err) => console.warn('Failed to record stock out on backend:', err));
  };

  // Suppliers
  const addSupplier = async (s: Omit<Supplier, 'id'>) => {
    const tempId = `sup-${Date.now()}`;
    const newSup: Supplier = {
      ...s,
      id: tempId,
    };
    setSuppliers((prev) => [newSup, ...prev]);

    try {
      const created = await suppliersApi.create(mapSupplierToBackend(s));
      if (created?.supplierId || created?.id) {
        const mapped = mapBackendSupplier(created);
        setSuppliers((prev) => prev.map((item) => (item.id === tempId ? mapped : item)));
        refreshBackendData();
        return mapped;
      }
    } catch (err) {
      console.warn('Failed to sync supplier to backend:', err);
    }

    return newSup;
  };

  const updateSupplier = (id: string, s: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((sup) => (sup.id === id ? { ...sup, ...s } : sup)));
    suppliersApi.update(id, mapSupplierToBackend(s)).catch((err) => console.warn('Failed to update supplier on backend:', err));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((sup) => sup.id !== id));
    suppliersApi.delete(id).catch((err) => console.warn('Failed to delete supplier on backend:', err));
  };

  // Purchase orders
  const createPurchaseOrder = async (po: Omit<PurchaseOrder, 'id' | 'poNumber'>) => {
    const tempId = `po-${Date.now()}`;
    const poNumber = `PO-2026-09${purchaseOrders.length + 1}`;
    const newPO: PurchaseOrder = {
      ...po,
      id: tempId,
      poNumber,
    };
    setPurchaseOrders((prev) => [newPO, ...prev]);

    try {
      const backendPayload = {
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        poNumber,
        expectedDeliveryDate: po.expectedDate,
        shippingCharges: po.shipping,
        items: po.items.map((it) => ({
          productId: it.productId,
          quantity: it.orderedQty,
          purchasePrice: it.unitCost,
          taxRate: it.taxRate,
          discount: 0,
        })),
        notes: po.notes || '',
      };
      const created = await purchaseOrdersApi.create(backendPayload);
      if (created?.purchaseOrderId || created?.id) {
        const mapped = mapBackendPurchaseOrder(created);
        setPurchaseOrders((prev) => prev.map((item) => (item.id === tempId ? mapped : item)));
        refreshBackendData();
        return mapped;
      }
    } catch (err) {
      console.warn('Failed to sync PO to backend:', err);
    }

    return newPO;
  };

  const updatePOStatus = (id: string, status: POStatus) => {
    setPurchaseOrders((prev) => prev.map((po) => (po.id === id ? { ...po, status } : po)));
    purchaseOrdersApi.updateStatus(id, status).catch((err) =>
      console.warn('Failed to update PO status on backend:', err)
    );
  };

  const receivePOItems = (poId: string, receivedMap: Record<string, number>, notes?: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    let allReceived = true;
    const updatedItems = po.items.map((item) => {
      const incoming = receivedMap[item.productId] || 0;
      const newRec = item.receivedQty + incoming;
      if (newRec < item.orderedQty) {
        allReceived = false;
      }

      if (incoming > 0) {
        setProducts((prev) =>
          prev.map((prod) =>
            prod.id === item.productId ? { ...prod, stock: prod.stock + incoming } : prod
          )
        );

        const movement: StockMovement = {
          id: `tx-${Date.now()}-${item.productId}`,
          date: 'Today, Just now',
          type: 'Purchase',
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          qtyDelta: incoming,
          balanceAfter: (products.find((p) => p.id === item.productId)?.stock || 0) + incoming,
          reference: po.poNumber,
          user: currentUser.name.split(' ')[0],
          amount: incoming * item.unitCost,
        };
        setStockMovements((prev) => [movement, ...prev]);

        inventoryApi
          .recordMovement({
            productId: item.productId,
            type: 'IN',
            quantity: incoming,
            reference: po.poNumber,
            reason: `PO Receipt: ${po.poNumber}${notes ? ` - ${notes}` : ''}`,
          })
          .catch((err) => console.warn('Failed to record PO movement on backend:', err));
      }

      return {
        ...item,
        receivedQty: newRec,
      };
    });

    const newStatus: POStatus = allReceived ? 'Received' : 'Partially received';
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, items: updatedItems, status: newStatus } : p))
    );
    purchaseOrdersApi.updateStatus(poId, newStatus).catch(() => { });

  };

  // POS & Billing
  const createBill = (
    billData: Omit<Bill, 'id' | 'billNumber' | 'date' | 'createdBy' | 'salespersonId'>
  ) => {
    const nextInvoiceNum = businessProfile.startingInvoiceNumber + bills.length;
    const billNumber = `${businessProfile.invoicePrefix}${nextInvoiceNum}`;
    const now = new Date();
    const formattedDate = now.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const tempId = `bill-${Date.now()}`;
    const newBill: Bill = {
      ...billData,
      id: tempId,
      billNumber,
      date: formattedDate,
      createdAt: now.toISOString(),
      createdBy: currentUser.name,
      salespersonId: currentUser.id,
    };

    newBill.items.forEach((item) => {
      const prevStock = products.find((p) => p.id === item.productId)?.stock || 0;
      const newStock = businessProfile.allowNegativeStock
        ? prevStock - item.quantity
        : Math.max(0, prevStock - item.quantity);

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === item.productId) {
            return {
              ...p,
              stock: newStock,
            };
          }
          return p;
        })
      );

      const movement: StockMovement = {
        id: `tx-${Date.now()}-${item.productId}`,
        date: 'Today, Just now',
        type: 'Sale',
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        qtyDelta: -item.quantity,
        balanceAfter: Math.max(
          0,
          (products.find((p) => p.id === item.productId)?.stock || 0) - item.quantity
        ),
        reference: billNumber,
        user: currentUser.name.split(' ')[0],
        amount: item.total,
      };
      setStockMovements((prev) => [movement, ...prev]);
    });

    if (newBill.customerId) {
      setCustomers((prev) =>
        prev.map((cust) => {
          if (cust.id === newBill.customerId) {
            return {
              ...cust,
              totalSpent: cust.totalSpent + newBill.total,
              lastPurchase: 'Today',
              outstanding:
                newBill.paymentMethod === 'Credit'
                  ? cust.outstanding + newBill.total
                  : cust.outstanding,
            };
          }
          return cust;
        })
      );
    }

    setBills((prev) => [newBill, ...prev]);

    const validCustomerId =
      newBill.customerId && !newBill.customerId.startsWith('cust-') && newBill.customerId !== 'cust-01'
        ? newBill.customerId
        : undefined;

    posApi
      .checkout({
        items: newBill.items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          taxRate: it.taxRate,
          total: it.total,
        })),
        customerId: validCustomerId,
        customerName: newBill.customerName,
        customerPhone: newBill.customerPhone,
        newCustomer:
          newBill.customerName && newBill.customerName.toLowerCase() !== 'walk-in customer'
            ? {
              name: newBill.customerName,
              phone: newBill.customerPhone || '',
            }
            : undefined,
        billingType: 'retail',
        payments: [
          {
            method: newBill.paymentMethod || 'Cash',
            amount: newBill.total,
            payFull: newBill.paymentMethod !== 'Credit',
          },
        ],
        subtotal: newBill.subtotal,
        taxTotal: newBill.tax,
        discount: newBill.discount,
        grandTotal: newBill.total,
      })
      .then((res: any) => {
        const orderId = res?.salesOrderId || res?.id || res?.invoice?.id || res?.invoice?._id;
        if (orderId) {
          setBills((prev) =>
            prev.map((b) => (b.id === tempId ? { ...b, id: orderId } : b))
          );
        }
        refreshBackendData();
      })
      .catch((err) => console.warn('Failed to record checkout on backend:', err));

    return newBill;
  };

  const cancelBill = (billId: string) => {
    const target = bills.find((b) => b.id === billId);
    if (!target) return;

    target.items.forEach((item) => {
      setProducts((prev) =>
        prev.map((prod) =>
          prod.id === item.productId ? { ...prod, stock: prod.stock + item.quantity } : prod
        )
      );

      const movement: StockMovement = {
        id: `tx-${Date.now()}-${item.productId}`,
        date: 'Today, Just now',
        type: 'Return',
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        qtyDelta: item.quantity,
        balanceAfter: (products.find((p) => p.id === item.productId)?.stock || 0) + item.quantity,
        reference: `RET-${target.billNumber}`,
        user: currentUser.name.split(' ')[0],
        amount: item.total,
      };
      setStockMovements((prev) => [movement, ...prev]);
    });

    setBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, status: 'Cancelled' as const } : b))
    );

    // Sync bill cancellation to backend
    salesOrdersApi.cancel(billId, 'Cancelled via POS').catch((err) => {
      console.warn('Failed to cancel sales order on backend:', err);
    });
  };

  // Customers
  const addCustomer = (
    c: Omit<Customer, 'id' | 'totalSpent' | 'lastPurchase' | 'outstanding'>
  ) => {
    const tempId = `cust-${Date.now()}`;
    const newCust: Customer = {
      ...c,
      id: tempId,
      totalSpent: 0,
      lastPurchase: 'Never',
      outstanding: 0,
    };
    setCustomers((prev) => [newCust, ...prev]);

    customersApi
      .create(c)
      .then((created) => {
        if (created?.customerId || created?.id) {
          const mapped = mapBackendCustomer(created);
          setCustomers((prev) => prev.map((item) => (item.id === tempId ? mapped : item)));
        }
      })
      .catch((err) => console.warn('Failed to sync customer to backend:', err));

    return newCust;
  };

  const updateCustomer = (id: string, c: Partial<Customer>) => {
    setCustomers((prev) => prev.map((cust) => (cust.id === id ? { ...cust, ...c } : cust)));
    customersApi.update(id, c).catch((err) => console.warn('Failed to update customer on backend:', err));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    customersApi.delete(id).catch((err) => console.warn('Failed to delete customer on backend:', err));
  };

  const recordCustomerPayment = (
    customerId: string,
    amount: number,
    method: string,
    notes?: string
  ) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId ? { ...c, outstanding: Math.max(0, c.outstanding - amount) } : c
      )
    );
    const target = customers.find((c) => c.id === customerId);

    // Sync to backend
    customersApi
      .update(customerId, {
        outstanding: Math.max(0, (target?.outstanding || 0) - amount),
      })
      .catch((err) => console.warn('Failed to update customer balance on backend:', err));

    paymentsApi
      .create({
        customerId,
        amount,
        paymentMethod: method,
        notes: notes || 'Customer balance settlement',
      })
      .catch((err) => console.warn('Failed to record payment on backend:', err));

  };

  // Users & Team
  const addUser = async (
    userData: Omit<User, 'id' | 'lastLogin' | 'accountId' | 'memberId'>,
  ): Promise<{ user: User; temporaryPassword: string }> => {
    const initials = userData.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const saved = await usersApi.invite({
      name: userData.name,
      email: userData.email,
      roleId: 'ROLE-SALESPERSON',
    });
    if (!saved || typeof saved.id !== 'string' || typeof saved.accountId !== 'string' ||
      typeof saved.temporaryPassword !== 'string' || !saved.temporaryPassword) {
      throw new Error('The server returned an invalid account-creation response. Contact support before signing in.');
    }

    const newUser: User = {
      ...userData,
      id: saved.id,
      memberId: saved.id,
      accountId: saved.accountId,
      avatarInitials: initials,
      lastLogin: 'Never',
      status: 'active',
    };
    setUsers((prev) => [...prev, newUser]);
    return { user: newUser, temporaryPassword: saved.temporaryPassword };
  };

  const updateUserStatus = async (id: string, status: 'active' | 'suspended') => {
    const currentUser = users.find((user) => user.id === id);
    if (!currentUser?.accountId) {
      throw new Error('Unable to identify this salesperson account. Refresh the page and try again.');
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
    try {
      await usersApi.setStatus(currentUser.accountId, status === 'suspended' ? 'inactive' : 'active');
    } catch (error) {
      setUsers((prev) => prev.map((user) => (
        user.id === id ? { ...user, status: currentUser.status } : user
      )));
      throw error;
    }
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    usersApi.delete(id).catch((err) => console.warn('Failed to delete user on backend:', err));
  };

  // Notifications
  const markAllNotificationsAsRead = () => {
    notificationsApi.markAllRead()
      .then(() => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false }))))
      .catch((err) => console.warn('Failed to mark notifications as read:', err));
  };

  const markNotificationAsRead = (id: string) => {
    if (!UUID_PATTERN.test(id)) {
      console.warn('Ignoring mark-read request for an invalid notification ID.');
      return;
    }
    notificationsApi.markRead(id)
      .then(() => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n))))
      .catch((err) => console.warn('Failed to mark notification as read:', err));
  };

  // Helper to determine if a bill was created on today's date
  const isBillFromToday = (b: Bill): boolean => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    if (b.createdAt) {
      const d = new Date(b.createdAt);
      if (!isNaN(d.getTime())) {
        return (
          d.getFullYear() === todayYear &&
          d.getMonth() === todayMonth &&
          d.getDate() === todayDate
        );
      }
    }

    if (typeof b.date === 'string') {
      const lower = b.date.toLowerCase();
      if (lower.startsWith('today')) return true;

      const d = new Date(b.date);
      if (!isNaN(d.getTime())) {
        return (
          d.getFullYear() === todayYear &&
          d.getMonth() === todayMonth &&
          d.getDate() === todayDate
        );
      }
    }

    return false;
  };

  // Computed metrics
  const totalStockValue = products.reduce((acc, p) => acc + p.purchasePrice * p.stock, 0);
  const todaySales = bills
    .filter((b) => b.status !== 'Cancelled' && isBillFromToday(b))
    .reduce((acc, b) => acc + (Number(b.total) || 0), 0);
  const lowStockCount = products.filter((p) => p.stock <= p.reorderLevel).length;
  const openPOCount = purchaseOrders.filter(
    (p) => p.status === 'Ordered' || p.status === 'Partially received'
  ).length;

  const contextValue = useMemo(() => ({
    isBackendConnected,
    isLoadingBackend,
    loadingStates,
    refreshBackendData,
    isAuthenticated,
    logout,
    activeRoute,
    setActiveRoute,
    navigate,
    currentUser,
    setCurrentUser,
    switchRole,
    users,
    addUser,
    updateUserStatus,
    deleteUser,
    businessProfile,
    updateBusinessProfile,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    stockMovements,
    adjustStock,
    stockIn,
    stockOut,
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    purchaseOrders,
    createPurchaseOrder,
    updatePOStatus,
    receivePOItems,
    bills,
    createBill,
    cancelBill,
    posActiveTab,
    setPosActiveTab,
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordCustomerPayment,
    customersActiveTab,
    setCustomersActiveTab,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    isNotificationDrawerOpen,
    setNotificationDrawerOpen,
    notifications,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    selectedDateRange,
    setSelectedDateRange,
    metrics: {
      totalStockValue,
      todaySales,
      lowStockCount,
      openPOCount,
    },
  }), [
    isBackendConnected,
    isLoadingBackend,
    loadingStates,
    isAuthenticated,
    activeRoute,
    currentUser,
    users,
    businessProfile,
    products,
    stockMovements,
    suppliers,
    purchaseOrders,
    bills,
    posActiveTab,
    customers,
    customersActiveTab,
    isCommandPaletteOpen,
    isNotificationDrawerOpen,
    notifications,
    selectedDateRange,
    totalStockValue,
    todaySales,
    lowStockCount,
    openPOCount,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
