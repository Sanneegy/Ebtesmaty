const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = 'C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';

async function captureChart() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await ctx.newPage();

  // 1. Log in as Dentist Dr. Sandy
  await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: { emailOrPhone: 'dr.sandy@ebtesamty.dev', password: 'Password123!' },
  });

  // 2. Navigate to Patient Chart
  console.log('Navigating to patient chart...');
  await page.goto(`${BASE_URL}/dentist/chart/cmvtqfxsz001xlhvkzmyu78mq`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForTimeout(2000);

  const savePath = path.join(OUT_DIR, 'redesign_12_dentist_patient_chart.png');
  await page.screenshot({ path: savePath, fullPage: false });
  console.log('✓ Captured redesign_12_dentist_patient_chart.png');

  await browser.close();
}

captureChart().catch(console.error);
