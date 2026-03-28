<script lang="ts">
	import type { PageProps } from './$types';

	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth-client';
	import { DEFAULT_AUTHENTICATED_PATH } from '$lib/auth-routing';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import ModeToggle from '$lib/components/mode-toggle.svelte';
	import { gotoResolvedPath } from '$lib/goto-resolved';
	import { publicEnv } from '$lib/public-env';

	let { data }: PageProps = $props();

	let form = $state({
		identifier: '',
		password: ''
	});
	let errorMessage = $state<string | null>(null);
	let submitting = $state(false);

	const destination = $derived(data.returnTo ?? DEFAULT_AUTHENTICATED_PATH);

	const signUpHref = $derived(
		data.returnTo
			? `${resolve('/sign-up')}?returnTo=${encodeURIComponent(data.returnTo)}`
			: resolve('/sign-up')
	);

	async function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = null;
		submitting = true;

		try {
			const trimmed = form.identifier.trim();
			const result = trimmed.includes('@')
				? await authClient.signIn.email({
						email: trimmed,
						password: form.password
					})
				: await authClient.signIn.username({
						username: trimmed,
						password: form.password
					});

			if (result.error) {
				errorMessage = result.error.message ?? 'Could not sign in.';
				return;
			}

			await gotoResolvedPath(destination);
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Could not sign in.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex h-svh items-center justify-center bg-background">
	<div class="w-full max-w-sm p-8">
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="text-base font-bold tracking-tight">better-issues</h1>
				<p class="text-xs text-muted-foreground">Issue tracking for small teams</p>
			</div>
			<ModeToggle />
		</div>
		<form class="space-y-3" onsubmit={onSubmit}>
			<div class="space-y-1.5">
				<Label for="sign-in-identifier" class="text-xs">Email or Username</Label>
				<Input
					id="sign-in-identifier"
					name="identifier"
					type="text"
					placeholder="you@example.com or jane_doe"
					autocomplete="username"
					bind:value={form.identifier}
					required
					disabled={submitting}
					aria-invalid={errorMessage ? true : undefined}
				/>
			</div>
			<div class="space-y-1.5">
				<Label for="sign-in-password" class="text-xs">Password</Label>
				<Input
					id="sign-in-password"
					name="password"
					type="password"
					placeholder="••••••••"
					autocomplete="current-password"
					bind:value={form.password}
					required
					disabled={submitting}
					aria-invalid={errorMessage ? true : undefined}
				/>
			</div>
			{#if errorMessage}
				<p class="text-xs text-destructive" role="alert">{errorMessage}</p>
			{/if}
			<Button type="submit" class="w-full" size="sm" disabled={submitting}>
				{submitting ? 'Signing in...' : 'Sign In'}
			</Button>
		</form>
		{#if !publicEnv.allowSignups}
			<p class="pt-3 text-center text-xs text-muted-foreground">
				Sign ups are disabled by the admin.
			</p>
		{:else}
			<p class="pt-3 text-center text-xs text-muted-foreground">
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- `signUpHref` uses `resolve()` plus optional `returnTo` -->
				Need an account?
				<a class="text-foreground underline underline-offset-4" href={signUpHref}>Create one</a>
			</p>
		{/if}
	</div>
</div>
