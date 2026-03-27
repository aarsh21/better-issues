<script lang="ts">
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { setMode } from 'mode-watcher';

	import { Button } from '$lib/components/ui/button';
	import { Content, Item, Root, Trigger } from '$lib/components/ui/dropdown-menu';
</script>

<Root>
	<Trigger>
		{#snippet child({ props })}
			<Button variant="outline" size="icon" class="relative" {...props}>
				<SunIcon
					class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
				/>
				<MoonIcon
					class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>
		{/snippet}
	</Trigger>
	<Content align="end">
		<Item onSelect={() => setMode('light')}>Light</Item>
		<Item onSelect={() => setMode('dark')}>Dark</Item>
		<Item onSelect={() => setMode('system')}>System</Item>
	</Content>
</Root>
