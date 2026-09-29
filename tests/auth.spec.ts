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

  test('signing in creates an opaque guest session and redirects home', async ({ context, page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('aurora@example.com');
    await page.getByRole('button', { name: /continue as guest/i }).click();
    await expect(page).toHaveURL('/', { timeout: 15000 });

    const session = (await context.cookies()).find(cookie => cookie.name === 'beats-user');
    expect(session?.httpOnly).toBe(true);
    expect(session?.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(session?.value).not.toBe('e2e');
  });

  test('reusing an email creates a separate session for the shared guest', async ({ context, page }) => {
    const email = `repeat-${Date.now()}@example.com`;

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: /continue as guest/i }).click();
    await expect(page).toHaveURL('/', { timeout: 15000 });
    const firstSession = (await context.cookies()).find(cookie => cookie.name === 'beats-user')?.value;

    await context.clearCookies();
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: /continue as guest/i }).click();
    await expect(page).toHaveURL('/', { timeout: 15000 });
    const secondSession = (await context.cookies()).find(cookie => cookie.name === 'beats-user')?.value;

    expect(firstSession).toBeTruthy();
    expect(secondSession).toBeTruthy();
    expect(secondSession).not.toBe(firstSession);
  });
});
