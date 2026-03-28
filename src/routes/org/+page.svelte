<script lang="ts">
	import type { PageProps } from './$types';

	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import PlusIcon from '@lucide/svelte/icons/plus';

	import {
		listOrganizations,
		setActiveOrganization,
		type OrganizationSummary
	} from '$lib/organization';
	import { gotoResolvedPath } from '$lib/goto-resolved';
	import CreateOrgDialog from '$lib/components/create-org-dialog.svelte';
	import ModeToggle from '$lib/components/mode-toggle.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';

	let { data: _data }: PageProps = $props();

	let createOpen = $state(false);

	let orgs = $state<OrganizationSummary[] | null>(null);
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let initialized = false;

	async function handleTeamClick(slug: string) {
		await gotoResolvedPath(`/org/${slug}`);
		await setActiveOrganization({ organizationSlug: slug });
	}

	$effect(() => {
		if (initialized) return;
		initialized = true;

		void (async () => {
			try {
				const list = await listOrganizations();
				orgs = list;
				if (list.length === 1 && list[0]) {
					await handleTeamClick(list[0].slug);
				}
			} catch (e) {
				loadError = e instanceof Error ? e.message : 'Failed to load teams';
				orgs = [];
			} finally {
				loading = false;
			}
		})();
	});
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center justify-between border-b border-border px-6 py-3">
		<h1 class="text-sm font-bold tracking-tight">better-issues</h1>
		<div class="flex items-center gap-2">
			<ModeToggle />
			<Button size="sm" class="gap-1.5" onclick={() => (createOpen = true)}>
				<PlusIcon class="h-3.5 w-3.5" />
				New Team
			</Button>
		</div>
	</div>

	<div class="flex-1 p-6">
		<div class="mx-auto max-w-2xl">
			<h2 class="mb-1 text-lg font-medium">Your Teams</h2>
			<p class="mb-6 text-sm text-muted-foreground">
				Select a team to view its issues, or create a new one.
			</p>

			{#if loadError}
				<p class="text-sm text-destructive" role="alert">{loadError}</p>
			{:else if loading}
				<div class="space-y-2">
					{#each [0, 1, 2] as i (i)}
						<Skeleton class="h-16 w-full" />
					{/each}
				</div>
			{:else if orgs && orgs.length > 0}
				<div class="space-y-2">
					{#each orgs as org (org.id)}
						<button
							type="button"
							class="flex w-full cursor-pointer items-center justify-between border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
							onclick={() => void handleTeamClick(org.slug)}
						>
							<div>
								<p class="font-medium">{org.name}</p>
								<p class="font-mono text-xs text-muted-foreground">/{org.slug}</p>
							</div>
							<ArrowRightIcon class="h-4 w-4 text-muted-foreground" />
						</button>
					{/each}
				</div>
			{:else}
				<div
					class="flex flex-col items-center justify-center border border-dashed border-border p-12 text-center"
				>
					<p class="mb-1 text-sm font-medium">No teams yet</p>
					<p class="mb-4 text-xs text-muted-foreground">
						Create your first team to start tracking issues.
					</p>
					<Button size="sm" class="gap-1.5" onclick={() => (createOpen = true)}>
						<PlusIcon class="h-3.5 w-3.5" />
						Create Team
					</Button>
				</div>
			{/if}
		</div>
	</div>

	<CreateOrgDialog bind:open={createOpen} />
</div>
