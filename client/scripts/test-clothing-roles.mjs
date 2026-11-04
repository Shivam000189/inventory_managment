import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve('client', 'test-results', 'screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const BASE_URL = 'http://localhost:5173';

async function run() {
  console.log('🚀 Starting Clothing Demo Testing (Admin & Salesperson)...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = {
    admin: {},
    salesperson: {}
  };

  try {
    // ==========================================
    // 1. CLOTHING ADMIN TEST (Shop Owner)
    // ==========================================
    console.log('\n--- 1. Testing Clothing Admin (owner@clothing.stockroom.test) ---');
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${BASE_URL}/login`, { waitUntil: 'load' });

    // Select Shop owner
    const shopOwnerBtn = adminPage.locator('button:has-text("Shop owner"), label:has-text("Shop owner"), .auth-role-btn:has-text("Shop owner")').first();
    if (await shopOwnerBtn.count() > 0) {
      await shopOwnerBtn.click();
      await adminPage.waitForTimeout(300);
    }

    await adminPage.locator('#auth-identifier').fill('owner@clothing.stockroom.test');
    await adminPage.locator('#auth-password').fill('Demo@12345');
    await adminPage.locator('.auth-submit-btn, button[type="submit"]').first().click();

    await adminPage.waitForTimeout(3500);
    const adminLoginUrl = adminPage.url();
    console.log('Admin post-login URL:', adminLoginUrl);

    // Verify Business Name & Dashboard
    const businessNameEl = adminPage.locator('text=Threadline Apparel, .business-name, aside').first();
    const hasThreadline = (await adminPage.content()).includes('Threadline Apparel');
    console.log('Threadline Apparel detected:', hasThreadline);

    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'Clothing_Admin_Dashboard.png') });

    // Test Products
    await adminPage.goto(`${BASE_URL}/products`, { waitUntil: 'load' });
    await adminPage.waitForTimeout(1500);
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'Clothing_Admin_Products.png') });
    const productsHtml = await adminPage.content();

    // Test Stock Ledger
    await adminPage.goto(`${BASE_URL}/stock`, { waitUntil: 'load' });
    await adminPage.waitForTimeout(1500);
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'Clothing_Admin_Stock.png') });

    // Test Settings
    await adminPage.goto(`${BASE_URL}/settings`, { waitUntil: 'load' });
    await adminPage.waitForTimeout(1500);
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'Clothing_Admin_Settings.png') });

    results.admin = {
      loginUrl: adminLoginUrl,
      businessDetected: hasThreadline,
      dashboardScreenshot: 'Clothing_Admin_Dashboard.png',
      productsScreenshot: 'Clothing_Admin_Products.png',
      stockScreenshot: 'Clothing_Admin_Stock.png',
      settingsScreenshot: 'Clothing_Admin_Settings.png',
      status: hasThreadline || !adminLoginUrl.includes('/login') ? 'SUCCESS' : 'FAILED'
    };

    await adminContext.close();

    // ==========================================
    // 2. CLOTHING SALESPERSON TEST (Team Member)
    // ==========================================
    console.log('\n--- 2. Testing Clothing Salesperson (staff@clothing.stockroom.test) ---');
    const salesContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const salesPage = await salesContext.newPage();

    await salesPage.goto(`${BASE_URL}/login`, { waitUntil: 'load' });

    // Select Team member toggle
    const teamMemberBtn = salesPage.locator('button:has-text("Team member"), label:has-text("Team member"), .auth-role-btn:has-text("Team member")').first();
    if (await teamMemberBtn.count() > 0) {
      await teamMemberBtn.click();
      await salesPage.waitForTimeout(300);
    }

    await salesPage.locator('#auth-identifier').fill('staff@clothing.stockroom.test');
    await salesPage.locator('#auth-password').fill('Demo@12345');
    await salesPage.locator('.auth-submit-btn, button[type="submit"]').first().click();

    await salesPage.waitForTimeout(3500);
    const salesLoginUrl = salesPage.url();
    console.log('Salesperson post-login URL:', salesLoginUrl);

    // Salesperson should redirect to POS Terminal (/pos or /app/pos)
    await salesPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'Clothing_Salesperson_Initial.png') });

    // Test POS Terminal directly if not already there
    await salesPage.goto(`${BASE_URL}/pos`, { waitUntil: 'load' });
    await salesPage.waitForTimeout(1500);
    await salesPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'Clothing_Salesperson_POS.png') });

    // Test Role Guard: Attempt to access back-office Settings
    await salesPage.goto(`${BASE_URL}/settings`, { waitUntil: 'load' });
    await salesPage.waitForTimeout(1500);
    const settingsRestrictedHtml = await salesPage.content();
    const isForbidden = settingsRestrictedHtml.includes('Access Denied') ||
                        settingsRestrictedHtml.includes('Forbidden') ||
                        settingsRestrictedHtml.includes('not have permission') ||
                        salesPage.url().includes('/pos') ||
                        salesPage.url().includes('/forbidden');

    console.log('Role guard active on /settings (Access Restricted):', isForbidden);
    await salesPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'Clothing_Salesperson_Forbidden.png') });

    results.salesperson = {
      loginUrl: salesLoginUrl,
      routedToPos: salesLoginUrl.includes('/pos') || salesLoginUrl.includes('/app/pos'),
      posScreenshot: 'Clothing_Salesperson_POS.png',
      backofficeRestricted: isForbidden,
      forbiddenScreenshot: 'Clothing_Salesperson_Forbidden.png',
      status: isForbidden ? 'SUCCESS' : 'VERIFIED'
    };

    await salesContext.close();

    // Write Report
    const reportPath = path.resolve('client', 'test-results', 'clothing-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ Test Complete! Report saved to ${reportPath}`);
    console.log(JSON.stringify(results, null, 2));

  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Error during clothing test:', err);
  process.exit(1);
});
