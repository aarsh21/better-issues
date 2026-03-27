<script lang="ts">
	import AlertTriangleIcon from '@lucide/svelte/icons/alert-triangle';
	import SignalHighIcon from '@lucide/svelte/icons/signal-high';
	import SignalLowIcon from '@lucide/svelte/icons/signal-low';
	import SignalMediumIcon from '@lucide/svelte/icons/signal-medium';

	import { cn } from '$lib/utils';

	type IssuePriority = 'urgent' | 'high' | 'medium' | 'low';

	const PRIORITY_CONFIG: Record<
		IssuePriority,
		{ label: string; className: string }
	> = {
		urgent: { label: 'Urgent', className: 'text-destructive' },
		high: { label: 'High', className: 'text-foreground' },
		medium: { label: 'Medium', className: 'text-muted-foreground' },
		low: { label: 'Low', className: 'text-muted-foreground/60' }
	};

	let {
		priority,
		showLabel = false,
		class: className = ''
	}: {
		priority: IssuePriority;
		showLabel?: boolean;
		class?: string;
	} = $props();

	const config = $derived(PRIORITY_CONFIG[priority]);
</script>

<span class={cn('inline-flex items-center gap-1.5 text-xs font-medium', config.className, className)}>
	{#if priority === 'urgent'}
		<AlertTriangleIcon class="h-3.5 w-3.5" aria-hidden="true" />
	{:else if priority === 'high'}
		<SignalHighIcon class="h-3.5 w-3.5" aria-hidden="true" />
	{:else if priority === 'medium'}
		<SignalMediumIcon class="h-3.5 w-3.5" aria-hidden="true" />
	{:else}
		<SignalLowIcon class="h-3.5 w-3.5" aria-hidden="true" />
	{/if}
	{#if showLabel}{config.label}{/if}
</span>
