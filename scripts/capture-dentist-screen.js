const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

async function captureDentist() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const loginRes = await context.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'dr.sandy@ebtesamty.dev', password: 'Password123!' },
    });
    console.log('Login status:', loginRes.status());

    const page = await context.newPage();
    console.log('Navigating to /dentist...');
    await page.goto('http://localhost:3000/dentist', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const docsPath = path.join(DOCS_DIR, '04_dentist_workspace_redesigned.png');
    const artifactPath = path.join(ARTIFACT_DIR, '04_dentist_workspace_redesigned.png');
    await page.screenshot({ path: docsPath, fullPage: false });
    fs.copyFileSync(docsPath, artifactPath);
    console.log('Saved 04_dentist_workspace_redesigned.png successfully!');
    await context.close();
  } catch (err) {
    console.error('Error capturing dentist workspace:', err);
  } finally {
    await browser.close();
  }
}

captureDentist();
