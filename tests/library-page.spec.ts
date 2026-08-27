import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Library page (/library)', () => {
  test('initial page load shows the shell without the library grid', async ({ page }) => {
    await page.goto('/');

    await instant(page, async () => {
      await page.goto('/library');
      await expect(page.locator('main a[href^="/track/"]')).toHaveCount(0);
    });
  });

  test('client navigation shows the library grid resolved at prefetch time', async ({ page }) => {
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
