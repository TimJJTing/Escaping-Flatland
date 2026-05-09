import { expect, test } from '@playwright/test';

test('home page has app', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('css=app')).toBeVisible();
});
