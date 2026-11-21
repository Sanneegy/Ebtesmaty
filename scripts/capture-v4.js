const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = 'C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';

const credentials = {
  OWNER:        { email: 'manager.b1@ebtesamty.dev',     pass: 'Password123!' },
  RECEPTIONIST: { email: 'mariam.reception@ebtesamty.dev', pass: 'Password123!' },
  DENTIST:      { email: 'dr.sandy@ebtesamty.dev',       pass: 'Password123!' },
  PATIENT:      { email: 'hassan.patient@ebtesamty.dev', pass: 'Password123!' },
};

const pages = [
  { role: 'OWNER',        route: '/management', file: 'v4_01_manager_bg_accordion.png' },
  { role: 'RECEPTIONIST', route: '/reception',  file: 'v4_02_reception_bg_traffic.png' },
  { role: 'DENTIST',      route: '/dentist',    file: 'v4_03_dentist_bg_traffic.png' },
  { role: 'PATIENT',      route: '/portal',     file: 'v4_04_patient_bg_traffic.png' },
  { role: 'OWNER',        route: '/billing',    file: 'v4_05_billing_bg_details.png' },
  { role: 'OWNER',        route: '/crm',        file: 'v4_06_crm_bg_funnel.png' },
  { role: 'OWNER',        route: '/inventory',  file: 'v4_07_inventory_bg_kpis.png' },
  { role: 'OWNER',        route: '/admin',      file: 'v4_08_admin_bg_governance.png' },
];

async function capture() {
  const browser = await chromium.launch({ headless: true });
  
  for (const p of pages) {
    console.log(`\nCapturing ${p.route} as ${p.role}...`);
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
    });
    const page = await ctx.newPage();

    const cred = credentials[p.role];
    const loginRes = await page.request.post(`${BASE_URL}/api/auth/login`, {
      data: { emailOrPhone: cred.email, password: cred.pass },
    });
    console.log(`  Login status: ${loginRes.status()}`);

    await page.goto(`${BASE_URL}${p.route}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // Allow animations & charts to settle

    // If manager, click the "Click for Details" accordion to demonstrate click-to-expand
    if (p.route === '/management') {
      const detailsBtn = page.locator('button:has-text("Click for Details")').first();
      if (await detailsBtn.isVisible()) {
        await detailsBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // If billing, click first KPI to expand details
    if (p.route === '/billing') {
      const kpiCard = page.locator('div:has-text("Total Invoiced")').last();
      if (await kpiCard.isVisible()) {
        await kpiCard.click();
        await page.waitForTimeout(500);
      }
    }

    // If dentist, click Waiting for Me to expand details
    if (p.route === '/dentist') {
      const waitPill = page.locator('div:has-text("Waiting for Me")').last();
      if (await waitPill.isVisible()) {
        await waitPill.click();
        await page.waitForTimeout(500);
      }
    }

    const savePath = path.join(OUT_DIR, p.file);
    await page.screenshot({ path: savePath, fullPage: false });
    console.log(`  ✓ Saved: ${p.file}`);

    await ctx.close();
  }

  await browser.close();
  console.log('\nAll captures finished successfully!');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
