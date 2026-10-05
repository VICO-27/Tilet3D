import { test, expect } from '@playwright/test';

test.describe('Tilet3D Basic Flows', () => {
  test('App loads successfully and shows 3D Canvas', async ({ page }) => {
    // Note: requires dev server to be running on 5173
    await page.goto('http://localhost:5173');
    
    // Check title or main elements
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
  });

  test('Navigation to Auth Modals', async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Open user modal
    const userBtn = page.locator('button.user-menu-trigger').first();
    if (await userBtn.isVisible()) {
        await userBtn.click();
        await expect(page.getByText('Sign In')).toBeVisible();
    }
  });

  test('Cart State', async ({ page }) => {
    await page.goto('http://localhost:5173');
    const cartBtn = page.locator('button.cart-trigger').first();
    if (await cartBtn.isVisible()) {
        await cartBtn.click();
        await expect(page.getByText('Your Cart')).toBeVisible();
    }
  });
});
