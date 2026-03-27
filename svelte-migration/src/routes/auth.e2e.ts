import { expect, test } from '@playwright/test';

test.describe.serial('auth flow', () => {
	test('redirects guests away from protected routes', async ({ page }) => {
		await page.goto('/org');

		await expect(page).toHaveURL(/\/sign-in\?returnTo=%2Forg$/);
		await expect(page.getByLabel('Email or username')).toBeVisible();
	});

	test('navigates from sign-in to sign-up while preserving returnTo', async ({ page }) => {
		await page.goto('/sign-in?returnTo=%2Forg');

		await page.getByRole('link', { name: 'Create one' }).click();
		await expect(page).toHaveURL(/\/sign-up\?returnTo=%2Forg$/);
		await expect(page.getByLabel(/^Name$/)).toBeVisible();
		await expect(page.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
			'href',
			'/sign-in?returnTo=%2Forg'
		);
	});
});
