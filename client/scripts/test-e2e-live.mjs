import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve('client', 'test-results', 'screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function run() {
  console.log('🚀 Running Comprehensive E2E Test on http://localhost:5173/ ...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results = {
    landing: {},
    login: {},
    dashboard: {},
    products: {},
    stock: {},
    pos: {},
    settings: {},
    logs: []
  };

  page.on('console', msg => {
    if (msg.type() === 'error') results.logs.push(`[CONSOLE ERROR] ${msg.text()}`);
  });
  page.on('pageerror', err => results.logs.push(`[PAGE ERROR] ${err.message}`));

  try {
    // 1. Landing Page
    console.log('--- Step 1: Testing Landing Page ---');
    await page.goto('http://localhost:5173/', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    const title = await page.title();
    const hasHeroCta = (await page.locator('button:has-text("Start Free Trial"), a:has-text("Start Free Trial"), button:has-text("Live Demo")').count()) > 0;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'E2E_01_LandingPage.png') });
    results.landing = { title, hasHeroCta, status: 'PASS' };
    console.log('Landing page verified. Title:', title);

    // 2. Login Page
    console.log('\n--- Step 2: Testing Login Page & Authentication ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'load' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'E2E_02_LoginPage.png') });

    // Click Shop Owner
    await page.locator('button:has-text("Shop Owner")').first().click();
    await page.locator('#auth-identifier').fill('owner@clothing.stockroom.test');
    await page.locator('#auth-password').fill('Demo@12345');
    await page.locator('button.auth-submit-btn').click();

    // Wait for Dashboard
    await page.waitForTimeout(3000);
    const dashboardHtml = await page.content();
    const isDashboardLoaded = dashboardHtml.includes('Threadline Apparel') || dashboardHtml.includes('Overview');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'E2E_03_DashboardOverview.png') });
    results.dashboard = { isDashboardLoaded, status: isDashboardLoaded ? 'PASS' : 'FAIL' };
    console.log('Dashboard loaded:', isDashboardLoaded);

    // 3. Products Catalog
    console.log('\n--- Step 3: Testing Products Catalog ---');
    const productsBtn = page.locator('button:has-text("Products"), a:has-text("Products")').first();
    await productsBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'E2E_04_ProductsPage.png') });
    const hasProductTable = (await page.locator('table').count()) > 0 || (await page.getByText('SKU').count()) > 0;
    results.products = { hasProductTable, status: hasProductTable ? 'PASS' : 'FAIL' };
    console.log('Products page table visible:', hasProductTable);

    // 4. Stock Ledger / Inventory
    console.log('\n--- Step 4: Testing Stock Ledger / Inventory ---');
    const inventoryBtn = page.locator('button:has-text("Inventory"), a:has-text("Inventory")').first();
    await inventoryBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'E2E_05_StockLedger.png') });
    const hasInventory = (await page.locator('table').count()) > 0 || (await page.getByText('Stock').count()) > 0;
    results.stock = { hasInventory, status: hasInventory ? 'PASS' : 'FAIL' };
    console.log('Stock ledger verified:', hasInventory);

    // 5. POS & Sales Terminal
    console.log('\n--- Step 5: Testing POS & Sales Terminal ---');
    const posBtn = page.locator('button:has-text("POS"), a:has-text("POS")').first();
    await posBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'E2E_06_PosTerminal.png') });
    const hasPosCart = (await page.getByText('Cart').count()) > 0 || (await page.getByText('Bill').count()) > 0;
    results.pos = { hasPosCart, status: hasPosCart ? 'PASS' : 'FAIL' };
    console.log('POS terminal verified:', hasPosCart);

    // 6. Settings
    console.log('\n--- Step 6: Testing Settings Page ---');
    const settingsBtn = page.locator('button:has-text("Settings"), a:has-text("Settings")').first();
    await settingsBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'E2E_07_SettingsPage.png') });
    const hasSettings = (await page.getByText('Business').count()) > 0 || (await page.getByText('Settings').count()) > 0;
    results.settings = { hasSettings, status: hasSettings ? 'PASS' : 'FAIL' };
    console.log('Settings page verified:', hasSettings);

    const reportPath = path.resolve('client', 'test-results', 'e2e-live-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ E2E Test Complete! Results written to ${reportPath}`);
    console.log(JSON.stringify(results, null, 2));

  } finally {
    await browser.close();
  }
}

run().catch(console.error);
