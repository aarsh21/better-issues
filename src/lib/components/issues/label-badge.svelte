<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		name,
		color,
		class: className = ''
	}: {
		name: string;
		color: string;
		class?: string;
	} = $props();
</script>

<span
	class={cn(
		'inline-flex items-center gap-1.5 border px-1.5 py-0.5 text-xs font-medium',
		className
	)}
	style:border-color={`${color}40`}
	style:background-color={`${color}15`}
	style:color={color}
>
	<span class="h-2 w-2 shrink-0" style:background-color={color}></span>
	{name}
</span>
