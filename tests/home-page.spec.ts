import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Home page (/)', () => {
  // Initial page load (MPA): the track feeds stream in behind Suspense, so they're absent under instant().
  test('initial page load (MPA) — track data absent', async ({ page }) => {
    await page.goto('/library');

    await instant(page, async () => {
      await page.goto('/');
      await expect(page.locator('main a[href^="/track/"]')).toHaveCount(0);
    });
  });

  // Client navigation (SPA): prefetch={true} resolves cookies, so the track feeds are present under instant().
  test('client navigation (SPA) — runtime-prefetched track data revealed', async ({ page }) => {
    await page.goto('/library');
    const link = page.locator('aside a[aria-label="Home"]').first();
    await link.waitFor({ state: 'visible', timeout: 15000 });

    await instant(page, async () => {
      await link.click();
      await page.waitForURL(url => url.pathname === '/');
      await expect(page.locator('main a[href^="/track/"]').first()).toBeVisible();
    });
  });
});
