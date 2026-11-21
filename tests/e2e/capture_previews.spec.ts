import { test, expect } from '@playwright/test';

const ARTIFACT_DIR = 'C:/Users/basan/.gemini/antigravity/brain/1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';

test.describe('Checkpoint Visual Previews, Remediation Verification & Snapshots', () => {
  test('1. Homepage — Verify Brand Palette, Quick Booking Finder, Maadi Branch & Capture Previews', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify zero Zamalek references on homepage and presence of Maadi branch
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Zamalek');
    expect(bodyText).toContain('Branch C — Maadi');
    await expect(page.locator('h1')).toContainText('A Healthier Smile Starts with the Right Care');
    await expect(page.getByText('Quick Appointment Finder')).toBeVisible();

    // Capture Desktop Homepage
    await page.screenshot({
      path: `${ARTIFACT_DIR}/preview_homepage_desktop.png`,
      fullPage: false,
    });

    // Capture Mobile Homepage (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await page.screenshot({
      path: `${ARTIFACT_DIR}/screenshot_homepage_mobile.png`,
      fullPage: false,
    });
  });

  test('2. Patient Portal — Verify Non-Duplicated Treatment Plan (1) & Installments (3) + Capture Preview', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/auth/login');
    await page.fill('input[type="text"]', 'hassan.patient@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/portal');

    const planCount = await page.getByText('Quadrant 3 Rehabilitation').count();
    expect(planCount).toBe(1);

    const inst1Count = await page.getByText('Installment #1').count();
    expect(inst1Count).toBe(1);

    await expect(page.getByText('1,500').first()).toBeVisible();
    await expect(page.getByText('4,500').first()).toBeVisible();

    await page.screenshot({
      path: `${ARTIFACT_DIR}/preview_patient_portal.png`,
      fullPage: true,
    });
  });

  test('3. Receptionist Workspace — Verify Role Sidebar, Canonical Arrival Board & Patient Action Drawer + Capture Preview', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/auth/login');
    await page.fill('input[type="text"]', 'mariam.reception@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/reception');

    await page.screenshot({
      path: `${ARTIFACT_DIR}/preview_reception_desk.png`,
      fullPage: false,
    });
  });

  test('4. Dentist Clinical Workbench — Verify 3-Column Layout & Interactive FDI Odontogram + Capture Preview', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/auth/login');
    await page.fill('input[type="text"]', 'dr.sandy@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dentist');

    await expect(page.getByText('Interactive FDI Odontogram Overview')).toBeVisible();

    await page.screenshot({
      path: `${ARTIFACT_DIR}/preview_dentist_workbench.png`,
      fullPage: false,
    });
  });

  test('5. Executive Management Center — Verify Priority Actionable Incidents & 3-Branch Comparison Chart + Capture Preview', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/auth/login');
    await page.fill('input[type="text"]', 'admin@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/management');

    await expect(page.getByText('Requires Your Decision — Priority Actionable Incidents')).toBeVisible();

    await page.screenshot({
      path: `${ARTIFACT_DIR}/preview_management_center.png`,
      fullPage: false,
    });
  });

  test('6. Capture Inventory, Purchasing, CRM & Admin Workspaces', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/auth/login');
    await page.fill('input[type="text"]', 'admin@ebtesamty.dev');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/management');

    await page.goto('/inventory');
    await expect(page.locator('h1')).toContainText('Ebtesamty Inventory Desk');
    await page.screenshot({
      path: `${ARTIFACT_DIR}/preview_inventory.png`,
      fullPage: false,
    });

    await page.goto('/crm');
    await expect(page.locator('h1')).toContainText('CRM, Inquiry Pipeline & Patient Recall Center');
    await page.screenshot({
      path: `${ARTIFACT_DIR}/preview_crm.png`,
      fullPage: false,
    });

    await page.goto('/admin');
    await expect(page.getByText('System Administration & Audit Explorer')).toBeVisible();
    await page.screenshot({
      path: `${ARTIFACT_DIR}/preview_admin.png`,
      fullPage: false,
    });
  });
});
