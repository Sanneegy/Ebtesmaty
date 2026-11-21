const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

async function verifyV2() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    // 1. Reception Dashboard
    console.log('[1/10] Verifying /reception (Mariam)...');
    const recContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await recContext.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'mariam.reception@ebtesamty.dev', password: 'Password123!' },
    });
    const recPage = await recContext.newPage();
    const recRes = await recPage.goto('http://localhost:3000/reception', { waitUntil: 'networkidle', timeout: 30000 });
    await recPage.waitForTimeout(2000);
    const recLogoSize = await recPage.evaluate(() => {
      const img = document.querySelector('img[src*="ebtesamty_official_logo"]');
      return img ? { width: img.clientWidth, height: img.clientHeight } : null;
    });
    const recDocsPath = path.join(DOCS_DIR, 'v2_01_reception.png');
    const recArtPath = path.join(ARTIFACT_DIR, 'v2_01_reception.png');
    await recPage.screenshot({ path: recDocsPath, fullPage: false });
    fs.copyFileSync(recDocsPath, recArtPath);
    results.push({ page: '/reception', status: recRes.status(), logoSize: recLogoSize, screenshot: 'v2_01_reception.png' });
    await recContext.close();

    // 2. Patient Portal
    console.log('[2/10] Verifying /portal (Hassan)...');
    const patContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await patContext.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'hassan.patient@ebtesamty.dev', password: 'Password123!' },
    });
    const patPage = await patContext.newPage();
    const patRes = await patPage.goto('http://localhost:3000/portal', { waitUntil: 'networkidle', timeout: 30000 });
    await patPage.waitForTimeout(2000);
    const patDocsPath = path.join(DOCS_DIR, 'v2_02_portal.png');
    const patArtPath = path.join(ARTIFACT_DIR, 'v2_02_portal.png');
    await patPage.screenshot({ path: patDocsPath, fullPage: false });
    fs.copyFileSync(patDocsPath, patArtPath);
    results.push({ page: '/portal', status: patRes.status(), screenshot: 'v2_02_portal.png' });
    await patContext.close();

    // 3. Dentist Workspace
    console.log('[3/10] Verifying /dentist (Dr. Sandy)...');
    const denContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await denContext.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'dr.sandy@ebtesamty.dev', password: 'Password123!' },
    });
    const denPage = await denContext.newPage();
    const denRes = await denPage.goto('http://localhost:3000/dentist', { waitUntil: 'networkidle', timeout: 30000 });
    await denPage.waitForTimeout(2000);
    const denDocsPath = path.join(DOCS_DIR, 'v2_03_dentist.png');
    const denArtPath = path.join(ARTIFACT_DIR, 'v2_03_dentist.png');
    await denPage.screenshot({ path: denDocsPath, fullPage: false });
    fs.copyFileSync(denDocsPath, denArtPath);
    results.push({ page: '/dentist', status: denRes.status(), screenshot: 'v2_03_dentist.png' });
    await denContext.close();

    // 4. Owner Dashboard
    console.log('[4/10] Verifying /management (Amr)...');
    const ownContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ownContext.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'manager.b1@ebtesamty.dev', password: 'Password123!' },
    });
    const ownPage = await ownContext.newPage();
    const ownRes = await ownPage.goto('http://localhost:3000/management', { waitUntil: 'networkidle', timeout: 30000 });
    await ownPage.waitForTimeout(2000);
    const ownDocsPath = path.join(DOCS_DIR, 'v2_04_management.png');
    const ownArtPath = path.join(ARTIFACT_DIR, 'v2_04_management.png');
    await ownPage.screenshot({ path: ownDocsPath, fullPage: false });
    fs.copyFileSync(ownDocsPath, ownArtPath);
    results.push({ page: '/management', status: ownRes.status(), screenshot: 'v2_04_management.png' });

    // 5. Finance & Billing
    console.log('[5/10] Verifying /billing...');
    const billPage = await ownContext.newPage();
    const billRes = await billPage.goto('http://localhost:3000/billing', { waitUntil: 'networkidle', timeout: 30000 });
    await billPage.waitForTimeout(1500);
    const billDocsPath = path.join(DOCS_DIR, 'v2_05_billing.png');
    const billArtPath = path.join(ARTIFACT_DIR, 'v2_05_billing.png');
    await billPage.screenshot({ path: billDocsPath, fullPage: false });
    fs.copyFileSync(billDocsPath, billArtPath);
    results.push({ page: '/billing', status: billRes.status(), screenshot: 'v2_05_billing.png' });
    await billPage.close();

    // 6. Inventory
    console.log('[6/10] Verifying /inventory...');
    const invPage = await ownContext.newPage();
    const invRes = await invPage.goto('http://localhost:3000/inventory', { waitUntil: 'networkidle', timeout: 30000 });
    await invPage.waitForTimeout(1500);
    const invDocsPath = path.join(DOCS_DIR, 'v2_06_inventory.png');
    const invArtPath = path.join(ARTIFACT_DIR, 'v2_06_inventory.png');
    await invPage.screenshot({ path: invDocsPath, fullPage: false });
    fs.copyFileSync(invDocsPath, invArtPath);
    results.push({ page: '/inventory', status: invRes.status(), screenshot: 'v2_06_inventory.png' });
    await invPage.close();

    // 7. Purchasing
    console.log('[7/10] Verifying /purchasing...');
    const purPage = await ownContext.newPage();
    const purRes = await purPage.goto('http://localhost:3000/purchasing', { waitUntil: 'networkidle', timeout: 30000 });
    await purPage.waitForTimeout(1500);
    const purDocsPath = path.join(DOCS_DIR, 'v2_07_purchasing.png');
    const purArtPath = path.join(ARTIFACT_DIR, 'v2_07_purchasing.png');
    await purPage.screenshot({ path: purDocsPath, fullPage: false });
    fs.copyFileSync(purDocsPath, purArtPath);
    results.push({ page: '/purchasing', status: purRes.status(), screenshot: 'v2_07_purchasing.png' });
    await purPage.close();

    // 8. Operations & Equipment
    console.log('[8/10] Verifying /operations/equipment...');
    const eqPage = await ownContext.newPage();
    const eqRes = await eqPage.goto('http://localhost:3000/operations/equipment', { waitUntil: 'networkidle', timeout: 30000 });
    await eqPage.waitForTimeout(1500);
    const eqDocsPath = path.join(DOCS_DIR, 'v2_08_equipment.png');
    const eqArtPath = path.join(ARTIFACT_DIR, 'v2_08_equipment.png');
    await eqPage.screenshot({ path: eqDocsPath, fullPage: false });
    fs.copyFileSync(eqDocsPath, eqArtPath);
    results.push({ page: '/operations/equipment', status: eqRes.status(), screenshot: 'v2_08_equipment.png' });
    await eqPage.close();

    // 9. CRM
    console.log('[9/10] Verifying /crm...');
    const crmPage = await ownContext.newPage();
    const crmRes = await crmPage.goto('http://localhost:3000/crm', { waitUntil: 'networkidle', timeout: 30000 });
    await crmPage.waitForTimeout(1500);
    const crmDocsPath = path.join(DOCS_DIR, 'v2_09_crm.png');
    const crmArtPath = path.join(ARTIFACT_DIR, 'v2_09_crm.png');
    await crmPage.screenshot({ path: crmDocsPath, fullPage: false });
    fs.copyFileSync(crmDocsPath, crmArtPath);
    results.push({ page: '/crm', status: crmRes.status(), screenshot: 'v2_09_crm.png' });
    await crmPage.close();

    // 10. Administration
    console.log('[10/10] Verifying /admin...');
    const admPage = await ownContext.newPage();
    const admRes = await admPage.goto('http://localhost:3000/admin', { waitUntil: 'networkidle', timeout: 30000 });
    await admPage.waitForTimeout(1500);
    const admDocsPath = path.join(DOCS_DIR, 'v2_10_admin.png');
    const admArtPath = path.join(ARTIFACT_DIR, 'v2_10_admin.png');
    await admPage.screenshot({ path: admDocsPath, fullPage: false });
    fs.copyFileSync(admDocsPath, admArtPath);
    results.push({ page: '/admin', status: admRes.status(), screenshot: 'v2_10_admin.png' });
    await ownContext.close();

    console.log('\n=== V2 VERIFICATION RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('Error during V2 verification:', err);
  } finally {
    await browser.close();
  }
}

verifyV2();
