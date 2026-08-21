import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Track page (/track/[id])', () => {
  test('initial page load shows the shell without the title', async ({ page }) => {
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

  test('client navigation defers recommendations until navigation', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('main a[href^="/track/"]').first();
    await link.waitFor({ state: 'visible', timeout: 15000 });
    const href = await link.getAttribute('href');
    if (!href) throw new Error('Expected the track link to have an href');
    const heading = (await link.locator('span').first().textContent())?.trim();
    if (!heading) throw new Error('Expected the track link to have a label');

    await instant(page, async () => {
      await link.click();
      await page.waitForURL(url => url.pathname === href);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await expect(page.getByTestId('recommended-tracks')).toHaveCount(0);
    });

    await expect(page.getByTestId('recommended-tracks')).toBeVisible();
  });
});
