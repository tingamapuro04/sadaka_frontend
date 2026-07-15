import { test, expect } from '@playwright/test';

test('home route renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Give with M-Pesa')).toBeVisible();
  await expect(page.getByLabel(/search for a church/i)).toBeVisible();
});
