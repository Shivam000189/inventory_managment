import React, { createContext, useContext, useState, useEffect } from 'react';
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
  clearAuthSession,
} from '../lib/api';

const defaultBusinessProfile: BusinessProfile = {
  id: '00000000-6ade-f06e-2068-a3fe86739d2c',
  name: 'aflix',
  legalName: 'aflix pharma',
  gstin: 'SKA',
  pan: '',
  phone: '9999999999',
  email: 'shivam12@gmail.com',
  address: 'amita nagar 64, Agra, Uttar Pradesh, India',
  city: 'Agra',
  state: 'Uttar Pradesh',
  pincode: '282001',
  currency: 'INR',
  currencySymbol: '₹',
  financialYearStart: 'April',
  invoicePrefix: 'AFLX-',
  startingInvoiceNumber: 1001,
  defaultPaymentTerms: 'Net 30',
  defaultTaxRate: 12,
  allowNegativeStock: false,
  enableBatchTracking: true,
  enableSerialTracking: false,
  lowStockThreshold: 12,
  businessType: 'Wholesale',
  taxEnabled: true,
  defaultGstRate: 12,
  upiId: 'aflixpharma@icici',
};

const defaultUser: User = {
  id: '00000000-6ade-f033-2068-a3fe86739d2b',
  name: 'shivam12',
  email: 'shivam12@gmail.com',
  role: 'admin',
  avatarInitials: 'SS',
  status: 'active',
  lastLogin: 'Just now',
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
    lastOrderDate: s.lastOrderDate || 'Recently',
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
  return {
    id: String(c.customerId || c.id || c._id || `cust-${Date.now()}`),
    name: c.name || '',
    phone: c.phone || '',
    email: c.email || '',
    type: (c.type as any) || 'Retail',
    gstin: c.gstin || c.gstNumber || '',
    address: c.address || (c.city ? `${c.city}, ${c.country || 'India'}` : ''),
    totalSpent: Number(c.totalSpent || c.total_spent || 0),
    lastPurchase: c.lastPurchase || 'Recently',
    outstanding: Number(c.outstanding || c.outstandingBalance || 0),
    creditLimit: Number(c.creditLimit || 50000),
  };
}

function mapBackendPurchaseOrder(po: any): PurchaseOrder {
  return {
    id: String(po.purchaseOrderId || po.id || po._id || `po-${Date.now()}`),
    poNumber: po.poNumber || `PO-${String(po.purchaseOrderId || po.id || '').slice(-6)}`,
    supplierId: po.supplierId || '',
    supplierName: po.supplierName || 'Supplier',
    orderDate: po.orderDate || (po.createdAt ? new Date(po.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '26 Oct 2026'),
    expectedDate: po.expectedDate || po.expectedDelivery || '28 Oct 2026',
    status: (po.status as POStatus) || 'Ordered',
    items: (po.items || []).map((item: any) => ({
      productId: item.productId,
      productName: item.productName || item.name || 'Item',
      sku: item.sku || '',
      orderedQty: Number(item.orderedQty || item.quantity || 0),
      receivedQty: Number(item.receivedQty || 0),
      unitCost: Number(item.unitCost || item.purchasePrice || 0),
      taxRate: Number(item.taxRate || 18),
      lineTotal: Number(item.lineTotal || item.total || 0),
    })),
    subtotal: Number(po.subtotal || 0),
    discount: Number(po.discount || 0),
    tax: Number(po.tax || po.taxTotal || 0),
    shipping: Number(po.shipping || 0),
    total: Number(po.total || po.grandTotal || 0),
    paymentStatus: (po.paymentStatus as any) || 'Unpaid',
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
    customerId: so.customerId || so.customer_id || 'cust-01',
    customerName: so.customerName || so.customer_name || so.customerSnapshot?.name || 'Walk-in Customer',
    customerPhone: so.customerPhone || so.customer_phone || so.customerSnapshot?.phone,
    items: (so.items || []).map((item: any) => ({
      productId: item.productId || item.product_id,
      productName: item.productName || item.product_name || item.name || 'Item',
      sku: item.sku || item.variantSku || '',
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || item.sellingPrice || item.price || item.selling_price || 0),
      discountAmount: Number(item.discountAmount || item.discount || 0),
      taxRate: Number(item.taxRate || item.gstRate || item.tax_rate || 18),
      total: Number(item.total || 0),
    })),
    subtotal,
    discount,
    tax,
    total,
    paymentMethod,
    status,
    createdBy: so.createdBy || so.created_by || 'Shivam Sharma',
    salespersonId: so.salespersonId || so.cashierId || so.cashier_id || 'user-01',
    cashTendered: so.cashTendered || so.cash_tendered,
    changeDue: so.changeDue || so.change_due,
    notes: so.notes || '',
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
    balanceAfter: Number(m.balanceAfter || m.balance || 0),
    reference: m.reference || m.reason || 'Movement',
    user: m.user || m.createdBy || 'Admin',
    amount: Number(m.amount || 0),
  };
}

// --- App Context Type ---

interface AppContextType {
  // Backend status & Authentication
  isBackendConnected: boolean;
  isLoadingBackend: boolean;
  refreshBackendData: () => Promise<void>;
  isAuthenticated: boolean;
  loginWithSession: (session: { user: any; business?: any }) => void;
  logout: () => Promise<void>;

  // Navigation & Role
  activeRoute: string;
  setActiveRoute: (route: string) => void;
  navigate: (route: string) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'lastLogin'>) => void;
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

  // Navigation
  const [activeRoute, setActiveRoute] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.pathname) {
      return window.location.pathname;
    }
    return '/';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem('sr_token') || sessionStorage.getItem('sr_auth'));
  });

  useEffect(() => {
    const handlePopState = () => {
      setActiveRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
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
      const b = initialBusiness;
      setBusinessProfile((prev) => ({
        ...prev,
        id: b.businessId || b.id || prev.id,
        name: b.name || prev.name,
        currency: b.currency || 'INR',
        businessType: b.businessType || prev.businessType,
        address: b.address || (b.city ? `${b.city}, India` : prev.address),
      }));
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
    try {
      // 1. Check existing session or authenticate with the live database account
      let session: any = null;
      try {
        session = await authApi.me();
      } catch {
        if (!initialUser) {
          try {
            session = await authApi.login({
              email: 'shivam12@gmail.com',
              password: 'admin12345',
            });
          } catch (loginErr) {
            console.warn('Backend session fallback note:', loginErr);
          }
        }
      }

      if (session?.user) {
        setIsBackendConnected(true);
        setCurrentUser({
          id: session.user.id || session.user.accountId || initialUser?.id || 'user-01',
          name: session.user.name || initialUser?.name || 'User',
          email: session.user.email || initialUser?.email || '',
          role: session.user.role === 'owner' || session.user.role === 'admin' ? 'admin' : 'salesperson',
          avatarInitials: (session.user.name || initialUser?.name || 'US')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
          status: 'active',
          lastLogin: 'Just now',
        });
      }

      if (session?.business) {
        setBusinessProfile((prev) => ({
          ...prev,
          id: session.business.businessId || session.business.id || prev.id,
          name: session.business.name || prev.name,
          currency: session.business.currency || 'INR',
          businessType: session.business.businessType || prev.businessType,
          address: session.business.address || (session.business.city ? `${session.business.city}, India` : prev.address),
        }));
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

      // 2. Fetch live database collections in parallel
      const [
        prodsRes,
        supsRes,
        custsRes,
        posRes,
        sosRes,
        historyRes,
        bizRes,
        usersRes,
      ] = await Promise.allSettled([
        productsApi.list(),
        suppliersApi.list(),
        customersApi.list(),
        purchaseOrdersApi.list(),
        salesOrdersApi.list(),
        inventoryApi.history(),
        businessApi.get(),
        usersApi.listMembers(),
      ]);

      if (bizRes.status === 'fulfilled' && bizRes.value) {
        const b = bizRes.value;
        setBusinessProfile((prev) => ({
          ...prev,
          id: b.businessId || b.id || prev.id,
          name: b.name || prev.name,
          currency: b.currency || 'INR',
          businessType: b.businessType || prev.businessType,
          address: b.address || (b.city ? `${b.city}, India` : prev.address),
          phone: b.phone || prev.phone,
          email: b.email || prev.email,
        }));
      }

      let loadedProducts: Product[] = [];
      if (prodsRes.status === 'fulfilled') {
        const prods = extractArray(prodsRes.value);
        if (prods.length > 0) {
          loadedProducts = prods.map(mapBackendProduct);
          setProducts(loadedProducts);
          setIsBackendConnected(true);
        } else if (session?.user || initialUser) {
          setProducts([]);
          setIsBackendConnected(true);
        }
      }

      if (supsRes.status === 'fulfilled') {
        const sups = extractArray(supsRes.value);
        setSuppliers(sups.map(mapBackendSupplier));
      }

      if (custsRes.status === 'fulfilled') {
        const custs = extractArray(custsRes.value);
        setCustomers(custs.map(mapBackendCustomer));
      }

      if (posRes.status === 'fulfilled') {
        const pos = extractArray(posRes.value);
        setPurchaseOrders(pos.map(mapBackendPurchaseOrder));
      }

      if (sosRes.status === 'fulfilled') {
        const sos = extractArray(sosRes.value);
        setBills(sos.map(mapBackendSalesOrder));
      }

      if (historyRes.status === 'fulfilled') {
        const txs = extractArray(historyRes.value);
        if (txs.length > 0) {
          setStockMovements(txs.map((tx: any) => mapBackendMovement(tx, loadedProducts)));
        }
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
              id: String(m.id || m._id || m.userId || m.accountId || `user-${Date.now()}`),
              name: m.name || m.email,
              email: m.email,
              role: (m.roleId === 'ROLE-ADMIN' || m.role === 'admin' || m.role === 'owner') ? 'admin' : 'salesperson',
              avatarInitials: initials,
              status: m.status === 'inactive' || m.status === 'suspended' ? 'suspended' : 'active',
              lastLogin: m.lastLogin || (m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN') : 'Recently'),
            };
          });
          setUsers(mappedUsers);
        }
      }
    } catch (err) {
      console.warn('Backend live sync notice:', err);
    } finally {
      setIsLoadingBackend(false);
    }
  };

  useEffect(() => {
    refreshBackendData();
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
    const targetUser = users.find((u) => u.role === role) || {
      id: role === 'admin' ? 'user-01' : 'user-02',
      name: role === 'admin' ? 'Shivam Sharma' : 'Rohan Mehra',
      email: role === 'admin' ? 'shivam12@gmail.com' : 'rohan.pos@Inventory.app',
      role,
      avatarInitials: role === 'admin' ? 'SS' : 'RM',
      status: 'active' as const,
      lastLogin: 'Just now',
    };
    setCurrentUser(targetUser);

    if (role === 'salesperson') {
      setActiveRoute('/app/pos');
    }
  };

  const navigate = (route: string) => {
    setActiveRoute(route);
    if (onNavigate) {
      onNavigate(route);
    }
    if (typeof window !== 'undefined' && window.location.pathname !== route) {
      try {
        window.history.pushState({}, '', route);
      } catch {
        // non-fatal in restricted iframes
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loginWithSession = (session: { user: any; business?: any }) => {
    setIsAuthenticated(true);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('sr_auth', '1');
    }
    if (session?.user) {
      const u = session.user;
      const initials = (u.name || u.email || 'US')
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      setCurrentUser({
        id: u.id || u.accountId || 'user-01',
        name: u.name || u.email || 'Demo User',
        email: u.email || 'demo@stockroom.test',
        role: u.role === 'owner' || u.role === 'admin' ? 'admin' : 'salesperson',
        avatarInitials: initials,
        status: 'active',
        lastLogin: 'Just now',
      });
    }
    if (session?.business) {
      const b = session.business;
      setBusinessProfile((prev) => ({
        ...prev,
        id: b.businessId || b.id || prev.id,
        name: b.name || prev.name,
        currency: b.currency || 'INR',
        businessType: b.businessType || prev.businessType,
        address: b.address || (b.city ? `${b.city}, India` : prev.address),
      }));
    }
    setIsBackendConnected(true);
    refreshBackendData();
    navigate('/app/overview');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // non-fatal
    }
    clearAuthSession();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('sr_auth');
    }
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

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'PO Received',
      message: `${po.poNumber} items received from ${po.supplierName}. Inventory updated.`,
      type: 'po_due',
      time: 'Just now',
      dateGroup: 'Today',
      unread: true,
      link: '/app/inventory',
    };
    setNotifications((prev) => [newNotif, ...prev]);
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
      setProducts((prev) =>
        prev.map((prod) => {
          if (prod.id === item.productId) {
            return {
              ...prod,
              stock: businessProfile.allowNegativeStock
                ? prod.stock - item.quantity
                : Math.max(0, prod.stock - item.quantity),
            };
          }
          return prod;
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

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'New Bill Created',
      message: `${billNumber} created for ₹ ${newBill.total.toLocaleString(
        'en-IN'
      )} by ${currentUser.name}.`,
      type: 'sale',
      time: 'Just now',
      dateGroup: 'Today',
      unread: true,
      link: '/app/pos',
    };
    setNotifications((prev) => [newNotif, ...prev]);

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

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Customer Payment',
      message: `Received ₹ ${amount.toLocaleString('en-IN')} from ${target?.name || 'Customer'
        } via ${method}.`,
      type: 'payment',
      time: 'Just now',
      dateGroup: 'Today',
      unread: true,
      link: '/app/customers',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Users & Team
  const addUser = (userData: Omit<User, 'id' | 'lastLogin'>) => {
    const initials = userData.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const tempId = `user-${Date.now()}`;
    const newUser: User = {
      ...userData,
      id: tempId,
      avatarInitials: initials,
      lastLogin: 'Never',
    };
    setUsers((prev) => [...prev, newUser]);

    // Persist to database via API
    usersApi
      .invite({
        name: userData.name,
        email: userData.email,
        role: userData.role === 'admin' ? 'ROLE-ADMIN' : 'ROLE-SALESPERSON',
        password: userData.tempPassword || 'Pass@1234',
        tempPassword: userData.tempPassword || 'Pass@1234',
        status: 'active',
      })
      .then((res: any) => {
        const saved = res?.data || res;
        if (saved) {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === tempId
                ? {
                    ...u,
                    id: String(saved.id || saved.userId || saved._id || saved.accountId || u.id),
                    status: 'active',
                  }
                : u
            )
          );
        }
      })
      .catch((err) => console.warn('Failed to add user to database:', err));
  };

  const updateUserStatus = (id: string, status: 'active' | 'suspended') => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
    usersApi
      .update(id, { status: status === 'suspended' ? 'inactive' : 'active' })
      .catch((err) => console.warn('Failed to update user status on backend:', err));
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    usersApi.delete(id).catch((err) => console.warn('Failed to delete user on backend:', err));
  };

  // Notifications
  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
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

  return (
    <AppContext.Provider
      value={{
        isBackendConnected,
        isLoadingBackend,
        refreshBackendData,
        isAuthenticated,
        loginWithSession,
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
      }}
    >
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
