<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';

	import { Button } from '$lib/components/ui/button';

	import type { IssueStatus } from './issue-status';

	const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
		{ value: 'open', label: 'Open' },
		{ value: 'in_progress', label: 'In Progress' },
		{ value: 'closed', label: 'Closed' }
	];

	let {
		activeStatus,
		onStatusChange
	}: {
		activeStatus: IssueStatus | undefined;
		onStatusChange: (status: IssueStatus | undefined) => void;
	} = $props();
</script>

<div class="flex flex-wrap items-center gap-1.5">
	{#each STATUS_OPTIONS as option (option.value)}
		<Button
			variant={activeStatus === option.value ? 'default' : 'outline'}
			size="sm"
			onclick={() =>
				onStatusChange(activeStatus === option.value ? undefined : option.value)}
		>
			{option.label}
		</Button>
	{/each}
	{#if activeStatus}
		<Button
			variant="ghost"
			size="sm"
			onclick={() => onStatusChange(undefined)}
			class="text-muted-foreground h-7 px-2 text-xs"
		>
			<XIcon class="mr-1 h-3 w-3" />
			Clear
		</Button>
	{/if}
</div>
