import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Playlists page (/playlist)', () => {
  test('initial page load shows the shell without the playlist list', async ({ page }) => {
    await page.goto('/');

    await instant(page, async () => {
      await page.goto('/playlist');
      await expect(page.locator('main a[href^="/playlist/"]')).toHaveCount(0);
    });
  });

  test('client navigation shows the playlist list resolved at prefetch time', async ({ page }) => {
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
