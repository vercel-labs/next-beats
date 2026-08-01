import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Favorites page (/favorites)', () => {
  // Initial page load (MPA): the favorites feed streams in behind Suspense, so it's absent under instant().
  test('initial page load (MPA) — favorites absent', async ({ page }) => {
    await page.goto('/');

    await instant(page, async () => {
      await page.goto('/favorites');
      await expect(page.locator('main a[href^="/track/"]')).toHaveCount(0);
    });
  });

  // Client navigation (SPA): prefetch={true} resolves cookies, so favorites are present under instant().
  test('client navigation (SPA) — runtime-prefetched favorites revealed', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('aside a[aria-label="Liked Tracks"]').first();
    await link.waitFor({ state: 'visible', timeout: 15000 });

    await instant(page, async () => {
      await link.click();
      await page.waitForURL(url => url.pathname === '/favorites');
      await expect(page.locator('main a[href^="/track/"]').first()).toBeVisible();
    });
  });
});
