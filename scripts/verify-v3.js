const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

async function verifyV3() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    // 1. Reception Dashboard
    console.log('[1/6] Verifying /reception (Mariam)...');
    const recContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await recContext.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'mariam.reception@ebtesamty.dev', password: 'Password123!' },
    });
    const recPage = await recContext.newPage();
    const recRes = await recPage.goto('http://localhost:3000/reception', { waitUntil: 'networkidle', timeout: 30000 });
    await recPage.waitForTimeout(2000);
    const recDocsPath = path.join(DOCS_DIR, 'v3_01_reception.png');
    const recArtPath = path.join(ARTIFACT_DIR, 'v3_01_reception.png');
    await recPage.screenshot({ path: recDocsPath, fullPage: false });
    fs.copyFileSync(recDocsPath, recArtPath);
    results.push({ page: '/reception', status: recRes.status(), screenshot: 'v3_01_reception.png' });
    await recContext.close();

    // 2. Patient Portal
    console.log('[2/6] Verifying /portal (Hassan)...');
    const patContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await patContext.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'hassan.patient@ebtesamty.dev', password: 'Password123!' },
    });
    const patPage = await patContext.newPage();
    const patRes = await patPage.goto('http://localhost:3000/portal', { waitUntil: 'networkidle', timeout: 30000 });
    await patPage.waitForTimeout(2000);
    const patDocsPath = path.join(DOCS_DIR, 'v3_02_portal.png');
    const patArtPath = path.join(ARTIFACT_DIR, 'v3_02_portal.png');
    await patPage.screenshot({ path: patDocsPath, fullPage: false });
    fs.copyFileSync(patDocsPath, patArtPath);
    results.push({ page: '/portal', status: patRes.status(), screenshot: 'v3_02_portal.png' });
    await patContext.close();

    // 3. Dentist Workspace
    console.log('[3/6] Verifying /dentist (Dr. Sandy)...');
    const denContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await denContext.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'dr.sandy@ebtesamty.dev', password: 'Password123!' },
    });
    const denPage = await denContext.newPage();
    const denRes = await denPage.goto('http://localhost:3000/dentist', { waitUntil: 'networkidle', timeout: 30000 });
    await denPage.waitForTimeout(2000);
    const denDocsPath = path.join(DOCS_DIR, 'v3_03_dentist.png');
    const denArtPath = path.join(ARTIFACT_DIR, 'v3_03_dentist.png');
    await denPage.screenshot({ path: denDocsPath, fullPage: false });
    fs.copyFileSync(denDocsPath, denArtPath);
    results.push({ page: '/dentist', status: denRes.status(), screenshot: 'v3_03_dentist.png' });
    await denContext.close();

    // 4. Owner Dashboard
    console.log('[4/6] Verifying /management (Amr)...');
    const ownContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ownContext.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'manager.b1@ebtesamty.dev', password: 'Password123!' },
    });
    const ownPage = await ownContext.newPage();
    const ownRes = await ownPage.goto('http://localhost:3000/management', { waitUntil: 'networkidle', timeout: 30000 });
    await ownPage.waitForTimeout(2000);
    const ownDocsPath = path.join(DOCS_DIR, 'v3_04_management.png');
    const ownArtPath = path.join(ARTIFACT_DIR, 'v3_04_management.png');
    await ownPage.screenshot({ path: ownDocsPath, fullPage: false });
    fs.copyFileSync(ownDocsPath, ownArtPath);
    results.push({ page: '/management', status: ownRes.status(), screenshot: 'v3_04_management.png' });

    // 5. Finance & Billing
    console.log('[5/6] Verifying /billing (Finance)...');
    const billPage = await ownContext.newPage();
    const billRes = await billPage.goto('http://localhost:3000/billing', { waitUntil: 'networkidle', timeout: 30000 });
    await billPage.waitForTimeout(2000);
    const billDocsPath = path.join(DOCS_DIR, 'v3_05_billing.png');
    const billArtPath = path.join(ARTIFACT_DIR, 'v3_05_billing.png');
    await billPage.screenshot({ path: billDocsPath, fullPage: false });
    fs.copyFileSync(billDocsPath, billArtPath);
    results.push({ page: '/billing', status: billRes.status(), screenshot: 'v3_05_billing.png' });
    await billPage.close();

    // 6. Inventory Desk
    console.log('[6/6] Verifying /inventory...');
    const invPage = await ownContext.newPage();
    const invRes = await invPage.goto('http://localhost:3000/inventory', { waitUntil: 'networkidle', timeout: 2000 });
    await invPage.waitForTimeout(2000);
    const invDocsPath = path.join(DOCS_DIR, 'v3_06_inventory.png');
    const invArtPath = path.join(ARTIFACT_DIR, 'v3_06_inventory.png');
    await invPage.screenshot({ path: invDocsPath, fullPage: false });
    fs.copyFileSync(invDocsPath, invArtPath);
    results.push({ page: '/inventory', status: invRes.status(), screenshot: 'v3_06_inventory.png' });
    await invPage.close();

    await ownContext.close();

    console.log('\n=== V3 SCREENSHOT VERIFICATION COMPLETE ===');
    console.table(results);
  } catch (err) {
    console.error('Error during V3 verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyV3();
