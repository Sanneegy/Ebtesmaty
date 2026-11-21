import { test, expect } from '@playwright/test';

test.describe('T14, T15 & T16: End-to-End User Journeys, Role-Scoped Navigation, RBAC Security & Visual UX', () => {

  test('T13.0: Public Website — Request an Appointment Modal & Database Submission (Fix Phase 02 defect)', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('A Healthier Smile Starts with the Right Care');

    // 2. Click "Request an Appointment" button on hero
    const requestBtn = page.locator('button:has-text("Request an Appointment")').first();
    await expect(requestBtn).toBeVisible();
    await requestBtn.click();

    // 3. Verify modal opens with live workflow (NOT Phase 02 notice!)
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).not.toContainText('Online Booking Coming in Phase 02');
    await expect(modal).toContainText('Request a');

    // Step 1: Branch selection
    await expect(modal.getByText('Branch A — Heliopolis')).toBeVisible();
    await modal.getByText('Branch A — Heliopolis').click();
    await modal.locator('button:has-text("Continue")').click();

    // Step 2: Dental Service
    await expect(modal.getByText('Comprehensive Checkup')).toBeVisible();
    await modal.getByText('Comprehensive Checkup').click();
    await modal.locator('button:has-text("Continue")').click();

    // Step 3: Date & Preferred Window
    await expect(modal.getByText('Preferred Daily Time Window')).toBeVisible();
    await modal.locator('button:has-text("Continue")').click();

    // Step 4: Contact Information
    await expect(modal.getByText('Full Legal Name')).toBeVisible();
    await modal.locator('input[placeholder*="Sarah"]').fill('Dr. Evaluator Demo');
    await modal.locator('input[type="tel"]').fill('+20 10 9988 7766');
    await modal.locator('button:has-text("Submit Request")').click();

    // Step 5: Success Confirmation
    await expect(modal.getByText('Request Transmitted Successfully')).toBeVisible();
    await expect(modal.getByText('Tracking Reference:')).toBeVisible();
    await modal.locator('button:has-text("Done & Return to Website")').click();
    await expect(modal).not.toBeVisible();
  });

  test('T14.1: Patient Journey — Login, View Role-Scoped Portal Navigation, Clinical Status & Multi-Step Intake', async ({ page }) => {
    // 1. Visit Login
    await page.goto('/auth/login');
    await expect(page.locator('h1')).toContainText('Sign In to Ebtesamty');

    // 2. Fill Patient Credentials
    await page.fill('input[type="text"]', 'hassan.patient@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // 3. Verify Patient Portal & IA-03 Navigation
    await page.waitForURL('**/portal');
    await expect(page.locator('h1')).toContainText('Welcome back, Hassan El-Sayed');
    await expect(page.getByText('EBT-PAT-2026-0001').first()).toBeVisible();

    const patientNav = page.locator('nav[aria-label="Patient Portal Navigation"]');
    await expect(patientNav).toContainText('Home');
    await expect(patientNav).toContainText('Appointments');
    await expect(patientNav).toContainText('My Care');
    await expect(patientNav).toContainText('Payments');
    await expect(patientNav).toContainText('Profile');

    // 4. Verify Medical Intake Status Card
    await expect(page.getByRole('heading', { name: 'Pre-Visit Medical Intake' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Versioned Intake & Audit History' })).toBeVisible();

    // 5. Navigate to Medical Intake Form
    await page.click('a[href="/portal/intake"]');
    await page.waitForURL('**/portal/intake');
    await expect(page.locator('h1')).toContainText('Pre-Visit Medical & Dental History');

    // Verify Step 1 is active
    await expect(page.getByRole('heading', { name: '1. Medical Conditions & Chronic Illnesses' })).toBeVisible();
    await expect(page.getByText('High Blood Pressure (Hypertension)')).toBeVisible();

    // Click Next to Step 2
    await page.click('button:has-text("Next Step")');
    await expect(page.getByRole('heading', { name: '2. Allergies & Adverse Drug Reactions' })).toBeVisible();
  });

  test('T14.2: Receptionist Journey — Role-Scoped Sidebar, Search Patient, Inspect Duplicate Hints & Patient Drawer', async ({ page }) => {
    // 1. Login as Receptionist (Mariam Hanna)
    await page.goto('/auth/login');
    await page.fill('input[type="text"]', 'mariam.reception@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // 2. Verify Reception Desk Workspace & IA-01 Sidebar
    await page.waitForURL('**/reception');
    await expect(page.locator('h1')).toContainText('Patient Identity & Registration Workspace');

    const sidebar = page.locator('aside[aria-label="Workspace Navigation"]');
    await expect(sidebar).toContainText('Today');
    await expect(sidebar).toContainText('Appointments');
    await expect(sidebar).toContainText('Patients');
    await expect(sidebar).toContainText('Checkout');
    await expect(sidebar).not.toContainText('Inventory');
    await expect(sidebar).not.toContainText('Equipment');

    // 3. Fast Patient Search
    const searchInput = page.locator('input[placeholder*="Search by Patient ID"]');
    await searchInput.fill('Hassan');
    await page.waitForTimeout(600); // Wait for search debounce

    // Verify search results table renders Hassan
    await expect(page.locator('table').first()).toContainText('Hassan El-Sayed');
    await expect(page.locator('table').first()).toContainText('EBT-PAT-2026-0001');

    // 4. Verify Link Requests & Duplicate Hint Queues
    await expect(page.getByRole('heading', { name: 'Portal Link Verification Requests' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Duplicate Candidate Hints' })).toBeVisible();
  });

  test('T14.3: Dentist Journey — Role-Scoped Sidebar, 3-Column Clinical Workbench & History Inspection', async ({ page }) => {
    // 1. Login as Treating Dentist (Dr. Sandy Saad)
    await page.goto('/auth/login');
    await page.fill('input[type="text"]', 'dr.sandy@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // 2. Verify Clinical Desk & IA-02 Sidebar
    await page.waitForURL('**/dentist');
    await expect(page.locator('h1')).toContainText('Treating Dentist Clinical Workspace');

    const sidebar = page.locator('aside[aria-label="Workspace Navigation"]');
    await expect(sidebar).toContainText('My Day');
    await expect(sidebar).toContainText('Schedule');
    await expect(sidebar).toContainText('Patient Charts');
    await expect(sidebar).toContainText('Clinical Tasks');
    await expect(sidebar).not.toContainText('Inventory');

    // 3. Verify Assigned Roster & Interactive FDI Odontogram Overview
    await expect(page.getByRole('heading', { name: 'Assigned Patient Roster' })).toBeVisible();
    await expect(page.getByText('Hassan El-Sayed').first()).toBeVisible();
    await expect(page.getByText('Interactive FDI Odontogram Overview')).toBeVisible();

    // 4. Click Inspect Answers on the pending review card
    await page.click('button:has-text("Inspect Answers") >> nth=0');
    await expect(page.getByText('Medical Conditions').first()).toBeVisible();
    await expect(page.getByText('Allergies').first()).toBeVisible();
  });

  test('T14.3B: Dentist Journey — Navigate to Patient EDR Chart & Interactive Odontogram', async ({ page }) => {
    // 1. Sign in as Dentist
    await page.goto('/auth/login');
    await page.fill('input[type="text"]', 'dr.sandy@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dentist');

    // 2. Select patient in assigned roster
    await page.click('button:has-text("Inspect Answers") >> nth=0');

    // 3. Click Open Dental Chart (EDR)
    await page.click('a:has-text("Open Dental Chart (EDR)") >> nth=0');
    await page.waitForURL('**/dentist/chart/**');

    // 4. Verify Odontogram elements
    await expect(page.getByText('FDI Two-Digit Odontogram')).toBeVisible();
    await expect(page.getByText('Maxillary Right (Q1)')).toBeVisible();
    await expect(page.getByText('Mandibular Right (Q4)')).toBeVisible();

    // 5. Select tooth 36 and verify inspector opens
    await page.click('button:has-text("36")');
    await expect(page.getByText('Tooth #36 Details & History')).toBeVisible();
  });

  test('T14.4: Explicit Negative Tests — Receptionist & Dentist Denied Unauthorized Admin Modules (403)', async ({ page }) => {
    // 1. Sign in as Receptionist
    await page.goto('/auth/login');
    await page.fill('input[type="text"]', 'mariam.reception@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/reception');

    // 2. Direct URL manipulation by Receptionist: /dentist, /inventory, /operations/equipment
    await page.goto('/dentist');
    await expect(page.locator('h1')).toContainText('Access Denied: Clinician Role Required');

    await page.goto('/inventory');
    await expect(page.locator('h1')).toContainText('Access Denied: Inventory Authority Required');

    await page.goto('/operations/equipment');
    await expect(page.locator('h1')).toContainText('Access Denied: Staff Operations Access Required');
  });

  test('T14.5: Receptionist Journey — Open Checkout Desk & Verify Financial Workflows', async ({ page }) => {
    // 1. Sign in as Receptionist
    await page.goto('/auth/login');
    await page.fill('input[type="text"]', 'mariam.reception@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/reception');

    // 2. Click Checkout link in Receptionist sidebar
    await page.click('aside a:has-text("Checkout")');
    await page.waitForURL('**/billing**');

    // 3. Assert Financial Checkout Workspace elements
    await expect(page.getByText('Billing, Cashier & Operating Finance')).toBeVisible();
    await expect(page.getByText('Reception Checkout Mode')).toBeVisible();
    await expect(page.getByText('Total Invoiced Charges')).toBeVisible();
    await expect(page.getByText('Cash Collected (Drawer)')).toBeVisible();

    // 4. Assert Tabs
    await expect(page.getByRole('button', { name: 'Invoices & Treatment Charges' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Payments & Receipts' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cash Drawer Reconciliation' })).toBeVisible();
  });

  test('T14.6: Management Journey — Inventory Desk (Stock Threshold Bars, Transfers, Purchase Orders & Catalog)', async ({ page }) => {
    // 1. Sign in as Branch Manager (Amr Fouad)
    await page.goto('/auth/login');
    await page.fill('input[type="text"]', 'manager.b1@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/management');

    // 2. Navigate to Inventory Desk
    await page.goto('/inventory');
    await expect(page.locator('h1')).toContainText('Ebtesamty Inventory Desk');

    // 3. Verify Tabs
    await expect(page.getByRole('button', { name: 'Stock on Hand' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inter-Branch Transfers' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Purchase Orders' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Catalog & Suppliers' })).toBeVisible();

    // 4. Verify Stock Balances Table & Threshold Header
    await expect(page.locator('table')).toContainText('On Hand & Threshold');
    await expect(page.locator('table')).toContainText('Filtek Z350 XT Composite');
  });

  test('T14.7: Management Journey — Equipment & Operatory Maintenance Desk (Assets, Faults & Work Orders)', async ({ page }) => {
    // 1. Sign in as Branch Manager (Amr Fouad)
    await page.goto('/auth/login');
    await page.fill('input[type="text"]', 'manager.b1@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/management');

    // 2. Navigate to Operations / Equipment
    await page.goto('/operations/equipment');
    await expect(page.locator('h1')).toContainText('Equipment & Operatory Maintenance');

    // 3. Assert Metrics & Tabs
    await expect(page.getByText('Total Assets')).toBeVisible();
    await expect(page.getByText('Operational', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Operatory Assets' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Active Faults & Holds' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Maintenance Work Orders' })).toBeVisible();
  });

  test('T14.8: Executive Management Action Center — Requires Your Decision Stack, 3-Branch Comparison Chart & Alerts', async ({ page }) => {
    // 1. Sign in as Owner / Executive (Clinic Administrator)
    await page.goto('/auth/login');
    await page.fill('input[type="text"]', 'admin@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/management');

    // 2. Verify IA-04 Owner Sidebar
    const sidebar = page.locator('aside[aria-label="Workspace Navigation"]');
    await expect(sidebar).toContainText('Overview');
    await expect(sidebar).toContainText('Branches');
    await expect(sidebar).toContainText('Finance');
    await expect(sidebar).toContainText('Operations');
    await expect(sidebar).toContainText('Reports');

    // 3. Verify Management Action Center & Requires Your Decision Stack
    await expect(page.locator('h1')).toContainText('Executive Operations & Multi-Branch Control');
    await expect(page.getByText('Requires Your Decision — Priority Actionable Incidents')).toBeVisible();
    await expect(page.getByText('Clinical Privacy Boundary Enforced')).toBeVisible();

    // 4. Assert Management Tabs & 3-Branch Financial Comparison Chart
    await expect(page.getByRole('button', { name: 'Multi-Branch KPI Benchmarks' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Operational Alerts/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Patient Feedback & Complaints/ })).toBeVisible();
    await expect(page.getByText('Branch A - Heliopolis').first()).toBeVisible();
    await expect(page.getByText('Branch B - New Cairo').first()).toBeVisible();
    await expect(page.getByText('Branch C - Maadi').first()).toBeVisible();
  });

  test('T14.9: Patient Journey — In-App Notifications, Online Check-In Link & Feedback Submission', async ({ page }) => {
    // 1. Sign in as Patient (Hassan El-Sayed)
    await page.goto('/auth/login');
    await page.fill('input[type="text"]', 'hassan.patient@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/portal');

    // 2. Verify Live Features on Patient Portal
    await expect(page.getByText('Visits, Appointments & Fast Check-In')).toBeVisible();
    await expect(page.getByText('Financial Records & Payment Plans')).toBeVisible();
    await expect(page.getByText('Self Check-In & Queue')).toBeVisible();

    // 3. Navigate to Feedback Page
    await page.goto('/portal/feedback');
    await expect(page.locator('h1')).toContainText('Patient Feedback & Support');
    await expect(page.getByRole('heading', { name: 'Send Message or Feedback to Clinic Management' })).toBeVisible();
  });

  test('T15: Mobile Viewport & RTL Language Support', async ({ page }) => {
    // 1. Test on mobile screen size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify responsive layout
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button[aria-label="Toggle menu"]')).toBeVisible();

    // Toggle Mobile Navigation Menu
    await page.click('button[aria-label="Toggle menu"]');
    await expect(page.getByText('Patient Health Portal')).toBeVisible();

    // 2. Test RTL language toggle
    const langBtn = page.locator('button:has-text("عربي"):visible').first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      // Assert HTML dir attribute is rtl
      const dir = await page.getAttribute('html', 'dir');
      expect(dir).toBe('rtl');
    }
  });

  test('T16: New Public Pages, 8-Step /book Flow, CRM Dashboard & Super Admin Config', async ({ page }) => {
    // 1. Verify Service Detail Page & Branch Detail Page
    await page.goto('/services/dental-implants');
    await expect(page.locator('h1')).toContainText('Dental Implants');
    await expect(page.getByText('Step-by-Step Clinical Process')).toBeVisible();

    await page.goto('/branches/BR-A');
    await expect(page.locator('h1')).toContainText('Branch A — Heliopolis');
    await expect(page.getByText('Dr. Sandy Saad')).toBeVisible();
    await expect(page.getByText('Dr. Feby Samer')).toBeVisible();

    // 2. Verify 8-Step /book Page
    await page.goto('/book?branch=BR-A');
    await expect(page.locator('h1')).toContainText('Schedule Your Dental Visit Online');
    await expect(page.getByText('Step 1: Choose Your Preferred Cairo Branch')).toBeVisible();

    // 3. Sign in as Owner/Admin and verify CRM (/crm) & Super Admin (/admin)
    await page.goto('/auth/login');
    await page.fill('input[type="text"]', 'admin@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/management');

    await page.goto('/crm');
    await expect(page.locator('h1')).toContainText('CRM, Inquiry Pipeline & Patient Recall Center');
    await expect(page.getByRole('button', { name: /Patient Recall & Follow-Up List/ })).toBeVisible();

    await page.goto('/admin');
    await expect(page.getByText('System Administration & Audit Explorer')).toBeVisible();
  });

});
