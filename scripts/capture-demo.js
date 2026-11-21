const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = 'C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';

// Demo role button names on the login page
const demoRoles = {
  RECEPTIONIST: 'Reception (Mariam)',
  OWNER:        'Manager (Amr)',
  DENTIST:      'Dentist (Dr. Sandy)',
  PATIENT:      'Patient (Hassan)',
};

const pages = [
  { route: '/reception',            role: 'RECEPTIONIST', file: 'cap_reception.png' },
  { route: '/management',           role: 'OWNER',        file: 'cap_management.png' },
  { route: '/billing',              role: 'OWNER',        file: 'cap_billing.png' },
  { route: '/inventory',            role: 'OWNER',        file: 'cap_inventory.png' },
  { route: '/purchasing',           role: 'OWNER',        file: 'cap_purchasing.png' },
  { route: '/crm',                  role: 'OWNER',        file: 'cap_crm.png' },
  { route: '/dentist',              role: 'DENTIST',      file: 'cap_dentist.png' },
  { route: '/portal',               role: 'PATIENT',      file: 'cap_portal.png' },
  { route: '/admin',                role: 'OWNER',        file: 'cap_admin.png' },
  { route: '/operations/equipment', role: 'OWNER',        file: 'cap_equipment.png' },
];

async function loginWithDemoButton(page, roleName) {
  await page.goto(BASE_URL + '/auth/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(500);
  
  // Click the quick demo button
  const btn = page.locator(`button:has-text("${roleName}"), a:has-text("${roleName}")`).first();
  await btn.click();
  
  // Wait for redirect away from login
  await page.waitForURL(u => !u.includes('/auth/login'), { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(1000);
  console.log(`  After demo login (${roleName}): ${page.url()}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Group pages by role
  const grouped = {};
  for (const p of pages) {
    if (!grouped[p.role]) grouped[p.role] = [];
    grouped[p.role].push(p);
  }

  for (const [role, pageList] of Object.entries(grouped)) {
    console.log(`\nLogging in as ${role} (${demoRoles[role]})...`);
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    
    try {
      await loginWithDemoButton(page, demoRoles[role]);
      
      for (const p of pageList) {
        try {
          console.log(`  Navigating to ${p.route}...`);
          await page.goto(BASE_URL + p.route, { waitUntil: 'networkidle', timeout: 20000 });
          await page.waitForTimeout(2000);
          const outPath = path.join(OUT_DIR, p.file);
          await page.screenshot({ path: outPath, fullPage: false });
          console.log(`  ✓ Saved: ${p.file}`);
        } catch (e) {
          console.log(`  ✗ ${p.route}: ${e.message.slice(0, 100)}`);
        }
      }
    } catch (e) {
      console.log(`  ✗ Login failed: ${e.message.slice(0, 100)}`);
    }
    
    await ctx.close();
  }
  
  await browser.close();
  console.log('\nAll done.');
})();
