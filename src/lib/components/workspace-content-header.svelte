<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import { SidebarTrigger, useSidebar } from '$lib/components/ui/sidebar';
	import { cn } from '$lib/utils';

	let { orgName = '' }: { orgName?: string } = $props();

	const sidebar = useSidebar();
</script>

<header
	class={cn(
		'border-border flex h-10 shrink-0 items-center gap-2 border-b transition-[padding] duration-200',
		sidebar.state === 'collapsed' && !sidebar.isMobile ? 'pl-40 pr-3' : 'px-3'
	)}
>
	{#if sidebar.isMobile}
		<SidebarTrigger class="-ml-1" />
		<Separator orientation="vertical" class="mr-2 !h-4" />
	{/if}
	<span class="text-muted-foreground truncate font-mono text-xs">{orgName}</span>
</header>
