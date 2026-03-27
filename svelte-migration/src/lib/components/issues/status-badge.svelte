<script lang="ts">
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
	import CircleIcon from '@lucide/svelte/icons/circle';

	import { cn } from '$lib/utils';

	import type { IssueStatus } from './issue-status';

	const STATUS_CONFIG: Record<IssueStatus, { label: string; className: string }> = {
		open: {
			label: 'Open',
			className: 'text-foreground border-border'
		},
		in_progress: {
			label: 'In Progress',
			className: 'text-chart-2 border-chart-2/30 bg-chart-2/10'
		},
		closed: {
			label: 'Closed',
			className: 'text-muted-foreground border-border bg-muted'
		}
	};

	let {
		status,
		class: className = ''
	}: {
		status: IssueStatus;
		class?: string;
	} = $props();

	const config = $derived(STATUS_CONFIG[status]);
</script>

{#if status === 'open'}
	<CircleIcon class={cn('h-4 w-4', config.className, className)} aria-label={config.label} />
{:else if status === 'in_progress'}
	<CircleDotIcon class={cn('h-4 w-4', config.className, className)} aria-label={config.label} />
{:else}
	<CircleCheckIcon class={cn('h-4 w-4', config.className, className)} aria-label={config.label} />
{/if}
