<script lang="ts">
	import type { PageProps } from './$types';

	import { authClient } from '$lib/auth-client';
	import { SIGN_IN_PATH } from '$lib/auth-routing';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { gotoResolvedPath } from '$lib/goto-resolved';

	let { data }: PageProps = $props();

	let errorMessage = $state<string | null>(null);
	let signingOut = $state(false);

	async function onSignOut() {
		errorMessage = null;
		signingOut = true;

		try {
			const result = await authClient.signOut();

			if (result.error) {
				errorMessage = result.error.message ?? 'Could not sign out.';
				return;
			}

			await gotoResolvedPath(SIGN_IN_PATH);
		} catch (e) {
			errorMessage = e instanceof Error ? e.message : 'Could not sign out.';
		} finally {
			signingOut = false;
		}
	}
</script>

<div class="flex min-h-svh items-center justify-center p-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title>Organization</Card.Title>
		</Card.Header>
		<Card.Content class="flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Signed in as</span>
				<p class="text-sm font-medium">{data.currentUser.name}</p>
				<p class="text-xs text-muted-foreground">{data.currentUser.email}</p>
			</div>
			{#if errorMessage}
				<p class="text-xs text-destructive" role="alert">{errorMessage}</p>
			{/if}
			<Button
				type="button"
				variant="outline"
				class="w-fit"
				disabled={signingOut}
				onclick={onSignOut}
			>
				{signingOut ? 'Signing out…' : 'Sign out'}
			</Button>
		</Card.Content>
	</Card.Root>
</div>
