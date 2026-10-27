import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Viewports from specification
const VIEWPORTS = [
  { width: 360, height: 740, name: '360x740' },
  { width: 390, height: 844, name: '390x844' },
  { width: 768, height: 1024, name: '768x1024' },
  { width: 1024, height: 768, name: '1024x768' },
  { width: 1280, height: 800, name: '1280x800' },
  { width: 1536, height: 864, name: '1536x864' },
];

const THEMES = ['light', 'dark'];

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const prefix = `--${name}=`;
  const match = args.find((a) => a.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
};

const mode = getArg('mode', 'before'); // 'before' | 'after'
const targetRouteFilter = getArg('routes', 'all');
const targetViewportFilter = getArg('viewports', 'all');
const targetThemeFilter = getArg('themes', 'all');
const port = Number(getArg('port', '5188'));
const fastMode = args.includes('--fast'); // tests key viewports (360x740, 1280x800) for rapid iteration

// Mock API Data
const MOCK_USER = {
  userId: 'usr_demo123',
  name: 'Shivam Admin',
  email: 'shivam12@gmail.com',
  role: 'owner',
  permissions: [
    'view_inventory',
    'stock_in',
    'stock_out',
    'edit_product',
    'create_order',
    'process_pos_sale',
    'view_reports',
    'manage_users',
    'view_variants',
    'view_replenishment',
    'manage_promotions',
    'manage_loyalty',
    'manage_coupons',
    'manage_gift_cards',
    'manage_cashier_shift',
    'view_clothing_reports',
  ],
  onboarding: { status: 'completed' },
};

const MOCK_BUSINESS = {
  businessId: 'biz_demo123',
  name: 'Aflix Wholesale & Pharmacy',
  industry: 'pharmacy',
  currency: 'INR',
  address: '123 Market Road, Mumbai, Maharashtra 400001',
  phone: '+91 98765 43210',
  email: 'contact@aflix.com',
  capabilities: {
    productLabel: 'Medicines',
    modules: [
      'pos',
      'credit_sales',
      'bulk_orders',
      'purchase_orders',
      'inventory',
      'reports',
      'clothing',
      'pharmacy',
      'manufacturing',
      'wholesale',
    ],
  },
  settings: {
    lowStockThreshold: 15,
    reorderLevel: 30,
    enableBatchTracking: true,
    enableExpiryTracking: true,
  },
};

const MOCK_PRODUCTS = [
  {
    productId: 'prod_1',
    name: 'Paracetamol 500mg',
    sku: 'PARA-500',
    category: 'Analgesics',
    brand: 'Cipla Ltd',
    unit: 'strip',
    currentStock: 250,
    minimumStock: 40,
    purchasePrice: 12.5,
    sellingPrice: 24.0,
    mrp: 30.0,
    batchNumber: 'BCH-9821',
    expiryDate: '2027-08-31',
    rackLocation: 'A-12',
    variants: [],
  },
  {
    productId: 'prod_2',
    name: 'Amoxicillin 250mg DT',
    sku: 'AMOX-250',
    category: 'Antibiotics',
    brand: 'Sun Pharma',
    unit: 'strip',
    currentStock: 12, // Low stock
    minimumStock: 30,
    purchasePrice: 42.0,
    sellingPrice: 75.0,
    mrp: 88.0,
    batchNumber: 'AMX-4420',
    expiryDate: '2026-12-15',
    rackLocation: 'B-04',
    variants: [],
  },
  {
    productId: 'prod_3',
    name: 'Cough Syrup 100ml',
    sku: 'SYR-COUGH',
    category: 'Syrups',
    brand: 'Dabur India',
    unit: 'bottle',
    currentStock: 0, // Out of stock
    minimumStock: 20,
    purchasePrice: 35.0,
    sellingPrice: 65.0,
    mrp: 75.0,
    batchNumber: 'SYR-112',
    expiryDate: '2028-02-28',
    rackLocation: 'C-08',
    variants: [],
  },
  {
    productId: 'prod_4',
    name: 'Cetirizine 10mg Tablets',
    sku: 'CET-10',
    category: 'Antihistamines',
    brand: 'Dr. Reddy',
    unit: 'strip',
    currentStock: 520,
    minimumStock: 50,
    purchasePrice: 8.0,
    sellingPrice: 18.0,
    mrp: 22.0,
    batchNumber: 'CET-551',
    expiryDate: '2027-11-20',
    rackLocation: 'A-03',
    variants: [],
  },
  {
    productId: 'prod_5',
    name: 'Vitamin C 500mg Chewable',
    sku: 'VIT-C500',
    category: 'Supplements',
    brand: 'Abbott',
    unit: 'bottle',
    currentStock: 85,
    minimumStock: 25,
    purchasePrice: 90.0,
    sellingPrice: 160.0,
    mrp: 180.0,
    batchNumber: 'VTC-789',
    expiryDate: '2026-11-30', // Expiring soon
    rackLocation: 'D-01',
    variants: [],
  },
];

const MOCK_SUPPLIERS = [
  {
    supplierId: 'sup_1',
    name: 'Metro Pharma Wholesale Hub',
    contactPerson: 'Rajesh Mehta',
    phone: '+91 98200 11223',
    email: 'orders@metropharma.in',
    city: 'Mumbai',
    leadTimeDays: 2,
    active: true,
  },
  {
    supplierId: 'sup_2',
    name: 'National Healthcare Distributors',
    contactPerson: 'Anita Rao',
    phone: '+91 98111 44556',
    email: 'supply@nationalhealth.com',
    city: 'Pune',
    leadTimeDays: 4,
    active: true,
  },
];

const MOCK_CUSTOMERS = [
  {
    customerId: 'cust_1',
    name: 'City Heart Clinic & Daycare',
    phone: '+91 98234 56789',
    email: 'pharmacy@cityheart.org',
    city: 'Mumbai',
    creditLimit: 50000,
    currentBalance: 12400,
    outstandingOrdersCount: 2,
  },
  {
    customerId: 'cust_2',
    name: 'Apollo Chemist Franchise #4',
    phone: '+91 98765 12345',
    email: 'branch4@apollochem.in',
    city: 'Thane',
    creditLimit: 100000,
    currentBalance: 45000,
    outstandingOrdersCount: 3,
  },
];

const MOCK_PURCHASE_ORDERS = [
  {
    poId: 'po_101',
    orderNumber: 'PO-2026-001',
    supplierId: 'sup_1',
    supplierName: 'Metro Pharma Wholesale Hub',
    status: 'Pending',
    totalAmount: 48500,
    createdAt: new Date().toISOString(),
    expectedDate: '2026-11-05',
    items: [
      { productId: 'prod_1', name: 'Paracetamol 500mg', quantity: 1000, unitPrice: 12.5, received: 0 },
      { productId: 'prod_2', name: 'Amoxicillin 250mg DT', quantity: 500, unitPrice: 42.0, received: 0 },
    ],
  },
  {
    poId: 'po_102',
    orderNumber: 'PO-2026-002',
    supplierId: 'sup_2',
    supplierName: 'National Healthcare Distributors',
    status: 'Received',
    totalAmount: 14200,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    items: [
      { productId: 'prod_4', name: 'Cetirizine 10mg Tablets', quantity: 800, unitPrice: 8.0, received: 800 },
    ],
  },
];

const MOCK_SALES_ORDERS = [
  {
    orderId: 'so_501',
    orderNumber: 'SO-8921',
    customerId: 'cust_1',
    customerName: 'City Heart Clinic & Daycare',
    status: 'Pending',
    paymentStatus: 'Unpaid',
    totalAmount: 9450,
    createdAt: new Date().toISOString(),
    items: [
      { productId: 'prod_1', name: 'Paracetamol 500mg', quantity: 150, unitPrice: 24.0 },
      { productId: 'prod_4', name: 'Cetirizine 10mg Tablets', quantity: 200, unitPrice: 18.0 },
    ],
  },
  {
    orderId: 'so_502',
    orderNumber: 'SO-8922',
    customerId: 'cust_2',
    customerName: 'Apollo Chemist Franchise #4',
    status: 'Completed',
    paymentStatus: 'Paid',
    totalAmount: 32000,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    items: [
      { productId: 'prod_5', name: 'Vitamin C 500mg Chewable', quantity: 200, unitPrice: 160.0 },
    ],
  },
];

const MOCK_PAYMENTS = [
  {
    paymentId: 'pay_1',
    orderNumber: 'SO-8922',
    customerName: 'Apollo Chemist Franchise #4',
    amount: 32000,
    paymentMethod: 'UPI / Bank Transfer',
    status: 'Completed',
    createdAt: new Date().toISOString(),
  },
];

const MOCK_RETURNS = [
  {
    returnId: 'ret_1',
    returnNumber: 'RET-001',
    type: 'sales',
    customerName: 'City Heart Clinic',
    totalAmount: 1200,
    status: 'Approved',
    reason: 'Damaged packaging during transit',
    createdAt: new Date().toISOString(),
  },
];

const MOCK_USERS = [
  {
    userId: 'usr_demo123',
    name: 'Shivam Admin',
    email: 'shivam12@gmail.com',
    role: 'owner',
    status: 'active',
    createdAt: '2026-01-10',
  },
  {
    userId: 'usr_cashier1',
    name: 'Pooja Sharma',
    email: 'pooja@aflix.com',
    role: 'cashier',
    status: 'active',
    createdAt: '2026-03-01',
  },
];

const MOCK_ROLES = [
  { role: 'owner', name: 'Owner / Administrator', permissionsCount: 16 },
  { role: 'cashier', name: 'POS Cashier', permissionsCount: 3 },
  { role: 'inventory_manager', name: 'Warehouse Storekeeper', permissionsCount: 7 },
];

const MOCK_REPORTS_SUMMARY = {
  totalRevenue: 284500,
  totalOrders: 142,
  unitsInStock: 2850,
  warehouseCostValue: 184200,
  lowStockCount: 4,
  outOfStockCount: 1,
  pendingFulfillmentCount: 6,
  activeCustomers: 48,
  monthlyRevenueSeries: [
    { month: 'May', revenue: 42000 },
    { month: 'Jun', revenue: 58000 },
    { month: 'Jul', revenue: 64000 },
    { month: 'Aug', revenue: 59000 },
    { month: 'Sep', revenue: 72000 },
    { month: 'Oct', revenue: 89500 },
  ],
};

const MOCK_TRANSACTIONS = [
  {
    transactionId: 'tx_1',
    productId: 'prod_1',
    productName: 'Paracetamol 500mg',
    type: 'STOCK_IN',
    quantity: 500,
    balanceAfter: 250,
    reason: 'Purchase order receipt',
    createdAt: new Date().toISOString(),
  },
  {
    transactionId: 'tx_2',
    productId: 'prod_2',
    productName: 'Amoxicillin 250mg DT',
    type: 'DISPATCH',
    quantity: -50,
    balanceAfter: 12,
    reason: 'Sales order dispatch',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

// Helper to setup mock routes in Playwright
async function setupMocks(page) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    // Do NOT intercept frontend source code or assets
    if (
      pathname.startsWith('/src/') ||
      pathname.startsWith('/@') ||
      pathname.startsWith('/node_modules/') ||
      pathname.startsWith('/public/') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.jsx') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.ico')
    ) {
      return route.continue();
    }

    // Only intercept backend API requests
    const isApi = pathname.startsWith('/api') || url.port === '4000';
    if (!isApi) {
      return route.continue();
    }

    const respond = (data, status = 200) => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ success: status < 400, data }),
      });
    };

    if (pathname.endsWith('/auth/me')) {
      return respond({ user: MOCK_USER, business: MOCK_BUSINESS });
    }
    if (pathname.endsWith('/auth/login') || pathname.endsWith('/auth/register')) {
      return respond({ user: MOCK_USER, business: MOCK_BUSINESS });
    }
    if (pathname.includes('/businesses/me') || pathname.endsWith('/businesses')) {
      return respond(MOCK_BUSINESS);
    }
    if (pathname.includes('/products')) {
      return respond(MOCK_PRODUCTS);
    }
    if (pathname.includes('/categories')) {
      return respond(['Analgesics', 'Antibiotics', 'Syrups', 'Antihistamines', 'Supplements']);
    }
    if (pathname.includes('/suppliers')) {
      return respond(MOCK_SUPPLIERS);
    }
    if (pathname.includes('/customers')) {
      return respond(MOCK_CUSTOMERS);
    }
    if (pathname.includes('/purchase-orders')) {
      return respond(MOCK_PURCHASE_ORDERS);
    }
    if (pathname.includes('/receiving/pending-orders') || pathname.includes('/receiving')) {
      return respond(MOCK_PURCHASE_ORDERS);
    }
    if (pathname.includes('/sales-orders')) {
      return respond(MOCK_SALES_ORDERS);
    }
    if (pathname.includes('/payments')) {
      return respond(MOCK_PAYMENTS);
    }
    if (pathname.includes('/returns')) {
      return respond(MOCK_RETURNS);
    }
    if (pathname.includes('/inventory/transactions')) {
      return respond(MOCK_TRANSACTIONS);
    }
    if (pathname.includes('/inventory/operations')) {
      return respond({ success: true, count: 1 });
    }
    if (pathname.includes('/reports/summary') || pathname.includes('/reports')) {
      return respond(MOCK_REPORTS_SUMMARY);
    }
    if (pathname.includes('/users/roles')) {
      return respond(MOCK_ROLES);
    }
    if (pathname.includes('/users')) {
      return respond(MOCK_USERS);
    }
    if (pathname.includes('/notifications')) {
      return respond({ items: [], unreadCount: 0 });
    }
    if (pathname.includes('/clothing') || pathname.includes('/colors') || pathname.includes('/variants')) {
      return respond([
        { id: '1', name: 'Navy Blue', hex: '#001f3f' },
        { id: '2', name: 'Emerald', hex: '#2ecc40' },
      ]);
    }

    // Default fallback
    respond([]);
  });
}

async function main() {
  console.log(`=== UI Check Verification Harness ===`);
  console.log(`Mode: ${mode} | Port: ${port}`);

  // Create artifacts directories
  const outDir = path.join(rootDir, 'artifacts', 'ui', mode);
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Start Vite in-process
  console.log(`Starting Vite server on port ${port}...`);
  const viteServer = await createServer({
    root: rootDir,
    server: { port, host: 'localhost' },
    logLevel: 'error',
  });
  await viteServer.listen();
  const baseUrl = `http://localhost:${port}`;
  console.log(`Vite server listening at ${baseUrl}`);

  // 2. Discover routes from ROUTE_TABLE
  const routesFile = fs.readFileSync(path.join(rootDir, 'src', 'app', 'routes.jsx'), 'utf-8');
  const routeEntries = [];
  const routeRegex = /^\s*['"]?([A-Za-z0-9\s/_\-&]+)['"]?:\s*\{\s*path:\s*['"]([^'"]+)['"]/gm;
  let match;
  while ((match = routeRegex.exec(routesFile)) !== null) {
    const label = match[1].trim();
    const routePath = match[2].trim();
    // avoid duplicates if multiple labels share path
    if (!routeEntries.some((r) => r.path === routePath)) {
      routeEntries.push({ label, path: routePath });
    }
  }

  // Filter routes if specified
  const routeFilters = targetRouteFilter === 'all' ? null : targetRouteFilter.split(',').map((s) => s.trim().toLowerCase());
  const routesToTest = !routeFilters
    ? routeEntries
    : routeEntries.filter((r) =>
        routeFilters.some((f) => r.label.toLowerCase().includes(f) || r.path.toLowerCase().includes(f))
      );

  const vpFilters = targetViewportFilter === 'all' ? null : targetViewportFilter.split(',').map((s) => s.trim());
  const viewportsToTest = fastMode
    ? [VIEWPORTS[0], VIEWPORTS[4]] // 360x740 and 1280x800
    : !vpFilters
    ? VIEWPORTS
    : VIEWPORTS.filter((v) => vpFilters.includes(v.name));

  const themeFilters = targetThemeFilter === 'all' ? null : targetThemeFilter.split(',').map((s) => s.trim().toLowerCase());
  const themesToTest = !themeFilters ? THEMES : THEMES.filter((t) => themeFilters.includes(t));

  console.log(`Testing ${routesToTest.length} routes x ${viewportsToTest.length} viewports x ${themesToTest.length} themes...`);

  // 3. Launch Playwright
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const results = [];

  for (const route of routesToTest) {
    const routeSlug = route.path === '/' ? 'overview' : route.path.replace(/^\//, '').replace(/\//g, '-');
    console.log(`\nTesting route [${route.label}] (${route.path}):`);

    for (const vp of viewportsToTest) {
      for (const theme of themesToTest) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
        });
        const page = await context.newPage();
        const consoleErrors = [];
        page.on('console', (msg) => {
          console.log(`[Browser Console ${msg.type()}]:`, msg.text());
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        page.on('pageerror', (err) => {
          console.log(`[Browser PageError]:`, err.message);
          consoleErrors.push(err.message);
        });

        await setupMocks(page);

        // Pre-set theme in localStorage
        await page.addInitScript((th) => {
          try {
            window.localStorage.setItem('stockroom-theme', th);
          } catch {}
          document.addEventListener('DOMContentLoaded', () => {
            if (document.documentElement) {
              document.documentElement.setAttribute('data-theme', th);
            }
          });
        }, theme);

        const targetUrl = `${baseUrl}${route.path}`;
        let status = 'PASS';
        const issues = [];

        try {
          await page.goto(targetUrl, { waitUntil: 'load', timeout: 15000 });
          // Ensure theme attribute on html
          await page.evaluate((th) => {
            document.documentElement.setAttribute('data-theme', th);
          }, theme);

          await page.waitForTimeout(400); // small stabilization pause

          // Evaluate layout & DOM assertions
          const metrics = await page.evaluate((isPhone) => {
            const docWidth = document.documentElement.scrollWidth;
            const winWidth = window.innerWidth;
            const hasHorizontalOverflow = docWidth > winWidth + 1;

            // Find offending overflowing elements
            const overflowingSelectors = [];
            if (hasHorizontalOverflow) {
              const all = document.querySelectorAll('*');
              for (const el of all) {
                const rect = el.getBoundingClientRect();
                if (rect.right > winWidth + 2) {
                  const tag = el.tagName.toLowerCase();
                  const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
                  const id = el.id ? `#${el.id}` : '';
                  overflowingSelectors.push(`${tag}${id}${cls} (w:${Math.round(rect.width)}, r:${Math.round(rect.right)})`);
                  if (overflowingSelectors.length >= 3) break;
                }
              }
            }

            // Mobile tap targets (<44px) check
            const smallTapTargets = [];
            if (isPhone) {
              const targets = document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]');
              for (const el of targets) {
                const rect = el.getBoundingClientRect();
                // only test visible elements with area > 0
                if (rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0) {
                  if (rect.width < 32 || rect.height < 32) { // 32px hard threshold for flags
                    const text = (el.innerText || el.getAttribute('aria-label') || el.className || '').slice(0, 20);
                    smallTapTargets.push(`${el.tagName.toLowerCase()} "${text}" (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
                    if (smallTapTargets.length >= 3) break;
                  }
                }
              }
            }

            // Images without dimensions
            const unconstrainedImages = [];
            const imgs = document.querySelectorAll('img');
            for (const img of imgs) {
              if (!img.getAttribute('width') && !img.getAttribute('height') && !img.style.width && !img.style.height) {
                unconstrainedImages.push(img.src.slice(-25));
                if (unconstrainedImages.length >= 2) break;
              }
            }

            return {
              scrollWidth: docWidth,
              innerWidth: winWidth,
              hasHorizontalOverflow,
              overflowingSelectors,
              smallTapTargets,
              unconstrainedImages,
            };
          }, vp.width <= 390);

          if (metrics.hasHorizontalOverflow) {
            status = 'FAIL';
            issues.push(`Horizontal overflow (scrollWidth: ${metrics.scrollWidth} > innerWidth: ${metrics.innerWidth}). Culprits: ${metrics.overflowingSelectors.join(', ')}`);
          }

          if (consoleErrors.length > 0) {
            // Note console errors
            issues.push(`Console errors: ${consoleErrors.slice(0, 2).join('; ')}`);
          }

          // Take full-page screenshot
          const screenshotFileName = `${routeSlug}-${vp.name}-${theme}.png`;
          const screenshotPath = path.join(outDir, screenshotFileName);
          await page.screenshot({ path: screenshotPath, fullPage: true });

          results.push({
            route: route.label,
            path: route.path,
            viewport: vp.name,
            theme,
            status,
            issues,
            screenshot: screenshotFileName,
          });

          process.stdout.write(status === 'PASS' ? '.' : 'F');
        } catch (err) {
          status = 'ERROR';
          issues.push(err.message);
          results.push({
            route: route.label,
            path: route.path,
            viewport: vp.name,
            theme,
            status,
            issues,
            screenshot: 'none',
          });
          process.stdout.write('E');
        } finally {
          await context.close();
        }
      }
    }
  }

  console.log(`\n\nWriting summary report to artifacts/ui/report.md...`);
  await browser.close();
  await viteServer.close();

  // Generate Markdown report
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  const errorCount = results.filter((r) => r.status === 'ERROR').length;

  let reportMd = `# UI Verification Report (${mode.toUpperCase()})\n\n`;
  reportMd += `**Run Timestamp:** ${new Date().toISOString()}\n`;
  reportMd += `**Total Runs:** ${results.length} | **Pass:** ${passCount} | **Fail (Overflow/Issues):** ${failCount} | **Errors:** ${errorCount}\n\n`;

  reportMd += `## Summary Table\n\n`;
  reportMd += `| Route | Path | Viewport | Theme | Status | Details |\n`;
  reportMd += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const r of results) {
    const detailStr = r.issues.length ? r.issues.join('<br>') : 'Clean';
    reportMd += `| ${r.route} | \`${r.path}\` | ${r.viewport} | ${r.theme} | **${r.status}** | ${detailStr} |\n`;
  }

  const reportPath = path.join(rootDir, 'artifacts', 'ui', `${mode}-report.md`);
  fs.writeFileSync(reportPath, reportMd, 'utf-8');
  // Also write to default report.md
  fs.writeFileSync(path.join(rootDir, 'artifacts', 'ui', 'report.md'), reportMd, 'utf-8');

  console.log(`Verification finished! Report written to ${reportPath}`);
}

main().catch((err) => {
  console.error('Fatal harness error:', err);
  process.exit(1);
});
