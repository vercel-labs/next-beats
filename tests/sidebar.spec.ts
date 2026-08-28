import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Sidebar', () => {
  test('initial page load shows nav links while playlists stream', async ({ page }) => {
    await page.goto('/');

    await instant(page, async () => {
      await page.goto('/');
      await expect(page.locator('aside a[aria-label="Home"]')).toBeVisible();
      await expect(page.locator('aside a[aria-label="Search"]')).toBeVisible();
      await expect(page.locator('aside a[aria-label="Library"]')).toBeVisible();
      await expect(page.locator('aside a[aria-label="Liked Tracks"]')).toBeVisible();
      await expect(page.locator('aside a[href^="/playlist/"]')).toHaveCount(0);
    });

    // Dynamic, cookie-gated content streams in after the shell.
    await expect(page.locator('aside a[href^="/playlist/"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('pressed navigation is optimistic before mouseup', async ({ page }) => {
    await page.goto('/');
    const home = page.locator('aside a[aria-label="Home"]');
    const search = page.locator('aside a[aria-label="Search"]');
    await expect(home).toHaveAttribute('aria-current', 'page');

    const box = await search.boundingBox();
    if (!box) throw new Error('Expected the Search link to be visible');

    await instant(page, async () => {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      try {
        await expect(search).toHaveAttribute('aria-current', 'page');
        await expect(home).not.toHaveAttribute('aria-current', 'page');
      } finally {
        await page.mouse.up();
      }
    });
  });
});
