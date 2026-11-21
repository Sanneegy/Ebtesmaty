const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

async function captureManagement() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const loginRes = await context.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'manager.b1@ebtesamty.dev', password: 'Password123!' },
    });
    console.log('Login status:', loginRes.status());

    const page = await context.newPage();
    console.log('Navigating to /management...');
    await page.goto('http://localhost:3000/management', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const docsPath = path.join(DOCS_DIR, '05_owner_dashboard_redesigned.png');
    const artifactPath = path.join(ARTIFACT_DIR, '05_owner_dashboard_redesigned.png');
    await page.screenshot({ path: docsPath, fullPage: false });
    fs.copyFileSync(docsPath, artifactPath);
    console.log('Saved 05_owner_dashboard_redesigned.png successfully!');
    await context.close();
  } catch (err) {
    console.error('Error capturing management:', err);
  } finally {
    await browser.close();
  }
}

captureManagement();
