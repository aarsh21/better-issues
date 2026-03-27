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

	let { data }: PageProps = $props();

	let name = $state('');
	let username = $state('');
	let email = $state('');
	let password = $state('');
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
				name: name.trim(),
				username: username.trim(),
				email: email.trim(),
				password
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

<div class="flex min-h-svh items-center justify-center p-4">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
			<Card.Title>Create account</Card.Title>
		</Card.Header>
		<Card.Content>
			<form class="flex flex-col gap-4" onsubmit={onSubmit}>
				<div class="flex flex-col gap-2">
					<Label for="sign-up-name">Name</Label>
					<Input
						id="sign-up-name"
						name="name"
						type="text"
						autocomplete="name"
						bind:value={name}
						required
						disabled={submitting}
					/>
				</div>
				<div class="flex flex-col gap-2">
					<Label for="sign-up-username">Username</Label>
					<Input
						id="sign-up-username"
						name="username"
						type="text"
						autocomplete="username"
						bind:value={username}
						required
						disabled={submitting}
					/>
				</div>
				<div class="flex flex-col gap-2">
					<Label for="sign-up-email">Email</Label>
					<Input
						id="sign-up-email"
						name="email"
						type="email"
						autocomplete="email"
						bind:value={email}
						required
						disabled={submitting}
					/>
				</div>
				<div class="flex flex-col gap-2">
					<Label for="sign-up-password">Password</Label>
					<Input
						id="sign-up-password"
						name="password"
						type="password"
						autocomplete="new-password"
						bind:value={password}
						required
						disabled={submitting}
					/>
				</div>
				{#if errorMessage}
					<p class="text-xs text-destructive" role="alert">{errorMessage}</p>
				{/if}
				<Button type="submit" class="w-full" disabled={submitting}>
					{submitting ? 'Creating account…' : 'Sign up'}
				</Button>
			</form>
		</Card.Content>
		<Card.Footer class="justify-center gap-1 border-t-0 pt-0">
			<span class="text-muted-foreground">Already have an account?</span>
			<Button variant="link" class="h-auto p-0" href={signInHref}>Sign in</Button>
		</Card.Footer>
	</Card.Root>
</div>
