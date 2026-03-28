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

	let { data }: PageProps = $props();

	let form = $state({
		name: '',
		username: '',
		email: '',
		password: ''
	});
	let errorMessage = $state<string | null>(null);
	let submitting = $state(false);

	const destination = $derived(data.returnTo ?? DEFAULT_AUTHENTICATED_PATH);

	const signInHref = $derived(
		data.returnTo
			? `${resolve('/sign-in')}?returnTo=${encodeURIComponent(data.returnTo)}`
			: resolve('/sign-in')
	);

	async function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = null;
		submitting = true;

		try {
			const result = await authClient.signUp.email({
				name: form.name.trim(),
				username: form.username.trim(),
				email: form.email.trim(),
				password: form.password
			});

			if (result.error) {
				errorMessage = result.error.message ?? 'Could not create account.';
				return;
			}

			await gotoResolvedPath(destination);
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Could not create account.';
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
				<Label for="sign-up-name" class="text-xs">Name</Label>
				<Input
					id="sign-up-name"
					name="name"
					type="text"
					placeholder="Jane Doe"
					autocomplete="name"
					bind:value={form.name}
					required
					disabled={submitting}
				/>
			</div>
			<div class="space-y-1.5">
				<Label for="sign-up-username" class="text-xs">Username</Label>
				<Input
					id="sign-up-username"
					name="username"
					type="text"
					placeholder="jane_doe"
					autocomplete="username"
					bind:value={form.username}
					required
					disabled={submitting}
				/>
			</div>
			<div class="space-y-1.5">
				<Label for="sign-up-email" class="text-xs">Email</Label>
				<Input
					id="sign-up-email"
					name="email"
					type="email"
					placeholder="you@example.com"
					autocomplete="email"
					bind:value={form.email}
					required
					disabled={submitting}
				/>
			</div>
			<div class="space-y-1.5">
				<Label for="sign-up-password" class="text-xs">Password</Label>
				<Input
					id="sign-up-password"
					name="password"
					type="password"
					placeholder="••••••••"
					autocomplete="new-password"
					bind:value={form.password}
					required
					disabled={submitting}
				/>
			</div>
			{#if errorMessage}
				<p class="text-xs text-destructive" role="alert">{errorMessage}</p>
			{/if}
			<Button type="submit" class="w-full" size="sm" disabled={submitting}>
				{submitting ? 'Creating account...' : 'Create Account'}
			</Button>
		</form>
		<p class="pt-3 text-center text-xs text-muted-foreground">
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- `signInHref` uses `resolve()` plus optional `returnTo` -->
			Already have an account?
			<a class="text-foreground underline underline-offset-4" href={signInHref}>Sign in</a>
		</p>
	</div>
</div>
