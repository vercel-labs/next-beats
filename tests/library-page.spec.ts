import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Library page (/library)', () => {
  // Initial page load (MPA): the library grid streams in behind Suspense, so it's absent under instant().
  test('initial page load (MPA) — library grid absent', async ({ page }) => {
    await page.goto('/');

    await instant(page, async () => {
      await page.goto('/library');
      await expect(page.locator('main a[href^="/track/"]')).toHaveCount(0);
    });
  });

  // Client navigation (SPA): prefetch={true} resolves cookies, so the library grid is present under instant().
  test('client navigation (SPA) — runtime-prefetched library grid revealed', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('aside a[aria-label="Library"]').first();
    await link.waitFor({ state: 'visible', timeout: 15000 });

    await instant(page, async () => {
      await link.click();
      await page.waitForURL(url => url.pathname === '/library');
      await expect(page.locator('main a[href^="/track/"]:visible').first()).toBeVisible();
    });
  });
});
