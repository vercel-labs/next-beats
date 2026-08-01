import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Genre page (/genre/[genre])', () => {
  // Initial page load (MPA): the heading reads params and streams in, so it's absent under instant().
  test('initial page load (MPA) — heading absent', async ({ page }) => {
    await page.goto('/search');
    const link = page.locator('main a[href^="/genre/"]').first();
    await link.waitFor({ state: 'visible', timeout: 15000 });
    const href = await link.getAttribute('href');
    if (!href) throw new Error('Expected the genre link to have an href');

    await instant(page, async () => {
      await page.goto(href);
      await expect(page.locator('main h1')).toHaveCount(0);
    });
  });

  // Client navigation (SPA): runtime prefetch resolves params, so the heading is present under instant().
  test('client navigation (SPA) — runtime-prefetched heading revealed', async ({ page }) => {
    await page.goto('/search');
    const link = page.locator('main a[href^="/genre/"]').first();
    await link.waitFor({ state: 'visible', timeout: 15000 });
    const href = await link.getAttribute('href');
    if (!href) throw new Error('Expected the genre link to have an href');

    await instant(page, async () => {
      await link.click();
      await page.waitForURL(url => url.pathname === href);
      await expect(page.locator('main h1')).toBeVisible();
    });
  });
});
