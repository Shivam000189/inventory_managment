import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, '..');

const VIEWPORTS = [
  { name: '1440px', width: 1440, height: 900 },
  { name: '390px', width: 390, height: 844 },
];

const THEMES = ['light', 'dark'];

const TARGET_ROUTES = [
  { label: 'landing', path: '/landing', isPublic: true },
  { label: 'auth', path: '/login', isPublic: true },
  { label: 'dashboard', path: '/', isPublic: false },
  { label: 'products', path: '/products', isPublic: false },
  { label: 'inventory', path: '/stock', isPublic: false },
  { label: 'POS', path: '/pos', isPublic: false },
  { label: 'sales', path: '/sales-orders', isPublic: false },
  { label: 'purchasing', path: '/purchase-orders', isPublic: false },
  { label: 'returns', path: '/returns', isPublic: false },
  { label: 'customers', path: '/customers', isPublic: false },
  { label: 'reports', path: '/reports/sales', isPublic: false },
  { label: 'settings', path: '/settings/business', isPublic: false },
  { label: 'team', path: '/team', isPublic: false },
];

const outDir = 'C:/tmp/ui-baseline';
fs.mkdirSync(outDir, { recursive: true });

// Also mirror to /tmp/ui-baseline if on a unix/wsl/msys environment
try {
  fs.mkdirSync('/tmp/ui-baseline', { recursive: true });
} catch {}

const MOCK_USER = {
  userId: 'usr_demo123',
  name: 'Shivam Sharma',
  email: 'shivam12@gmail.com',
  role: 'owner',
  permissions: [
    'view_inventory', 'stock_in', 'stock_out', 'edit_product', 'create_order',
    'process_pos_sale', 'view_reports', 'manage_users', 'view_variants',
    'view_replenishment', 'manage_promotions', 'manage_loyalty', 'manage_coupons',
    'manage_gift_cards', 'manage_cashier_shift', 'view_clothing_reports'
  ],
  onboarding: { status: 'completed' },
};

const MOCK_BUSINESS = {
  businessId: 'biz_demo123',
  name: 'Aflix Wholesale & Retail Co',
  industry: 'pharmacy',
  currency: 'INR',
  address: '123 Market Road, Mumbai, Maharashtra 400001',
  phone: '+91 98765 43210',
  email: 'contact@aflix.com',
  capabilities: {
    productLabel: 'Medicines',
    modules: ['pos', 'credit_sales', 'bulk_orders', 'purchase_orders', 'inventory', 'reports', 'clothing', 'pharmacy', 'manufacturing', 'wholesale'],
  },
  settings: { lowStockThreshold: 15, reorderLevel: 30, enableBatchTracking: true, enableExpiryTracking: true },
};

const MOCK_PRODUCTS = [
  { productId: 'prod_1', name: 'Paracetamol 500mg', sku: 'PARA-500', category: 'Analgesics', brand: 'Cipla', unit: 'strip', currentStock: 250, minimumStock: 30, purchasePrice: 12.5, sellingPrice: 25.0, mrp: 30.0, batchNumber: 'BAT-001', expiryDate: '2027-05-15', rackLocation: 'A-01', variants: [] },
  { productId: 'prod_2', name: 'Amoxicillin 250mg DT', sku: 'AMX-250', category: 'Antibiotics', brand: 'Sun Pharma', unit: 'strip', currentStock: 12, minimumStock: 20, purchasePrice: 42.0, sellingPrice: 85.0, mrp: 95.0, batchNumber: 'AMX-892', expiryDate: '2026-12-10', rackLocation: 'B-04', variants: [] },
];

async function setupMocks(page, isPublic) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    if (
      pathname.startsWith('/src/') ||
      pathname.startsWith('/@') ||
      pathname.startsWith('/node_modules/') ||
      pathname.startsWith('/public/') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.jsx') ||
      pathname.endsWith('.tsx') ||
      pathname.endsWith('.ts') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.ico')
    ) {
      return route.continue();
    }

    const isApi = pathname.startsWith('/api') || url.port === '4000';
    if (!isApi) {
      return route.continue();
    }

    const respond = (data, status = 200) => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data }),
      });
    };

    if (pathname.includes('/auth/me')) {
      if (isPublic) return respond(null, 401);
      return respond({ user: MOCK_USER, business: MOCK_BUSINESS });
    }
    if (pathname.includes('/auth/login') || pathname.includes('/auth/signin')) {
      return respond({ token: 'mock-jwt-token', user: MOCK_USER, business: MOCK_BUSINESS });
    }
    if (pathname.includes('/businesses/current') || pathname.includes('/business')) {
      return respond(MOCK_BUSINESS);
    }
    if (pathname.includes('/products')) {
      return respond(MOCK_PRODUCTS);
    }
    if (pathname.includes('/suppliers')) {
      return respond([{ supplierId: 'sup_1', name: 'Metro Pharma Wholesale Hub', phone: '+91 98200 11223' }]);
    }
    if (pathname.includes('/customers')) {
      return respond([{ customerId: 'cust_1', name: 'City Heart Clinic', phone: '+91 98234 56789' }]);
    }
    if (pathname.includes('/purchase-orders')) {
      return respond([{ id: 'po_1', orderNumber: 'PO-2026-001', supplierName: 'Metro Pharma', totalAmount: 48500, status: 'Pending' }]);
    }
    if (pathname.includes('/sales-orders')) {
      return respond([{ id: 'so_1', orderNumber: 'SO-101', customerName: 'City Heart Clinic', totalAmount: 1400, total_amount: 1400, status: 'Completed', createdAt: new Date().toISOString() }]);
    }
    if (pathname.includes('/returns')) {
      return respond([]);
    }
    if (pathname.includes('/inventory')) {
      return respond([]);
    }
    if (pathname.includes('/reports')) {
      return respond({ totalRevenue: 284500, totalOrders: 142, unitsInStock: 2850, warehouseCostValue: 184200, lowStockCount: 4, monthlyRevenueSeries: [] });
    }
    if (pathname.includes('/users')) {
      return respond([MOCK_USER]);
    }

    respond([]);
  });
}

async function run() {
  console.log('=== Capturing Baseline Screenshots (Phase 0 Step 3) ===');
  const port = 5200;
  const viteServer = await createServer({
    root: clientDir,
    server: { port, host: 'localhost' },
    logLevel: 'error',
  });
  await viteServer.listen();
  const baseUrl = `http://localhost:${port}`;
  console.log(`Vite server running at ${baseUrl}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const manifest = [];

  for (const route of TARGET_ROUTES) {
    for (const vp of VIEWPORTS) {
      for (const theme of THEMES) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
        });
        const page = await context.newPage();

        await setupMocks(page, route.isPublic);

        await page.addInitScript(({ th, isPub, user, biz }) => {
          try {
            window.localStorage.setItem('stockroom-theme', th);
            if (!isPub) {
              window.localStorage.setItem('stockroom-token', 'mock-token');
              window.localStorage.setItem('stockroom-session', JSON.stringify({ user, business: biz }));
            }
          } catch {}
          document.addEventListener('DOMContentLoaded', () => {
            if (document.documentElement) {
              document.documentElement.setAttribute('data-theme', th);
            }
          });
        }, { th: theme, isPub: route.isPublic, user: MOCK_USER, biz: MOCK_BUSINESS });

        const targetUrl = `${baseUrl}${route.path}`;
        try {
          await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 15000 });
        } catch {
          try { await page.goto(targetUrl, { waitUntil: 'load', timeout: 8000 }); } catch {}
        }

        await page.evaluate((th) => {
          document.documentElement.setAttribute('data-theme', th);
        }, theme);

        await page.waitForTimeout(500);

        const fileName = `${route.label}-${vp.name}-${theme}.png`;
        const filePath = path.join(outDir, fileName);
        await page.screenshot({ path: filePath, fullPage: true });

        // Copy to /tmp/ui-baseline if exists
        try {
          fs.copyFileSync(filePath, path.join('/tmp/ui-baseline', fileName));
        } catch {}

        manifest.push({
          route: route.label,
          path: route.path,
          viewport: vp.name,
          theme,
          file: fileName,
        });

        console.log(`Saved: ${fileName}`);
        await context.close();
      }
    }
  }

  await browser.close();
  await viteServer.close();

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Finished capturing ${manifest.length} baseline screenshots in ${outDir}`);
}

run().catch((err) => {
  console.error('Error running baseline capture:', err);
  process.exit(1);
});
