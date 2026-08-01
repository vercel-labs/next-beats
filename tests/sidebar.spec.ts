import { instant } from '@next/playwright';
import { test, expect } from '@playwright/test';

test.describe('Sidebar', () => {
  // Initial page load (MPA): nav links are static; the cookie-dependent playlists stream in behind Suspense.
  test('initial page load (MPA) — nav links present, playlists stream in', async ({ page }) => {
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
});
