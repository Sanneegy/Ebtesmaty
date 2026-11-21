const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = path.join('C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1');

const pages = [
  { route: '/reception',             role: 'RECEPTIONIST', file: 'cap_reception.png' },
  { route: '/management',            role: 'OWNER',        file: 'cap_management.png' },
  { route: '/billing',               role: 'ACCOUNTANT',   file: 'cap_billing.png' },
  { route: '/inventory',             role: 'INVENTORY',    file: 'cap_inventory.png' },
  { route: '/purchasing',            role: 'INVENTORY',    file: 'cap_purchasing.png' },
  { route: '/crm',                   role: 'CRM',          file: 'cap_crm.png' },
  { route: '/dentist',               role: 'DENTIST',      file: 'cap_dentist.png' },
  { route: '/portal',                role: 'PATIENT',      file: 'cap_portal.png' },
  { route: '/admin',                 role: 'SUPER_ADMIN',  file: 'cap_admin.png' },
  { route: '/operations/equipment',  role: 'OWNER',        file: 'cap_equipment.png' },
];

async function loginAs(page, role) {
  await page.goto(BASE_URL + '/api/auth/demo-switch?role=' + role, { waitUntil: 'networkidle', timeout: 15000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  let results = [];

  for (const p of pages) {
    try {
      console.log(`Capturing ${p.route} as ${p.role}...`);
      await loginAs(page, p.role);
      await page.goto(BASE_URL + p.route, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1500);
      const outPath = path.join(OUT_DIR, p.file);
      await page.screenshot({ path: outPath, fullPage: false });
      results.push({ route: p.route, file: p.file, status: 'OK' });
      console.log(`  ✓ Saved: ${p.file}`);
    } catch (e) {
      console.log(`  ✗ Error on ${p.route}: ${e.message}`);
      results.push({ route: p.route, file: p.file, status: 'ERROR', error: e.message });
    }
  }

  await browser.close();
  console.log('\nCapture summary:');
  results.forEach(r => console.log(`  ${r.status === 'OK' ? '✓' : '✗'} ${r.route} → ${r.file}${r.error ? ' : ' + r.error : ''}`));
})();
