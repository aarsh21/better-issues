import { expect, test } from '@playwright/test';

test.describe('Auth pages', () => {
	test('sign-in preserves returnTo and surfaces auth errors', async ({ page }) => {
		await page.route('**/api/auth/sign-in/email', async (route) => {
			await route.fulfill({
				status: 401,
				contentType: 'application/json',
				body: JSON.stringify({
					code: 'INVALID_EMAIL_OR_PASSWORD',
					message: 'Invalid credentials'
				})
			});
		});

		await page.goto('/sign-in?returnTo=%2Forg%2Fdemo');

		await expect(page.getByRole('heading', { name: 'better-issues' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Create one' })).toHaveAttribute(
			'href',
			'/sign-up?returnTo=%2Forg%2Fdemo'
		);

		await page.getByLabel('Email or Username').fill('jane@example.com');
		await page.getByLabel('Password').fill('wrong-password');
		await page.getByRole('button', { name: 'Sign In' }).click();

		await expect(page.getByRole('alert')).toHaveText('Invalid credentials');
	});

	test('sign-up preserves returnTo and surfaces auth errors', async ({ page }) => {
		await page.route('**/api/auth/sign-up/email', async (route) => {
			await route.fulfill({
				status: 409,
				contentType: 'application/json',
				body: JSON.stringify({
					code: 'USER_ALREADY_EXISTS',
					message: 'Account already exists'
				})
			});
		});

		await page.goto('/sign-up?returnTo=%2Forg%2Fdemo');

		await expect(page.getByRole('heading', { name: 'better-issues' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
			'href',
			'/sign-in?returnTo=%2Forg%2Fdemo'
		);

		await page.getByLabel('Name', { exact: true }).fill('Jane Doe');
		await page.getByLabel('Username', { exact: true }).fill('jane_doe');
		await page.getByLabel('Email', { exact: true }).fill('jane@example.com');
		await page.getByLabel('Password', { exact: true }).fill('password123');
		await page.getByRole('button', { name: 'Create Account' }).click();

		await expect(page.getByRole('alert')).toHaveText('Account already exists');
	});
});
