import { chromium } from 'playwright';

async function run() {
  const b = await chromium.launch({ channel: 'msedge', headless: true });
  const p = await b.newPage();
  p.on('console', msg => console.log('PAGE LOG:', msg.text()));
  p.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await p.goto('http://localhost:5173/login', { waitUntil: 'load' });

  // Check role tabs
  const shopOwnerBtn = p.locator('button:has-text("Shop Owner")');
  console.log('Shop owner button count:', await shopOwnerBtn.count());
  await shopOwnerBtn.click();

  await p.locator('#auth-identifier').fill('owner@clothing.stockroom.test');
  await p.locator('#auth-password').fill('Demo@12345');

  console.log('Submitting login form...');
  await p.locator('button.auth-submit-btn').click();

  await p.waitForTimeout(4000);
  console.log('Final URL:', p.url());
  const errorEl = await p.locator('.form-status, .auth-error, [role="alert"]').textContent().catch(() => null);
  console.log('Form status / error:', errorEl);

  const bodyText = await p.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('Body Text snippet:', bodyText.replace(/\n+/g, ' '));

  await b.close();
}

run().catch(console.error);
