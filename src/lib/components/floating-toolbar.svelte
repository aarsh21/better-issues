<script lang="ts">
	import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
	import CommandIcon from '@lucide/svelte/icons/command';
	import SearchIcon from '@lucide/svelte/icons/search';
	import SettingsIcon from '@lucide/svelte/icons/settings';

	import { Button } from '$lib/components/ui/button';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte';
	import { gotoResolvedPath } from '$lib/goto-resolved';

	let {
		slug,
		onSearchOpen,
		onActionCommandOpen
	}: {
		slug: string;
		onSearchOpen: () => void;
		onActionCommandOpen: () => void;
	} = $props();

	const sidebar = useSidebar();
	const isCollapsed = $derived(sidebar.state === 'collapsed' && !sidebar.isMobile);
</script>

{#if !sidebar.isMobile}
	<div class="fixed top-0 left-0 z-20 flex h-10 items-center gap-1 px-2">
		<Sidebar.Trigger />

		{#if isCollapsed}
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={onSearchOpen}
				class="text-muted-foreground hover:text-foreground"
			>
				<SearchIcon class="size-4" />
				<span class="sr-only">Search</span>
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={onActionCommandOpen}
				class="text-muted-foreground hover:text-foreground"
			>
				<CommandIcon class="size-4" />
				<span class="sr-only">Commands</span>
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => void gotoResolvedPath(`/org/${slug}`)}
				class="text-muted-foreground hover:text-foreground"
			>
				<CircleDotIcon class="size-4" />
				<span class="sr-only">Issues</span>
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => void gotoResolvedPath(`/org/${slug}/settings`)}
				class="text-muted-foreground hover:text-foreground"
			>
				<SettingsIcon class="size-4" />
				<span class="sr-only">Settings</span>
			</Button>
		{/if}
	</div>
{/if}
