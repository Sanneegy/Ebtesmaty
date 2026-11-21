const { chromium } = require('playwright');

async function testLoginFlow() {
  console.log('Testing restored login page and demo role buttons...\n');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // 1. Patient (Hassan)
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });
  await page.click('text=Patient (Hassan)');
  const patientEmail = await page.inputValue('input[type=text]');
  console.log('1. Patient clicked. Email filled:', patientEmail);
  await page.click('button[type=submit]');
  await page.waitForURL('**/portal**', { timeout: 10000 });
  console.log('   Redirected to:', page.url());
  await ctx.clearCookies();

  // 2. Manager (Amr)
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });
  await page.click('text=Manager (Amr)');
  const mgrEmail = await page.inputValue('input[type=text]');
  console.log('2. Manager clicked. Email filled:', mgrEmail);
  await page.click('button[type=submit]');
  await page.waitForURL('**/management**', { timeout: 10000 });
  console.log('   Redirected to:', page.url());
  await ctx.clearCookies();

  // 3. Reception (Mariam)
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });
  await page.click('text=Reception (Mariam)');
  const recEmail = await page.inputValue('input[type=text]');
  console.log('3. Reception clicked. Email filled:', recEmail);
  await page.click('button[type=submit]');
  await page.waitForURL('**/reception**', { timeout: 10000 });
  console.log('   Redirected to:', page.url());
  await ctx.clearCookies();

  // 4. Dentist (Dr. Sandy)
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });
  await page.click('text=Dentist (Dr. Sandy)');
  const docEmail = await page.inputValue('input[type=text]');
  console.log('4. Dentist clicked. Email filled:', docEmail);
  await page.click('button[type=submit]');
  await page.waitForURL('**/dentist**', { timeout: 10000 });
  console.log('   Redirected to:', page.url());

  await browser.close();
  console.log('\nSUCCESS: All original demo role buttons auto-populate and authenticate to their correct dashboards!');
}

testLoginFlow().catch((err) => {
  console.error('Error during login test:', err);
  process.exit(1);
});
