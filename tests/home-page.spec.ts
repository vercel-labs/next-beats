import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Home page (/)', () => {
  test('initial page load shows the shell without track data', async ({ page }) => {
    await page.goto('/library');

    await instant(page, async () => {
      await page.goto('/');
      await expect(page.locator('main a[href^="/track/"]')).toHaveCount(0);
    });
  });

  test('client navigation shows the runtime-prefetched track data', async ({ page }) => {
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
