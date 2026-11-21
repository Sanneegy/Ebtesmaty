const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

async function testReceptionAndAll() {
  const browser = await chromium.launch({ headless: true });
  const failedRequests = [];
  const consoleErrors = [];

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    // Track network failures and console errors
    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('requestfailed', (req) => {
      failedRequests.push({ url: req.url(), failure: req.failure() });
    });

    // 1. Log in as receptionist
    console.log('[Auth] Logging in as mariam.reception@ebtesamty.dev...');
    const loginRes = await context.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'mariam.reception@ebtesamty.dev', password: 'Password123!' },
    });
    console.log('Login status:', loginRes.status());

    // 2. Open /reception
    console.log('[Navigate] Navigating to http://localhost:3000/reception...');
    const res = await page.goto('http://localhost:3000/reception', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Reception HTTP status:', res.status());
    await page.waitForTimeout(2000);

    // 3. Inspect BrandLogo dimensions and styles
    const logoDimensions = await page.evaluate(() => {
      const logoImgs = document.querySelectorAll('img[src*="ebtesamty_official_logo"]');
      const results = [];
      logoImgs.forEach((img) => {
        const rect = img.getBoundingClientRect();
        results.push({
          width: rect.width,
          height: rect.height,
          renderedWidth: img.clientWidth,
          renderedHeight: img.clientHeight,
        });
      });
      return results;
    });
    console.log('Logo dimensions on page:', JSON.stringify(logoDimensions));

    // 4. Inspect Sidebar styling
    const sidebarStyles = await page.evaluate(() => {
      const sidebar = document.querySelector('aside');
      if (!sidebar) return null;
      const computed = window.getComputedStyle(sidebar);
      return {
        display: computed.display,
        width: computed.width,
        position: computed.position,
        backgroundColor: computed.backgroundColor,
      };
    });
    console.log('Sidebar styles:', JSON.stringify(sidebarStyles));

    // 5. Inspect button and card styles
    const buttonStyles = await page.evaluate(() => {
      const newApptBtn = document.querySelector('a[href*="/reception/agenda"]');
      if (!newApptBtn) return null;
      const computed = window.getComputedStyle(newApptBtn);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        borderRadius: computed.borderRadius,
        fontWeight: computed.fontWeight,
      };
    });
    console.log('Button styles:', JSON.stringify(buttonStyles));

    // 6. Screenshot Reception
    const recDocsPath = path.join(DOCS_DIR, '03_reception_verified_fixed.png');
    const recArtifactPath = path.join(ARTIFACT_DIR, '03_reception_verified_fixed.png');
    await page.screenshot({ path: recDocsPath, fullPage: false });
    fs.copyFileSync(recDocsPath, recArtifactPath);
    console.log('Saved 03_reception_verified_fixed.png');

    // 7. Verify Patient Portal
    console.log('[Patient] Testing Hassan patient login...');
    const patientContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await patientContext.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'hassan.patient@ebtesamty.dev', password: 'Password123!' },
    });
    const patientPage = await patientContext.newPage();
    await patientPage.goto('http://localhost:3000/portal', { waitUntil: 'networkidle', timeout: 30000 });
    await patientPage.waitForTimeout(1500);
    const patDocsPath = path.join(DOCS_DIR, '02_patient_verified_fixed.png');
    const patArtifactPath = path.join(ARTIFACT_DIR, '02_patient_verified_fixed.png');
    await patientPage.screenshot({ path: patDocsPath, fullPage: false });
    fs.copyFileSync(patDocsPath, patArtifactPath);
    console.log('Saved 02_patient_verified_fixed.png');
    await patientContext.close();

    // 8. Verify Dentist Workspace
    console.log('[Dentist] Testing Dr. Sandy dentist login...');
    const dentistContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await dentistContext.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'dr.sandy@ebtesamty.dev', password: 'Password123!' },
    });
    const dentistPage = await dentistContext.newPage();
    await dentistPage.goto('http://localhost:3000/dentist', { waitUntil: 'networkidle', timeout: 30000 });
    await dentistPage.waitForTimeout(1500);
    const denDocsPath = path.join(DOCS_DIR, '04_dentist_verified_fixed.png');
    const denArtifactPath = path.join(ARTIFACT_DIR, '04_dentist_verified_fixed.png');
    await dentistPage.screenshot({ path: denDocsPath, fullPage: false });
    fs.copyFileSync(denDocsPath, denArtifactPath);
    console.log('Saved 04_dentist_verified_fixed.png');
    await dentistContext.close();

    // 9. Verify Owner Dashboard
    console.log('[Owner] Testing Amr owner login...');
    const ownerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ownerContext.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'manager.b1@ebtesamty.dev', password: 'Password123!' },
    });
    const ownerPage = await ownerContext.newPage();
    await ownerPage.goto('http://localhost:3000/management', { waitUntil: 'networkidle', timeout: 30000 });
    await ownerPage.waitForTimeout(1500);
    const ownDocsPath = path.join(DOCS_DIR, '05_owner_verified_fixed.png');
    const ownArtifactPath = path.join(ARTIFACT_DIR, '05_owner_verified_fixed.png');
    await ownerPage.screenshot({ path: ownDocsPath, fullPage: false });
    fs.copyFileSync(ownDocsPath, ownArtifactPath);
    console.log('Saved 05_owner_verified_fixed.png');
    await ownerContext.close();

    // 10. Verify Public Homepage
    console.log('[Public] Testing Homepage...');
    const publicContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const publicPage = await publicContext.newPage();
    await publicPage.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
    await publicPage.waitForTimeout(1500);
    const homeDocsPath = path.join(DOCS_DIR, '01_homepage_verified_fixed.png');
    const homeArtifactPath = path.join(ARTIFACT_DIR, '01_homepage_verified_fixed.png');
    await publicPage.screenshot({ path: homeDocsPath, fullPage: false });
    fs.copyFileSync(homeDocsPath, homeArtifactPath);
    console.log('Saved 01_homepage_verified_fixed.png');
    await publicContext.close();

    console.log('\n--- DIAGNOSTIC SUMMARY ---');
    console.log('Console Errors count:', consoleErrors.length);
    if (consoleErrors.length > 0) console.log('Console Errors:', consoleErrors);
    console.log('Failed Requests count:', failedRequests.length);
    if (failedRequests.length > 0) console.log('Failed Requests:', failedRequests);

    await context.close();
  } catch (err) {
    console.error('Diagnostic error:', err);
  } finally {
    await browser.close();
  }
}

testReceptionAndAll();
