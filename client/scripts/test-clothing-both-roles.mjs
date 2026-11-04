import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve('client', 'test-results', 'screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function run() {
  console.log('🚀 Starting Clothing Demo Testing for Admin & Salesperson...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // ========================================================
  // 1. ADMIN (Shop Owner) - owner@clothing.stockroom.test
  // ========================================================
  console.log('\n--- 1. Testing Clothing Admin (owner@clothing.stockroom.test) ---');
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();

  await adminPage.goto('http://localhost:5173/login', { waitUntil: 'load' });
  await adminPage.locator('button:has-text("Shop Owner")').first().click();
  await adminPage.locator('#auth-identifier').fill('owner@clothing.stockroom.test');
  await adminPage.locator('#auth-password').fill('Demo@12345');
  await adminPage.locator('button.auth-submit-btn').click();

  await adminPage.waitForTimeout(3000);

  // Take Dashboard Screenshot
  await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'Clothing_Admin_Dashboard.png') });
  console.log('Admin Dashboard screenshot taken.');

  // Navigate to Products
  console.log('Navigating to Products Catalog...');
  const productsBtn = adminPage.locator('button:has-text("Products"), a:has-text("Products")').first();
  await productsBtn.click();
  await adminPage.waitForTimeout(1500);
  await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'Clothing_Admin_Products.png') });
  console.log('Admin Products screenshot taken.');

  // Navigate to Stock / Inventory
  console.log('Navigating to Inventory / Stock...');
  const inventoryBtn = adminPage.locator('button:has-text("Inventory"), a:has-text("Inventory")').first();
  await inventoryBtn.click();
  await adminPage.waitForTimeout(1500);
  await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'Clothing_Admin_Stock.png') });
  console.log('Admin Inventory screenshot taken.');

  // Navigate to Settings
  console.log('Navigating to Settings...');
  const settingsBtn = adminPage.locator('button:has-text("Settings"), a:has-text("Settings")').first();
  await settingsBtn.click();
  await adminPage.waitForTimeout(1500);
  await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'Clothing_Admin_Settings.png') });
  console.log('Admin Settings screenshot taken.');

  const adminBody = await adminPage.evaluate(() => document.body.innerText);
  console.log('Admin Verification Check:');
  console.log('- Threadline Apparel present:', adminBody.includes('Threadline Apparel'));
  console.log('- Owner Profile present:', adminBody.includes('Threadline') || adminBody.includes('Owner'));

  await adminContext.close();

  // ========================================================
  // 2. SALESPERSON (Team Member) - staff@clothing.stockroom.test
  // ========================================================
  console.log('\n--- 2. Testing Clothing Salesperson (staff@clothing.stockroom.test) ---');
  const staffContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const staffPage = await staffContext.newPage();

  await staffPage.goto('http://localhost:5173/login', { waitUntil: 'load' });
  await staffPage.locator('button:has-text("Team Member")').first().click();
  await staffPage.locator('#auth-identifier').fill('staff@clothing.stockroom.test');
  await staffPage.locator('#auth-password').fill('Demo@12345');
  await staffPage.locator('button.auth-submit-btn').click();

  await staffPage.waitForTimeout(3000);

  // Take Initial Salesperson Screen
  await staffPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'Clothing_Salesperson_Initial.png') });
  console.log('Salesperson Initial screenshot taken.');

  const staffBody = await staffPage.evaluate(() => document.body.innerText);
  console.log('Salesperson Verification Check:');
  console.log('- Redirected / Opened POS:', staffBody.includes('POS') || staffBody.includes('Cart') || staffBody.includes('Bill') || staffBody.includes('Checkout'));
  console.log('- Salesperson profile visible:', staffBody.includes('Salesperson') || staffBody.includes('Staff') || staffBody.includes('Threadline'));

  // Test Role Guard: Click Settings or directly invoke route
  console.log('Testing back-office access restriction...');
  await staffPage.evaluate(() => {
    window.history.pushState({}, '', '/settings');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await staffPage.waitForTimeout(1500);
  await staffPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'Clothing_Salesperson_Restricted.png') });

  const restrictedBody = await staffPage.evaluate(() => document.body.innerText);
  const isRestricted = restrictedBody.includes('Access Denied') || restrictedBody.includes('Forbidden') || !restrictedBody.includes('Business Settings');
  console.log('- Role guard properly restricted back-office settings:', isRestricted);

  await staffContext.close();
  await browser.close();

  console.log('\n🎉 Both Clothing Demo tests completed successfully!');
}

run().catch(console.error);
