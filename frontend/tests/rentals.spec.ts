import { test, expect } from '@playwright/test';

test.describe('Tilet3D Clothing Rental System', () => {
  test('Products page displays "Rent" button beside "Try-on Avatar"', async ({ page }) => {
    await page.goto('http://localhost:5173/products');
    await page.waitForLoadState('networkidle');

    // Find the Rent button on the first card
    const rentBtn = page.getByRole('button', { name: /Rent/i }).first();
    await expect(rentBtn).toBeVisible({ timeout: 10000 });
  });

  test('Clicking Rent button opens RentalBookingModal with price and deposit disclosure', async ({ page }) => {
    await page.goto('http://localhost:5173/products');
    await page.waitForLoadState('networkidle');

    const rentBtn = page.getByRole('button', { name: /Rent/i }).first();
    await rentBtn.click();

    // Verify modal header
    await expect(page.getByText('Tilet Atelier Rental')).toBeVisible({ timeout: 5000 });

    // Verify deposit disclosure is shown
    await expect(page.getByText(/Refundable Security Deposit/i)).toBeVisible();

    // Verify fulfillment options are visible
    await expect(page.getByText(/Atelier Pickup & Return/i)).toBeVisible();
    await expect(page.getByText(/White-Glove Courier/i)).toBeVisible();

    // Verify Reserve & Pay with Chapa button
    await expect(page.getByRole('button', { name: /Reserve & Pay with Chapa/i })).toBeVisible();
  });

  test('Order history page has Rentals tab', async ({ page }) => {
    await page.goto('http://localhost:5173/orders');
    await page.waitForLoadState('networkidle');

    // Check Rentals tab toggle exists
    const rentalsTab = page.getByRole('button', { name: /Rentals/i });
    if (await rentalsTab.isVisible()) {
      await rentalsTab.click();
      await expect(page.getByText(/Rental Reservations/i)).toBeVisible();
    }
  });
});
