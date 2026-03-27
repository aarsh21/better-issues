<script lang="ts">
	import type { PageProps } from './$types';

	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth-client';
	import { DEFAULT_AUTHENTICATED_PATH } from '$lib/auth-routing';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { gotoResolvedPath } from '$lib/goto-resolved';
	import { publicEnv } from '$lib/public-env';

	let { data }: PageProps = $props();

	let identifier = $state('');
	let password = $state('');
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
			const trimmed = identifier.trim();
			const result = trimmed.includes('@')
				? await authClient.signIn.email({
						email: trimmed,
						password
					})
				: await authClient.signIn.username({
						username: trimmed,
						password
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

<div class="flex min-h-svh items-center justify-center p-4">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
			<Card.Title>Sign in</Card.Title>
		</Card.Header>
		<Card.Content>
			<form class="flex flex-col gap-4" onsubmit={onSubmit}>
				<div class="flex flex-col gap-2">
					<Label for="sign-in-identifier">Email or username</Label>
					<Input
						id="sign-in-identifier"
						name="identifier"
						type="text"
						autocomplete="username"
						bind:value={identifier}
						required
						disabled={submitting}
						aria-invalid={errorMessage ? true : undefined}
					/>
				</div>
				<div class="flex flex-col gap-2">
					<Label for="sign-in-password">Password</Label>
					<Input
						id="sign-in-password"
						name="password"
						type="password"
						autocomplete="current-password"
						bind:value={password}
						required
						disabled={submitting}
						aria-invalid={errorMessage ? true : undefined}
					/>
				</div>
				{#if errorMessage}
					<p class="text-xs text-destructive" role="alert">{errorMessage}</p>
				{/if}
				<Button type="submit" class="w-full" disabled={submitting}>
					{submitting ? 'Signing in…' : 'Sign in'}
				</Button>
			</form>
		</Card.Content>
		{#if publicEnv.allowSignups}
			<Card.Footer class="justify-center gap-1 border-t-0 pt-0">
				<span class="text-muted-foreground">No account?</span>
				<Button variant="link" class="h-auto p-0" href={signUpHref}>Create one</Button>
			</Card.Footer>
		{/if}
	</Card.Root>
</div>
