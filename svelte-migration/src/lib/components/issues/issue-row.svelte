<script lang="ts">
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	import { resolve } from '$app/paths';

	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	import LabelBadge from './label-badge.svelte';
	import PriorityIndicator from './priority-indicator.svelte';
	import StatusIcon from './status-badge.svelte';

	import type { Doc, Id } from '$convex/_generated/dataModel';

	type Issue = Doc<'issues'>;
	type Label = Doc<'labels'>;

	let {
		slug,
		issue,
		labels
	}: {
		slug: string;
		issue: Issue;
		labels: Label[];
	} = $props();

	const issueLabels = $derived(labels.filter((l) => issue.labelIds.includes(l._id as Id<'labels'>)));

	const issueHref = $derived(resolve(`/org/${slug}/issues/${issue.number}` as '/'));
</script>

<Button
	href={issueHref}
	variant="ghost"
	class={cn(
		'hover:bg-accent group h-auto w-full cursor-pointer justify-start gap-3 rounded-none border-b border-border px-4 py-3',
		issue.status === 'closed' && 'opacity-60'
	)}
>
	<StatusIcon status={issue.status} />

	<span
		class="text-muted-foreground group-hover:text-foreground w-10 shrink-0 text-right font-mono text-xs transition-colors"
	>
		#{issue.number}
	</span>

	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-2">
			<span
				class={cn(
					'truncate text-sm font-medium',
					issue.status === 'closed' && 'line-through'
				)}
			>
				{issue.title}
			</span>
			{#each issueLabels as label (label._id)}
				<LabelBadge name={label.name} color={label.color} />
			{/each}
		</div>
	</div>

	<PriorityIndicator priority={issue.priority} />

	<ChevronRightIcon
		class="text-muted-foreground h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100"
		aria-hidden="true"
	/>
</Button>
