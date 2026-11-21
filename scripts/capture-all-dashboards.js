const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = 'C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';

const credentials = {
  RECEPTIONIST: { email: 'mariam.reception@ebtesamty.dev', pass: 'Password123!' },
  OWNER:        { email: 'manager.b1@ebtesamty.dev',     pass: 'Password123!' },
  DENTIST:      { email: 'dr.sandy@ebtesamty.dev',       pass: 'Password123!' },
  PATIENT:      { email: 'hassan.patient@ebtesamty.dev', pass: 'Password123!' },
  SYSADMIN:     { email: 'sysadmin@ebtesamty.dev',       pass: 'Password123!' },
};

const tasks = [
  { role: 'RECEPTIONIST', route: '/reception',            file: 'redesign_01_reception.png' },
  { role: 'RECEPTIONIST', route: '/reception/agenda',     file: 'redesign_02_reception_agenda.png' },
  { role: 'OWNER',        route: '/management',           file: 'redesign_03_management_owner.png' },
  { role: 'OWNER',        route: '/billing',              file: 'redesign_04_billing_finance.png' },
  { role: 'OWNER',        route: '/inventory',            file: 'redesign_05_inventory_pastel.png' },
  { role: 'OWNER',        route: '/purchasing',           file: 'redesign_06_purchasing.png' },
  { role: 'OWNER',        route: '/operations/equipment', file: 'redesign_07_equipment.png' },
  { role: 'OWNER',        route: '/crm',                  file: 'redesign_08_crm_pipeline.png' },
  { role: 'DENTIST',      route: '/dentist',              file: 'redesign_09_dentist_desk.png' },
  { role: 'PATIENT',      route: '/portal',               file: 'redesign_10_patient_portal.png' },
  { role: 'SYSADMIN',     route: '/admin',                file: 'redesign_11_admin_governance.png' },
];

async function capture() {
  const browser = await chromium.launch({ headless: true });
  
  // Group by role so we only login once per role
  const byRole = {};
  for (const t of tasks) {
    if (!byRole[t.role]) byRole[t.role] = [];
    byRole[t.role].push(t);
  }

  for (const [role, items] of Object.entries(byRole)) {
    console.log(`\n--- Authenticating as ${role} ---`);
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
    });
    const page = await ctx.newPage();

    // 1. Log in via API to set session cookie cleanly
    const cred = credentials[role];
    const loginRes = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { emailOrPhone: cred.email, password: cred.pass },
    });
    console.log(`  Login HTTP status: ${loginRes.status()}`);

    for (const item of items) {
      console.log(`  Capturing ${item.route} -> ${item.file}...`);
      try {
        await page.goto(`${BASE_URL}${item.route}`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000); // Allow charts & animations to settle
        const savePath = path.join(OUT_DIR, item.file);
        await page.screenshot({ path: savePath, fullPage: false });
        console.log(`  ✓ Successfully captured: ${item.file}`);
      } catch (err) {
        console.error(`  ✗ Failed to capture ${item.route}:`, err.message);
      }
    }

    await ctx.close();
  }

  await browser.close();
  console.log('\nAll captures completed!');
}

capture().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
