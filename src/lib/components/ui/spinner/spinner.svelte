<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { LucideProps } from '@lucide/svelte';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';

	let {
		class: className,
		role = 'status',
		// we add color and stroke for compatibility with different icon libraries props
		color,
		stroke,
		'aria-label': ariaLabel = 'Loading',
		...restProps
	}: LucideProps = $props();
</script>

<Loader2Icon
	{role}
	color={color === null ? undefined : color}
	stroke={stroke === null ? undefined : stroke}
	aria-label={ariaLabel}
	class={cn('size-4 animate-spin', className)}
	{...restProps}
/>
