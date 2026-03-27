<script lang="ts">
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { useQuery } from '@mmailaender/convex-svelte';

	import { api } from '$convex/_generated/api';
	import type { Doc } from '$convex/_generated/dataModel';
	import PriorityIndicator from '$lib/components/issues/priority-indicator.svelte';
	import StatusIcon from '$lib/components/issues/status-badge.svelte';

	type Issue = Doc<'issues'>;
	import * as Command from '$lib/components/ui/command';
	import { gotoResolvedPath } from '$lib/goto-resolved';
	import { getWorkspace } from '$lib/workspace-context';

	const SEARCH_DEBOUNCE_MS = 250;

	let {
		open = false,
		slug,
		onOpenChange
	}: {
		open: boolean;
		slug: string;
		onOpenChange?: (open: boolean) => void;
	} = $props();

	const workspace = getWorkspace();

	let searchQuery = $state('');
	let debouncedQuery = $state('');

	const trimmedSearchQuery = $derived(searchQuery.trim());
	const hasTypedQuery = $derived(trimmedSearchQuery.length > 0);
	const hasSearchQuery = $derived(hasTypedQuery && debouncedQuery.length > 0);

	$effect(() => {
		const q = trimmedSearchQuery;
		const timeoutId = window.setTimeout(() => {
			debouncedQuery = q;
		}, SEARCH_DEBOUNCE_MS);
		return () => window.clearTimeout(timeoutId);
	});

	const issueResults = useQuery(
		api.issues.search,
		() =>
			workspace.activeOrg && hasSearchQuery
				? { organizationId: workspace.activeOrg.id, searchQuery: debouncedQuery }
				: 'skip'
	);

	const recentIssuesPage = useQuery(
		api.issues.list,
		() =>
			workspace.activeOrg
				? {
						organizationId: workspace.activeOrg.id,
						paginationOpts: { cursor: null, numItems: 8 }
					}
				: 'skip'
	);

	const searchResults = $derived((issueResults.data ?? []) as Issue[]);
	const recentIssues = $derived(
		((recentIssuesPage.data as { page?: Issue[] } | null)?.page ?? []) as Issue[]
	);

	const isDebouncing = $derived(hasTypedQuery && debouncedQuery !== trimmedSearchQuery);
	const isSearchLoading = $derived(hasTypedQuery && (isDebouncing || issueResults.isLoading));
	const issueCount = $derived(searchResults.length);
	const issueCountLabel = $derived(issueCount === 1 ? '1 issue found' : `${issueCount} issues found`);
	const searchContextLabel = $derived(
		workspace.activeOrg ? `Team: ${workspace.activeOrg.name}` : 'Search all issues'
	);

	function handleOpenChange(nextOpen: boolean) {
		onOpenChange?.(nextOpen);
		if (!nextOpen) {
			searchQuery = '';
			debouncedQuery = '';
		}
	}

	function navigateTo(to: string) {
		onOpenChange?.(false);
		void gotoResolvedPath(to);
	}

	function handleSelectIssue(issueNumber: number) {
		navigateTo(`/org/${slug}/issues/${issueNumber}`);
	}
</script>

<Command.Dialog
	{open}
	onOpenChange={handleOpenChange}
	title="Issue Search"
	description="Search all issues by title, number, status, and priority."
>
	<div class="border-border/70 border-b px-3 py-2">
		<p class="text-muted-foreground text-[11px] uppercase tracking-wide">
			{searchContextLabel}
		</p>
	</div>
	<Command.Input placeholder="Search all issues..." bind:value={searchQuery} />
	{#if hasTypedQuery}
		<div
			class="text-muted-foreground border-border/70 flex items-center gap-2 border-b px-3 py-1.5 text-xs"
		>
			{#if isSearchLoading}
				<Loader2Icon class="size-3.5 animate-spin" />
				<span>Searching issues...</span>
			{:else}
				<SearchIcon class="size-3.5" />
				<span>{issueCountLabel}</span>
			{/if}
		</div>
	{/if}
	<Command.List class={isSearchLoading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
		<Command.Empty>
			{#if hasTypedQuery}
				{isSearchLoading ? 'Searching issues...' : 'No issues found.'}
			{:else}
				Type to search issues...
			{/if}
		</Command.Empty>

		{#if hasSearchQuery && searchResults.length > 0}
			<Command.Group heading="Issues">
				{#each searchResults as issue (issue._id)}
					<Command.Item
						value="{issue.number} {issue.title}"
						onSelect={() => handleSelectIssue(issue.number)}
						class="cursor-pointer"
					>
						<div class="flex w-full items-center gap-3">
							<StatusIcon status={issue.status} />
							<span class="text-muted-foreground shrink-0 font-mono text-xs">
								#{issue.number}
							</span>
							<span class="truncate text-sm">{issue.title}</span>
							<div class="ml-auto">
								<PriorityIndicator priority={issue.priority} />
							</div>
						</div>
					</Command.Item>
				{/each}
			</Command.Group>
		{/if}

		{#if !hasTypedQuery && recentIssues.length > 0}
			<Command.Group heading="Recent Issues">
				{#each recentIssues as issue (issue._id)}
					<Command.Item
						value="{issue.number} {issue.title} recent"
						onSelect={() => handleSelectIssue(issue.number)}
						class="cursor-pointer"
					>
						<div class="flex w-full items-center gap-3">
							<StatusIcon status={issue.status} />
							<span class="text-muted-foreground shrink-0 font-mono text-xs">
								#{issue.number}
							</span>
							<span class="truncate text-sm">{issue.title}</span>
							<div class="ml-auto">
								<PriorityIndicator priority={issue.priority} />
							</div>
						</div>
					</Command.Item>
				{/each}
			</Command.Group>
		{/if}
	</Command.List>
</Command.Dialog>
