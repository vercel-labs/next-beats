import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Genre page (/genre/[genre])', () => {
  test('initial page load shows the shell without the heading', async ({ page }) => {
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

  test('client navigation shows the heading resolved at prefetch time', async ({ page }) => {
    await page.goto('/search');
    const link = page.locator('main a[href^="/genre/"]').first();
    await link.waitFor({ state: 'visible', timeout: 15000 });
    const href = await link.getAttribute('href');
    if (!href) throw new Error('Expected the genre link to have an href');
    const heading = (await link.locator('span').first().textContent())?.trim();
    if (!heading) throw new Error('Expected the genre link to have a label');

    await instant(page, async () => {
      await link.click();
      await page.waitForURL(url => url.pathname === href);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    });
  });
});
