<script lang="ts">
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { resolve } from '$app/paths';
	import { usePaginatedQuery, useQuery } from '@mmailaender/convex-svelte';

	import { api } from '$convex/_generated/api';
	import { Button } from '$lib/components/ui/button';
	import { getIssueListSnapshot, setIssueListSnapshot } from '$lib/issue-snapshot-cache';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Spinner } from '$lib/components/ui/spinner';

	import FilterBar from './filter-bar.svelte';
	import IssueRow from './issue-row.svelte';

	import type { IssueStatus } from './issue-status';

	let {
		slug,
		organizationId,
		statusFilter,
		onStatusChange
	}: {
		slug: string;
		organizationId: string | undefined;
		statusFilter: IssueStatus | undefined;
		onStatusChange: (status: IssueStatus | undefined) => void;
	} = $props();

	const paginated = usePaginatedQuery(
		api.issues.list,
		() =>
			organizationId
				? { organizationId, status: statusFilter }
				: 'skip',
		() => ({ initialNumItems: 25 })
	);

	const labelsQuery = useQuery(
		api.labels.list,
		() => (organizationId ? { organizationId } : 'skip')
	);

	const cachedResults = $derived(
		organizationId ? getIssueListSnapshot(organizationId, statusFilter) : undefined
	);
	const displayResults = $derived(
		paginated.results.length > 0 || paginated.status !== 'LoadingFirstPage'
			? paginated.results
			: (cachedResults ?? [])
	);
	const listStatus = $derived(paginated.status);
	const labels = $derived(labelsQuery.data ?? []);

	const isInitialLoading = $derived(
		!organizationId ||
			(listStatus === 'LoadingFirstPage' && displayResults.length === 0)
	);

	$effect(() => {
		if (organizationId && paginated.results.length > 0 && listStatus !== 'LoadingFirstPage') {
			setIssueListSnapshot(organizationId, statusFilter, paginated.results);
		}
	});

	const newIssueHref = $derived(resolve(`/org/${slug}/issues/new` as '/'));
</script>

<div class="flex h-full flex-col">
	<div class="border-border flex items-center justify-between border-b px-4 py-3">
		<div class="flex items-center gap-4">
			<h1 class="text-sm font-bold">Issues</h1>
			{#if !isInitialLoading && displayResults.length > 0}
				<span class="text-muted-foreground font-mono text-xs">
					{displayResults.length}{listStatus === 'CanLoadMore' ? '+' : ''}
				</span>
			{/if}
			<FilterBar activeStatus={statusFilter} onStatusChange={onStatusChange} />
		</div>
		<Button href={newIssueHref} size="sm" class="gap-1.5">
			<PlusIcon class="h-3.5 w-3.5" />
			New Issue
		</Button>
	</div>

	<ScrollArea class="flex-1">
		{#if isInitialLoading}
			<div class="space-y-0">
				{#each Array.from({ length: 8 }, (_, row) => row) as row (row)}
					<div class="border-border flex items-center gap-3 border-b px-4 py-3">
						<Skeleton class="h-4 w-4" />
						<Skeleton class="h-4 w-10" />
						<Skeleton class="h-4 flex-1" />
						<Skeleton class="h-4 w-4" />
					</div>
				{/each}
			</div>
		{:else if displayResults.length === 0}
			<div class="flex flex-col items-center justify-center p-16 text-center">
				<p class="mb-1 text-sm font-medium">No issues yet</p>
				<p class="text-muted-foreground mb-4 text-xs">
					{statusFilter
						? 'No issues match the current filter.'
						: 'Create your first issue to get started.'}
				</p>
				{#if !statusFilter}
					<Button href={newIssueHref} size="sm" class="gap-1.5">
						<PlusIcon class="h-3.5 w-3.5" />
						New Issue
					</Button>
				{/if}
			</div>
		{:else}
			<div>
				{#each displayResults as issue (issue._id)}
					<IssueRow {slug} {issue} labels={labels} />
				{/each}

				{#if listStatus === 'CanLoadMore'}
					<div class="border-border flex justify-center border-b py-3">
						<Button
							variant="ghost"
							size="sm"
							onclick={() => paginated.loadMore(25)}
							class="text-muted-foreground text-xs"
						>
							Load more
						</Button>
					</div>
				{/if}

				{#if listStatus === 'LoadingMore'}
					<div class="border-border flex justify-center border-b py-3">
						<Spinner class="text-muted-foreground" />
					</div>
				{/if}
			</div>
		{/if}
	</ScrollArea>
</div>
