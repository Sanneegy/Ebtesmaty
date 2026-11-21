const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

async function capturePatientPortal() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const loginRes = await context.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'hassan.patient@ebtesamty.dev', password: 'Password123!' },
    });
    console.log('Login status:', loginRes.status());

    const page = await context.newPage();
    console.log('Navigating to /portal...');
    await page.goto('http://localhost:3000/portal', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const docsPath = path.join(DOCS_DIR, '02_patient_portal_redesigned.png');
    const artifactPath = path.join(ARTIFACT_DIR, '02_patient_portal_redesigned.png');
    await page.screenshot({ path: docsPath, fullPage: false });
    fs.copyFileSync(docsPath, artifactPath);
    console.log('Saved 02_patient_portal_redesigned.png successfully!');
    await context.close();
  } catch (err) {
    console.error('Error capturing portal:', err);
  } finally {
    await browser.close();
  }
}

capturePatientPortal();
