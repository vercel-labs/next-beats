import { test, expect } from '@playwright/test';

test.describe('Auth', () => {
  // Unauthed visits redirect to /login.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('unauthed visit redirects to /login', async ({ page }) => {
    await page.goto('/library');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('stale session redirects when private data verifies the user', async ({ context, page }) => {
    await context.addCookies([
      {
        domain: 'localhost',
        name: 'beats-user',
        path: '/',
        value: 'missing-user',
      },
    ]);

    await page.goto('/favorites');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('signing in sets cookie and redirects home', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('aurora@example.com');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/', { timeout: 15000 });
  });
});
