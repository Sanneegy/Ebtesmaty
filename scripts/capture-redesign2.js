const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = 'C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';

const accounts = {
  OWNER:        { email: 'manager.b1@ebtesamty.dev', password: 'Password123!' },
  RECEPTIONIST: { email: 'mariam.reception@ebtesamty.dev', password: 'Password123!' },
  ACCOUNTANT:   { email: 'finance@ebtesamty.dev', password: 'Password123!' },
  DENTIST:      { email: 'dr.sandy@ebtesamty.dev', password: 'Password123!' },
  SYSADMIN:     { email: 'sysadmin@ebtesamty.dev', password: 'Password123!' },
};

const pages = [
  { route: '/reception',            role: 'RECEPTIONIST', file: 'cap_reception.png' },
  { route: '/management',           role: 'OWNER',        file: 'cap_management.png' },
  { route: '/billing',              role: 'ACCOUNTANT',   file: 'cap_billing.png' },
  { route: '/inventory',            role: 'OWNER',        file: 'cap_inventory.png' },
  { route: '/purchasing',           role: 'OWNER',        file: 'cap_purchasing.png' },
  { route: '/crm',                  role: 'OWNER',        file: 'cap_crm.png' },
  { route: '/dentist',              role: 'DENTIST',      file: 'cap_dentist.png' },
  { route: '/admin',                role: 'SYSADMIN',     file: 'cap_admin.png' },
  { route: '/operations/equipment', role: 'OWNER',        file: 'cap_equipment.png' },
];

async function loginAndCapture(browser, role, pageList) {
  const cred = accounts[role];
  if (!cred) { console.log(`No credentials for role ${role}`); return; }
  
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // Login
  await page.goto(BASE_URL + '/auth/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(800);
  
  const emailInput = page.locator('input').first();
  const passInput = page.locator('input[type="password"]');
  await emailInput.fill(cred.email);
  await passInput.fill(cred.password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(u => !u.includes('/auth/login'), { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);
  
  console.log(`  Logged in as ${role}: ${page.url()}`);

  for (const p of pageList) {
    try {
      console.log(`  Capturing ${p.route}...`);
      await page.goto(BASE_URL + p.route, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUT_DIR, p.file), fullPage: false });
      console.log(`  ✓ ${p.file}`);
    } catch (e) {
      console.log(`  ✗ ${p.route}: ${e.message.slice(0, 100)}`);
    }
  }
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  const grouped = {};
  for (const p of pages) {
    if (!grouped[p.role]) grouped[p.role] = [];
    grouped[p.role].push(p);
  }

  for (const [role, pageList] of Object.entries(grouped)) {
    console.log(`\nLogging in as ${role}...`);
    await loginAndCapture(browser, role, pageList);
  }

  await browser.close();
  console.log('\nAll done.');
})();
