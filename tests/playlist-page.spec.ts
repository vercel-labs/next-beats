import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Playlists page (/playlist)', () => {
  // Initial page load (MPA): the playlist list streams in behind Suspense, so it's absent under instant().
  test('initial page load (MPA) — playlist list absent', async ({ page }) => {
    await page.goto('/');

    await instant(page, async () => {
      await page.goto('/playlist');
      await expect(page.locator('main a[href^="/playlist/"]')).toHaveCount(0);
    });
  });

  // Client navigation (SPA): prefetch={true} resolves cookies, so the playlist list is present under instant().
  test('client navigation (SPA) — runtime-prefetched playlist list revealed', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('aside a[href="/playlist"]').first();
    await link.waitFor({ state: 'visible', timeout: 15000 });

    await instant(page, async () => {
      await link.click();
      await page.waitForURL(url => url.pathname === '/playlist');
      await expect(page.locator('main a[href^="/playlist/"]').first()).toBeVisible();
    });
  });
});
