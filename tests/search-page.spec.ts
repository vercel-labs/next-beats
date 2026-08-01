import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Search page (/search)', () => {
  test('initial page load shows the search shell without the browse grid', async ({ page }) => {
    await page.goto('/');

    await instant(page, async () => {
      await page.goto('/search');
      await expect(page.locator('input[aria-label="Search tracks"]')).toBeVisible();
      await expect(page.locator('main a[href^="/genre/"]')).toHaveCount(0);
    });
  });

  test('client navigation shows the runtime-prefetched browse grid', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('aside a[aria-label="Search"]').first();
    await link.waitFor({ state: 'visible', timeout: 15000 });

    await instant(page, async () => {
      await link.click();
      await page.waitForURL(url => url.pathname === '/search');
      await expect(page.locator('main a[href^="/genre/"]').first()).toBeVisible();
    });
  });

  // Typing drives a router.replace per keystroke; the input must keep focus so every character lands.
  test('search keeps focus across soft navigations', async ({ page }) => {
    await page.goto('/search');
    const search = page.getByRole('searchbox', { name: 'Search tracks' });
    await search.waitFor({ state: 'visible', timeout: 15000 });
    await search.click();
    await page.keyboard.type('house', { delay: 150 });
    await expect(search).toBeFocused();
    await expect(search).toHaveValue('house');
  });
});
