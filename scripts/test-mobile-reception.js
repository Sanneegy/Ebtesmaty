const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

async function testMobileReception() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.request.post('http://localhost:3000/api/auth/login', {
      data: { emailOrPhone: 'mariam.reception@ebtesamty.dev', password: 'Password123!' },
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/reception', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    const docPath = path.join(DOCS_DIR, '03_reception_mobile_verified.png');
    const artPath = path.join(ARTIFACT_DIR, '03_reception_mobile_verified.png');
    await page.screenshot({ path: docPath, fullPage: false });
    fs.copyFileSync(docPath, artPath);
    console.log('Saved 03_reception_mobile_verified.png');
    await context.close();
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
}

testMobileReception();
