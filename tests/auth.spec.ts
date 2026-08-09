import { test, expect } from '@playwright/test';

test.describe('Auth', () => {
  // Unauthed visits redirect to /login.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('unauthed visit redirects to /login', async ({ page }) => {
    await page.goto('/library');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel('Email')).toBeVisible();
  });

  test('signing in sets cookie and redirects home', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('aurora@example.com');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/', { timeout: 15000 });
  });
});
