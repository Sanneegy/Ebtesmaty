const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

const PUBLIC_PAGES = [
  { name: 'homepage_desktop', url: 'http://localhost:3000/', viewport: { width: 1440, height: 900 } },
  { name: 'homepage_mobile', url: 'http://localhost:3000/', viewport: { width: 390, height: 844 } },
  { name: 'dentists_desktop', url: 'http://localhost:3000/dentists', viewport: { width: 1440, height: 900 } },
  { name: 'branches_desktop', url: 'http://localhost:3000/branches', viewport: { width: 1440, height: 900 } },
  { name: 'services_desktop', url: 'http://localhost:3000/services', viewport: { width: 1440, height: 900 } },
  { name: 'about_desktop', url: 'http://localhost:3000/about', viewport: { width: 1440, height: 900 } },
  { name: 'booking_desktop', url: 'http://localhost:3000/book', viewport: { width: 1440, height: 900 } },
];

const DASHBOARD_PAGES = [
  {
    name: 'management_desktop',
    url: 'http://localhost:3000/management',
    loginEmail: 'manager.b1@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: 'billing_desktop',
    url: 'http://localhost:3000/billing',
    loginEmail: 'accountant.mina@ebtesamty.dev',
    fallbackEmail: 'manager.b1@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: 'crm_desktop',
    url: 'http://localhost:3000/crm',
    loginEmail: 'manager.b1@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: 'inventory_desktop',
    url: 'http://localhost:3000/inventory',
    loginEmail: 'manager.b1@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: 'reception_desktop',
    url: 'http://localhost:3000/reception',
    loginEmail: 'mariam.reception@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: 'dentist_desktop',
    url: 'http://localhost:3000/dentist',
    loginEmail: 'dr.sandy@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: 'portal_desktop',
    url: 'http://localhost:3000/portal',
    loginEmail: 'hassan.patient@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: 'admin_desktop',
    url: 'http://localhost:3000/admin',
    loginEmail: 'superadmin.farida@ebtesamty.dev',
    fallbackEmail: 'manager.b1@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  console.log('Capturing screenshots...');

  // 1. Capture public pages
  for (const p of PUBLIC_PAGES) {
    try {
      const context = await browser.newContext({ viewport: p.viewport });
      const page = await context.newPage();
      console.log(`Visiting ${p.url} (${p.name})...`);
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);

      const docsPath = path.join(DOCS_DIR, `${p.name}.png`);
      const artifactPath = path.join(ARTIFACT_DIR, `${p.name}.png`);
      await page.screenshot({ path: docsPath, fullPage: false });
      fs.copyFileSync(docsPath, artifactPath);
      console.log(`Saved screenshot: ${p.name}.png`);
      await context.close();
    } catch (err) {
      console.error(`Error capturing ${p.name}:`, err.message);
    }
  }

  // 2. Capture authenticated dashboards
  for (const p of DASHBOARD_PAGES) {
    try {
      const context = await browser.newContext({ viewport: p.viewport });

      // Authenticate via API
      let loginRes = await context.request.post('http://localhost:3000/api/auth/login', {
        data: { emailOrPhone: p.loginEmail, password: 'Password123!' },
      });

      if (!loginRes.ok() && p.fallbackEmail) {
        console.log(`Fallback login for ${p.name} using ${p.fallbackEmail}...`);
        loginRes = await context.request.post('http://localhost:3000/api/auth/login', {
          data: { emailOrPhone: p.fallbackEmail, password: 'Password123!' },
        });
      }

      const page = await context.newPage();
      console.log(`Visiting authenticated ${p.url} (${p.name})...`);
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500); // Wait for SVG charts to render

      const docsPath = path.join(DOCS_DIR, `${p.name}.png`);
      const artifactPath = path.join(ARTIFACT_DIR, `${p.name}.png`);
      await page.screenshot({ path: docsPath, fullPage: false });
      fs.copyFileSync(docsPath, artifactPath);
      console.log(`Saved screenshot: ${p.name}.png`);
      await context.close();
    } catch (err) {
      console.error(`Error capturing ${p.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('Finished capturing all authenticated and public screenshots!');
})();
