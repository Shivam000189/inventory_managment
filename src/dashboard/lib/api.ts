/**
 * Client API Layer for connecting the Frontend directly to the Inventory System Aflix Backend
 */

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) {
    if (typeof window !== 'undefined' && window.location.hostname) {
      return `${window.location.protocol}//${window.location.hostname}:4000/api`;
    }
    return 'http://localhost:4000/api';
  }
  return '/api';
};

const BASE_URL = getApiBaseUrl();

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/sr_csrf=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  try {
    return localStorage.getItem('sr_csrf');
  } catch {
    return null;
  }
}

function getAuthToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem('sr_token');
  } catch {
    return null;
  }
}

export function setAuthSession(session: { token?: string; csrfToken?: string }) {
  try {
    if (session.token) localStorage.setItem('sr_token', session.token);
    if (session.csrfToken) localStorage.setItem('sr_csrf', session.csrfToken);
  } catch {
    // Ignore localStorage errors
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem('sr_token');
    localStorage.removeItem('sr_csrf');
  } catch {
    // Ignore
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const csrf = getCsrfToken();
  if (csrf && !headers.has('x-csrf-token')) {
    headers.set('x-csrf-token', csrf);
  }

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends HTTP-only session cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || `HTTP error ${response.status}`;
    throw new Error(errorMsg);
  }

  return (data?.data ?? data) as T;
}

// 1. Auth API
export const authApi = {
  me: () => request<any>('/auth/me'),
  login: async (credentials: { email: string; password: string; role?: string }) => {
    const res = await request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
    if (res?.token || res?.csrfToken) setAuthSession(res);
    return res;
  },
  logout: async () => {
    try {
      await request<any>('/auth/logout', { method: 'POST' });
    } finally {
      clearAuthSession();
    }
  },
  register: (payload: any) =>
    request<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (payload: any) =>
    request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload: any) =>
    request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
};

// 2. Business Profile API
export const businessApi = {
  get: () => request<any>('/businesses/me'),
  update: (profile: any) => request<any>('/businesses/me', { method: 'PUT', body: JSON.stringify(profile) }),
};

// 3. Products API
export const productsApi = {
  list: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/products${qs ? `?${qs}` : ''}`);
  },
  create: (product: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(product) }),
  update: (id: string, product: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),
  delete: (id: string) => request<any>(`/products/${id}`, { method: 'DELETE' }),
};

// 4. Inventory & Movements API
export const inventoryApi = {
  recordMovement: (movement: {
    productId: string;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    reason?: string;
    reference?: string;
  }) => {
    const sectionMap: Record<string, string> = {
      IN: 'Stock In',
      OUT: 'Stock Out',
      ADJUSTMENT: 'Adjustments',
    };
    return request<any>('/inventory/operations', {
      method: 'POST',
      body: JSON.stringify({
        section: sectionMap[movement.type] || 'Stock In',
        productId: movement.productId,
        quantity: movement.quantity,
        reason: movement.reason || movement.reference || '',
      }),
    });
  },
  history: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/inventory/transactions${qs ? `?${qs}` : ''}`);
  },
  transactions: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/inventory/transactions${qs ? `?${qs}` : ''}`);
  },
  summary: () => request<any>('/reports/summary'),
};

// 5. Suppliers API
export const suppliersApi = {
  list: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/suppliers${qs ? `?${qs}` : ''}`);
  },
  create: (supplier: any) => request<any>('/suppliers', { method: 'POST', body: JSON.stringify(supplier) }),
  update: (id: string, supplier: any) => request<any>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(supplier) }),
  delete: (id: string) => request<any>(`/suppliers/${id}`, { method: 'DELETE' }),
};

// 6. Customers API
export const customersApi = {
  list: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/customers${qs ? `?${qs}` : ''}`);
  },
  create: (customer: any) => request<any>('/customers', { method: 'POST', body: JSON.stringify(customer) }),
  update: (id: string, customer: any) => request<any>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(customer) }),
  delete: (id: string) => request<any>(`/customers/${id}`, { method: 'DELETE' }),
};

// 7. Purchase Orders API
export const purchaseOrdersApi = {
  list: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/purchase-orders${qs ? `?${qs}` : ''}`);
  },
  create: (po: any) => request<any>('/purchase-orders', { method: 'POST', body: JSON.stringify(po) }),
  get: (id: string) => request<any>(`/purchase-orders/${id}`),
  update: (id: string, po: any) => request<any>(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(po) }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/purchase-orders/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
};

// 8. Sales Orders & Bills API
export const salesOrdersApi = {
  list: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any[]>(`/sales-orders${qs ? `?${qs}` : ''}`);
  },
  create: (order: any) => request<any>('/sales-orders', { method: 'POST', body: JSON.stringify(order) }),
  get: (id: string) => request<any>(`/sales-orders/${id}`),
};

// 9. POS Terminal Checkout API
export const posApi = {
  catalog: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request<any>(`/pos/catalog${qs ? `?${qs}` : ''}`);
  },
  checkout: (payload: any) => request<any>('/pos/checkout', { method: 'POST', body: JSON.stringify(payload) }),
};

// 10. Reports API
export const reportsApi = {
  summary: () => request<any>('/reports/summary'),
};

// 11. Team & Users API
export const usersApi = {
  listMembers: () => request<any[]>('/users'),
  invite: (payload: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: any) => request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id: string) => request<any>(`/users/${id}`, { method: 'DELETE' }),
};

// 12. Notifications API
export const notificationsApi = {
  list: () => request<any[]>('/notifications'),
  markRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),
};

