import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Track page (/track/[id])', () => {
  // Initial page load (MPA): the title reads params and streams in, so it's absent under instant().
  test('initial page load (MPA) — title absent', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('main a[href^="/track/"]').first();
    await link.waitFor({ state: 'visible', timeout: 15000 });
    const href = await link.getAttribute('href');
    if (!href) throw new Error('Expected the track link to have an href');

    await instant(page, async () => {
      await page.goto(href);
      await expect(page.locator('main h1')).toHaveCount(0);
    });
  });

  // Client navigation (SPA): runtime prefetch resolves params, so the title is present under instant().
  test('client navigation (SPA) — runtime-prefetched title revealed', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('main a[href^="/track/"]').first();
    await link.waitFor({ state: 'visible', timeout: 15000 });
    const href = await link.getAttribute('href');
    if (!href) throw new Error('Expected the track link to have an href');

    await instant(page, async () => {
      await link.click();
      await page.waitForURL(url => url.pathname === href);
      await expect(page.locator('main h1')).toBeVisible();
    });
  });
});
