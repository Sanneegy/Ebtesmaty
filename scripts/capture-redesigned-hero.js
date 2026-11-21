const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\basan\\.gemini\\antigravity\\brain\\1c9b6d4a-8b77-4ddf-89a5-11e6e8770aa1';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

async function captureHero() {
  const browser = await chromium.launch({ headless: true });

  try {
    // 1. Desktop Initial Hero View (1440x900)
    console.log('[1/4] Capturing Desktop Initial Hero View...');
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await desktopContext.newPage();
    const res = await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Homepage status:', res.status());
    await page.waitForTimeout(2000);

    const deskTopPath = path.join(DOCS_DIR, 'hero_redesign_desktop_top.png');
    const deskTopArt = path.join(ARTIFACT_DIR, 'hero_redesign_desktop_top.png');
    await page.screenshot({ path: deskTopPath, fullPage: false });
    fs.copyFileSync(deskTopPath, deskTopArt);
    console.log('✓ Captured hero_redesign_desktop_top.png');

    // 2. Desktop Hovering Effect (Hover over Inline Smile Pill & CTA button)
    console.log('[2/4] Testing & Capturing Hover Effects...');
    // Hover over CTA button
    const cta = await page.$('text="Book a Consultation"');
    if (cta) {
      await cta.hover();
      await page.waitForTimeout(600);
    }
    const hoverPath = path.join(DOCS_DIR, 'hero_redesign_hover_effects.png');
    const hoverArt = path.join(ARTIFACT_DIR, 'hero_redesign_hover_effects.png');
    await page.screenshot({ path: hoverPath, fullPage: false });
    fs.copyFileSync(hoverPath, hoverArt);
    console.log('✓ Captured hero_redesign_hover_effects.png');

    // 3. Desktop Scrolled View (Parallax & Transition to Smile Solutions)
    console.log('[3/4] Capturing Desktop Scrolled View (Parallax & Section 2)...');
    await page.evaluate(() => window.scrollTo({ top: 450, behavior: 'instant' }));
    await page.waitForTimeout(1000);

    const scrollPath = path.join(DOCS_DIR, 'hero_redesign_desktop_scroll.png');
    const scrollArt = path.join(ARTIFACT_DIR, 'hero_redesign_desktop_scroll.png');
    await page.screenshot({ path: scrollPath, fullPage: false });
    fs.copyFileSync(scrollPath, scrollArt);
    console.log('✓ Captured hero_redesign_desktop_scroll.png');
    await desktopContext.close();

    // 4. Mobile View (390x844)
    console.log('[4/4] Capturing Mobile View...');
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
    await mobilePage.waitForTimeout(2000);

    const mobPath = path.join(DOCS_DIR, 'hero_redesign_mobile.png');
    const mobArt = path.join(ARTIFACT_DIR, 'hero_redesign_mobile.png');
    await mobilePage.screenshot({ path: mobPath, fullPage: false });
    fs.copyFileSync(mobPath, mobArt);
    console.log('✓ Captured hero_redesign_mobile.png');
    await mobileContext.close();

    console.log('\n=== ALL HERO REDESIGN SCREENSHOTS CAPTURED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Error during capture:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureHero();
