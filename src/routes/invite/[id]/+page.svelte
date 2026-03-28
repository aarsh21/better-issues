<script lang="ts">
	import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import MailIcon from '@lucide/svelte/icons/mail';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';

	import type { PageProps } from './$types';
	import {
		acceptInvitation,
		getInvitation,
		rejectInvitation,
		type OrganizationInvitation
	} from '$lib/organization';
	import { gotoResolvedPath } from '$lib/goto-resolved';
	import ModeToggle from '$lib/components/mode-toggle.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	let { params, data: _data }: PageProps = $props();

	let invitation = $state<OrganizationInvitation | null | undefined>(undefined);
	let loading = $state(true);

	let outcome = $state<'accepted' | 'rejected' | null>(null);
	let actionError = $state<string | null>(null);

	let accepting = $state(false);
	let rejecting = $state(false);

	let redirectTimer: ReturnType<typeof setTimeout> | undefined;
	let initialized = false;

	$effect(() => {
		if (initialized) return;
		initialized = true;

		void (async () => {
			try {
				const data = await getInvitation(params.id);
				invitation = data;
			} catch {
				invitation = null;
			} finally {
				loading = false;
			}
		})();

		return () => {
			if (redirectTimer !== undefined) {
				clearTimeout(redirectTimer);
			}
		};
	});

	async function handleAccept() {
		actionError = null;
		accepting = true;
		try {
			await acceptInvitation(params.id);
			outcome = 'accepted';
			redirectTimer = setTimeout(() => {
				void gotoResolvedPath('/org');
			}, 1_500);
		} catch (e) {
			outcome = null;
			actionError = e instanceof Error ? e.message : 'Failed to accept invitation';
		} finally {
			accepting = false;
		}
	}

	async function handleReject() {
		actionError = null;
		rejecting = true;
		try {
			await rejectInvitation(params.id);
			outcome = 'rejected';
		} catch (e) {
			outcome = null;
			actionError = e instanceof Error ? e.message : 'Failed to reject invitation';
		} finally {
			rejecting = false;
		}
	}

	function goOrg() {
		void gotoResolvedPath('/org');
	}

	function goSignIn() {
		void gotoResolvedPath('/sign-in');
	}
</script>

<div class="flex h-svh flex-col items-center justify-center bg-background px-4">
	<div class="absolute top-4 right-4">
		<ModeToggle />
	</div>
	<div class="mb-6 text-center">
		<h1 class="text-base font-bold tracking-tight">better-issues</h1>
		<p class="text-xs text-muted-foreground">Issue tracking for small teams</p>
	</div>

	{#if loading}
		<Card.Root class="w-full max-w-sm">
			<Card.Header class="items-center text-center">
				<Loader2Icon class="h-6 w-6 animate-spin text-muted-foreground" />
				<Card.Title class="text-sm">Loading invitation...</Card.Title>
			</Card.Header>
		</Card.Root>
	{:else if !invitation}
		<Card.Root class="w-full max-w-sm">
			<Card.Header class="items-center text-center">
				<XCircleIcon class="h-8 w-8 text-destructive" />
				<Card.Title class="text-sm">Invitation not found</Card.Title>
				<Card.Description>
					This invitation may have expired, been cancelled, or doesn’t exist.
				</Card.Description>
			</Card.Header>
			<Card.Footer class="justify-center pb-4">
				<Button variant="outline" size="sm" onclick={goOrg}>Go to dashboard</Button>
			</Card.Footer>
		</Card.Root>
	{:else if invitation.status !== 'pending'}
		<Card.Root class="w-full max-w-sm">
			<Card.Header class="items-center text-center">
				{#if invitation.status === 'accepted'}
					<CheckCircleIcon class="h-8 w-8 text-chart-1" />
				{:else}
					<XCircleIcon class="h-8 w-8 text-muted-foreground" />
				{/if}
				<Card.Title class="text-sm">Invitation {invitation.status}</Card.Title>
				<Card.Description>
					This invitation has already been {invitation.status}.
				</Card.Description>
			</Card.Header>
			<Card.Footer class="justify-center pb-4">
				<Button variant="outline" size="sm" onclick={goOrg}>Go to dashboard</Button>
			</Card.Footer>
		</Card.Root>
	{:else if outcome === 'accepted'}
		<Card.Root class="w-full max-w-sm">
			<Card.Header class="items-center text-center">
				<CheckCircleIcon class="h-8 w-8 text-green-600" />
				<Card.Title class="text-sm">Invitation accepted</Card.Title>
				<Card.Description>Redirecting to your dashboard...</Card.Description>
			</Card.Header>
		</Card.Root>
	{:else if outcome === 'rejected'}
		<Card.Root class="w-full max-w-sm">
			<Card.Header class="items-center text-center">
				<XCircleIcon class="h-8 w-8 text-muted-foreground" />
				<Card.Title class="text-sm">Invitation declined</Card.Title>
				<Card.Description>You have declined this invitation.</Card.Description>
			</Card.Header>
			<Card.Footer class="justify-center pb-4">
				<Button variant="outline" size="sm" onclick={goSignIn}>Go home</Button>
			</Card.Footer>
		</Card.Root>
	{:else}
		<Card.Root class="w-full max-w-sm">
			<Card.Header class="items-center text-center">
				<MailIcon class="h-8 w-8 text-muted-foreground" />
				<Card.Title class="text-sm">You’ve been invited</Card.Title>
				<Card.Description>
					{#if invitation.expiresAt}
						You’ve been invited to join as <strong>{invitation.role}</strong>. This invitation
						expires on {new Date(invitation.expiresAt).toLocaleDateString()}.
					{:else}
						You’ve been invited to join as <strong>{invitation.role}</strong>.
					{/if}
				</Card.Description>
			</Card.Header>
			{#if actionError}
				<Card.Content class="pt-0">
					<p class="text-center text-xs text-destructive" role="alert">{actionError}</p>
				</Card.Content>
			{/if}
			<Card.Footer class="justify-center gap-3 pb-4">
				<Button
					variant="outline"
					size="sm"
					onclick={() => void handleReject()}
					disabled={rejecting || accepting}
				>
					{rejecting ? 'Declining...' : 'Decline'}
				</Button>
				<Button size="sm" onclick={() => void handleAccept()} disabled={accepting || rejecting}>
					{accepting ? 'Accepting...' : 'Accept Invitation'}
				</Button>
			</Card.Footer>
		</Card.Root>
	{/if}
</div>
