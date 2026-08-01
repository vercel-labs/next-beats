import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Playlist detail page (/playlist/[id])', () => {
  // Initial page load (MPA): the detail reads params and streams in, so it's absent under instant().
  test('initial page load (MPA) — detail absent', async ({ page }) => {
    await page.goto('/playlist');
    const link = page.locator('main a[href^="/playlist/"]').first();
    await link.waitFor({ state: 'visible', timeout: 15000 });
    const href = await link.getAttribute('href');
    if (!href) throw new Error('Expected the playlist link to have an href');

    await instant(page, async () => {
      await page.goto(href);
      await expect(page.locator('main h1')).toHaveCount(0);
    });
  });

  // Client navigation (SPA): runtime prefetch resolves params, so the detail is present under instant().
  test('client navigation (SPA) — runtime-prefetched detail revealed', async ({ page }) => {
    await page.goto('/playlist');
    const link = page.locator('main a[href^="/playlist/"]').first();
    await link.waitFor({ state: 'visible', timeout: 15000 });
    const href = await link.getAttribute('href');
    if (!href) throw new Error('Expected the playlist link to have an href');

    await instant(page, async () => {
      await link.click();
      await page.waitForURL(url => url.pathname === href);
      await expect(page.locator('main h1')).toBeVisible();
    });
  });
});
