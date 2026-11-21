const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

// 1. Public & Guest Routes
const PUBLIC_ROUTES = [
  { name: '01_homepage_desktop', url: 'http://localhost:3000/', viewport: { width: 1440, height: 900 } },
  { name: '01_homepage_mobile', url: 'http://localhost:3000/', viewport: { width: 390, height: 844 } },
  { name: '02_services_desktop', url: 'http://localhost:3000/services', viewport: { width: 1440, height: 900 } },
  { name: '03_service_implants_desktop', url: 'http://localhost:3000/services/dental-implants', viewport: { width: 1440, height: 900 } },
  { name: '04_dentists_desktop', url: 'http://localhost:3000/dentists', viewport: { width: 1440, height: 900 } },
  { name: '05_branches_desktop', url: 'http://localhost:3000/branches', viewport: { width: 1440, height: 900 } },
  { name: '06_branch_heliopolis_desktop', url: 'http://localhost:3000/branches/BR-A', viewport: { width: 1440, height: 900 } },
  { name: '07_about_desktop', url: 'http://localhost:3000/about', viewport: { width: 1440, height: 900 } },
  { name: '08_new_patients_desktop', url: 'http://localhost:3000/new-patients', viewport: { width: 1440, height: 900 } },
  { name: '09_emergency_desktop', url: 'http://localhost:3000/emergency', viewport: { width: 1440, height: 900 } },
  { name: '10_pricing_desktop', url: 'http://localhost:3000/pricing', viewport: { width: 1440, height: 900 } },
  { name: '11_education_desktop', url: 'http://localhost:3000/education', viewport: { width: 1440, height: 900 } },
  { name: '12_faqs_desktop', url: 'http://localhost:3000/faqs', viewport: { width: 1440, height: 900 } },
  { name: '13_contact_desktop', url: 'http://localhost:3000/contact', viewport: { width: 1440, height: 900 } },
  { name: '14_policies_desktop', url: 'http://localhost:3000/policies', viewport: { width: 1440, height: 900 } },
  { name: '15_booking_desktop', url: 'http://localhost:3000/book', viewport: { width: 1440, height: 900 } },
  { name: '16_appointments_request_desktop', url: 'http://localhost:3000/appointments/request', viewport: { width: 1440, height: 900 } },
  { name: '17_auth_login_desktop', url: 'http://localhost:3000/auth/login', viewport: { width: 1440, height: 900 } },
  { name: '18_auth_register_desktop', url: 'http://localhost:3000/auth/register', viewport: { width: 1440, height: 900 } },
  { name: '19_demo_sandbox_desktop', url: 'http://localhost:3000/demo', viewport: { width: 1440, height: 900 } },
];

// 2. Authenticated Routes
const AUTH_ROUTES = [
  // Executive Management
  {
    name: '20_management_desktop',
    url: 'http://localhost:3000/management',
    loginEmail: 'admin@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  // Reception Desk & Operatory Agenda
  {
    name: '21_reception_desk_desktop',
    url: 'http://localhost:3000/reception',
    loginEmail: 'mariam.reception@ebtesamty.dev',
    fallbackEmail: 'admin@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: '22_reception_agenda_desktop',
    url: 'http://localhost:3000/reception/agenda',
    loginEmail: 'mariam.reception@ebtesamty.dev',
    fallbackEmail: 'admin@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  // Clinical Dentist Schedule & Odontogram
  {
    name: '23_dentist_schedule_desktop',
    url: 'http://localhost:3000/dentist',
    loginEmail: 'dr.sandy@ebtesamty.dev',
    fallbackEmail: 'admin@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  // Finance & Accounting Desk
  {
    name: '25_billing_desk_desktop',
    url: 'http://localhost:3000/billing',
    loginEmail: 'finance@ebtesamty.dev',
    fallbackEmail: 'admin@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  // Inventory & Purchasing
  {
    name: '26_inventory_desk_desktop',
    url: 'http://localhost:3000/inventory',
    loginEmail: 'inventory@ebtesamty.dev',
    fallbackEmail: 'admin@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: '27_purchasing_desk_desktop',
    url: 'http://localhost:3000/purchasing',
    loginEmail: 'inventory@ebtesamty.dev',
    fallbackEmail: 'admin@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  // Marketing & CRM Desk
  {
    name: '28_crm_desk_desktop',
    url: 'http://localhost:3000/crm',
    loginEmail: 'crm@ebtesamty.dev',
    fallbackEmail: 'admin@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  // Super Admin Configuration Desk
  {
    name: '29_admin_desk_desktop',
    url: 'http://localhost:3000/admin',
    loginEmail: 'sysadmin@ebtesamty.dev',
    fallbackEmail: 'admin@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  // Patient Portal Pages
  {
    name: '30_portal_dashboard_desktop',
    url: 'http://localhost:3000/portal',
    loginEmail: 'hassan.patient@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: '31_portal_appointments_desktop',
    url: 'http://localhost:3000/portal/appointments',
    loginEmail: 'hassan.patient@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: '32_portal_billing_desktop',
    url: 'http://localhost:3000/portal/billing',
    loginEmail: 'hassan.patient@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: '33_portal_intake_desktop',
    url: 'http://localhost:3000/portal/intake',
    loginEmail: 'hassan.patient@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: '34_portal_feedback_desktop',
    url: 'http://localhost:3000/portal/feedback',
    loginEmail: 'hassan.patient@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: '35_portal_check_in_desktop',
    url: 'http://localhost:3000/portal/check-in',
    loginEmail: 'hassan.patient@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  // Procurement Support Desks
  {
    name: '36_operations_equipment_desktop',
    url: 'http://localhost:3000/operations/equipment',
    loginEmail: 'admin@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: '37_supplier_portal_desktop',
    url: 'http://localhost:3000/supplier',
    loginEmail: 'admin@ebtesamty.dev',
    viewport: { width: 1440, height: 900 },
  },
];

async function capture() {
  const browser = await chromium.launch({ headless: true });
  console.log('Starting full visual capture across all 37 routes...\n');

  let successCount = 0;
  let failCount = 0;

  // 1. Capture Public Pages
  for (const r of PUBLIC_ROUTES) {
    try {
      const context = await browser.newContext({ viewport: r.viewport });
      const page = await context.newPage();
      console.log(`[Public] Capturing ${r.name} -> ${r.url}`);
      await page.goto(r.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);

      const docsPath = path.join(DOCS_DIR, `${r.name}.png`);
      const artifactPath = path.join(ARTIFACT_DIR, `${r.name}.png`);
      await page.screenshot({ path: docsPath, fullPage: false });
      fs.copyFileSync(docsPath, artifactPath);
      await context.close();
      successCount++;
    } catch (e) {
      console.error(`Error on ${r.name}:`, e.message);
      failCount++;
    }
  }

  // 2. Capture Authenticated Pages
  for (const r of AUTH_ROUTES) {
    try {
      const context = await browser.newContext({ viewport: r.viewport });

      // Attempt login
      let loginRes = await context.request.post('http://localhost:3000/api/auth/login', {
        data: { emailOrPhone: r.loginEmail, password: 'Password123!' },
      });

      if (!loginRes.ok() && r.fallbackEmail) {
        console.log(`Using fallback login for ${r.name} (${r.fallbackEmail})`);
        loginRes = await context.request.post('http://localhost:3000/api/auth/login', {
          data: { emailOrPhone: r.fallbackEmail, password: 'Password123!' },
        });
      }

      const page = await context.newPage();
      console.log(`[Auth] Capturing ${r.name} -> ${r.url}`);
      await page.goto(r.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1500); // Wait for SVG charts and data tables to render

      const docsPath = path.join(DOCS_DIR, `${r.name}.png`);
      const artifactPath = path.join(ARTIFACT_DIR, `${r.name}.png`);
      await page.screenshot({ path: docsPath, fullPage: false });
      fs.copyFileSync(docsPath, artifactPath);
      await context.close();
      successCount++;
    } catch (e) {
      console.error(`Error on ${r.name}:`, e.message);
      failCount++;
    }
  }

  await browser.close();
  console.log(`\nCapture completed: ${successCount} successful, ${failCount} failed.`);
}

capture();
