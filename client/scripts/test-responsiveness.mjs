import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve('client', 'test-results', 'screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: 'Desktop_1920x1080', width: 1920, height: 1080, type: 'desktop' },
  { name: 'Laptop_1366x768', width: 1366, height: 768, type: 'desktop' },
  { name: 'Tablet_Landscape_1024x768', width: 1024, height: 768, type: 'tablet' },
  { name: 'Tablet_Portrait_768x1024', width: 768, height: 1024, type: 'tablet' },
  { name: 'Mobile_Large_412x915', width: 412, height: 915, type: 'mobile' },
  { name: 'Mobile_Standard_375x812', width: 375, height: 812, type: 'mobile' }
];

const BASE_URL = 'http://localhost:5173';

async function checkPageResponsiveness(page, pageName, vp) {
  await page.waitForTimeout(1000);

  const overflow = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const bodyWidth = document.body.scrollWidth;
    const winWidth = window.innerWidth;
    const maxScroll = Math.max(docWidth, bodyWidth);
    const hasOverflow = maxScroll > winWidth + 2;

    let culprits = [];
    if (hasOverflow) {
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const rect = el.getBoundingClientRect();
        if (rect.right > winWidth + 5) {
          culprits.push({
            tag: el.tagName.toLowerCase(),
            class: (el.className || '').toString().slice(0, 60),
            id: el.id || '',
            overflowPx: Math.round(rect.right - winWidth)
          });
        }
      }
    }

    const hamburgerBtn = document.querySelector('button[aria-label*="menu" i], button[aria-label*="sidebar" i], .lucide-menu, button:has(.lucide-menu)');
    const sidebar = document.querySelector('aside, .sidebar, nav[aria-label*="sidebar" i]');
    const sidebarVisible = sidebar ? window.getComputedStyle(sidebar).display !== 'none' : false;

    return {
      hasOverflow,
      maxScroll,
      winWidth,
      diff: maxScroll - winWidth,
      culprits: culprits.slice(0, 4),
      hasHamburger: !!hamburgerBtn,
      sidebarVisible
    };
  });

  const screenshotName = `${pageName}_${vp.name}.png`;
  const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  return {
    page: pageName,
    viewport: vp.name,
    type: vp.type,
    width: vp.width,
    height: vp.height,
    hasOverflow: overflow.hasOverflow,
    overflowPx: overflow.diff > 0 ? overflow.diff : 0,
    culprits: overflow.culprits,
    hasHamburger: overflow.hasHamburger,
    sidebarVisible: overflow.sidebarVisible,
    screenshot: screenshotName
  };
}

async function run() {
  console.log('🚀 Starting UI Responsiveness Audit with Edge/Chromium...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const results = [];

  try {
    // 1. Audit Unauthenticated Pages
    console.log('\n--- Auditing Public Pages (Landing & Login) ---');
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      // Test Landing
      await page.goto(`${BASE_URL}/landing`, { waitUntil: 'load' });
      const landingRes = await checkPageResponsiveness(page, 'LandingPage', vp);
      results.push(landingRes);

      // Test Login
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
      const loginRes = await checkPageResponsiveness(page, 'LoginPage', vp);
      results.push(loginRes);

      await context.close();
    }

    // 2. Perform Login
    console.log('\n--- Performing Demo Login ---');
    const authContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const authPage = await authContext.newPage();
    await authPage.goto(`${BASE_URL}/login`, { waitUntil: 'load' });

    // Pick Shop owner role if toggle present
    const shopOwnerBtn = authPage.locator('button:has-text("Shop owner"), label:has-text("Shop owner"), [role="radio"]:has-text("Shop owner"), .auth-role-btn:has-text("Shop owner")').first();
    if (await shopOwnerBtn.count() > 0) {
      await shopOwnerBtn.click();
      await authPage.waitForTimeout(300);
    }

    await authPage.locator('#auth-identifier').fill('owner@pharmacy.stockroom.test');
    await authPage.locator('#auth-password').fill('Demo@12345');
    await authPage.locator('.auth-submit-btn, button[type="submit"]').first().click();

    // Wait for redirect to dashboard
    await authPage.waitForTimeout(3500);
    console.log('Post-login URL:', authPage.url());

    // Extract storage state
    const storageState = await authContext.storageState();
    await authContext.close();

    // 3. Test Authenticated Dashboard Pages
    const APP_ROUTES = [
      { name: 'DashboardOverview', path: '/' },
      { name: 'ProductsCatalog', path: '/products' },
      { name: 'StockLedger', path: '/stock' },
      { name: 'PosTerminal', path: '/pos' },
      { name: 'Suppliers', path: '/suppliers' },
      { name: 'Customers', path: '/customers' },
      { name: 'Reports', path: '/reports' },
      { name: 'Settings', path: '/settings' }
    ];

    console.log('\n--- Auditing Authenticated Dashboard Pages ---');
    for (const vp of VIEWPORTS) {
      console.log(`Testing viewport: ${vp.name} (${vp.width}x${vp.height})`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        storageState
      });
      const page = await context.newPage();

      for (const route of APP_ROUTES) {
        try {
          await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'load', timeout: 15000 });
          const res = await checkPageResponsiveness(page, route.name, vp);
          results.push(res);
        } catch (err) {
          console.error(`Error auditing ${route.name} on ${vp.name}:`, err.message);
          results.push({
            page: route.name,
            viewport: vp.name,
            type: vp.type,
            error: err.message
          });
        }
      }
      await context.close();
    }

    // Write JSON report
    const reportPath = path.resolve('client', 'test-results', 'responsiveness-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ Audit complete! Report written to ${reportPath}`);

    // Print summary table to console
    console.log('\n=== AUDIT SUMMARY ===');
    const overflows = results.filter(r => r.hasOverflow);
    console.log(`Total tests run: ${results.length}`);
    console.log(`Overflow issues detected: ${overflows.length}`);
    if (overflows.length > 0) {
      console.log('\nPages with horizontal overflow:');
      for (const o of overflows) {
        console.log(`- [${o.viewport}] ${o.page}: +${o.overflowPx}px overflow`);
        if (o.culprits && o.culprits.length > 0) {
          for (const c of o.culprits) {
            console.log(`    ↳ <${c.tag}> class="${c.class}" (+${c.overflowPx}px)`);
          }
        }
      }
    } else {
      console.log('🎉 No horizontal overflows detected across any tested viewport!');
    }

  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Fatal error during responsiveness audit:', err);
  process.exit(1);
});
