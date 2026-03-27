<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
	import MonitorIcon from '@lucide/svelte/icons/monitor';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { useQuery } from '@mmailaender/convex-svelte';
	import { setMode, mode } from 'mode-watcher';

	import { api } from '$convex/_generated/api';
	import * as Command from '$lib/components/ui/command';
	import { gotoResolvedPath } from '$lib/goto-resolved';
	import { setActiveOrganization } from '$lib/organization';
	import { formatShortcut, type ShortcutSettings } from '$lib/shortcut-settings';
	import { getWorkspace } from '$lib/workspace-context';

	type ThemeMode = 'light' | 'dark' | 'system';

	let {
		open = false,
		slug,
		onOpenChange,
		onIssueSearchOpen,
		shortcuts
	}: {
		open: boolean;
		slug: string;
		onOpenChange?: (open: boolean) => void;
		onIssueSearchOpen?: () => void;
		shortcuts: ShortcutSettings;
	} = $props();

	const workspace = getWorkspace();

	const templatesQuery = useQuery(
		api.templates.list,
		() => (workspace.activeOrg ? { organizationId: workspace.activeOrg.id } : 'skip')
	);

	const templates = $derived(
		(templatesQuery.data as Array<{ _id: string; name: string }> | null) ?? []
	);

	function navigateTo(to: string) {
		onOpenChange?.(false);
		void gotoResolvedPath(to);
	}

	function handleSwitchTeam(organizationSlug: string) {
		onOpenChange?.(false);
		if (organizationSlug === workspace.activeOrg?.slug) return;
		void gotoResolvedPath(`/org/${organizationSlug}`);
		void setActiveOrganization({ organizationSlug });
	}

	function handleSwitchTheme(nextTheme: ThemeMode) {
		onOpenChange?.(false);
		setMode(nextTheme);
	}

	function handleOpenIssueSearch() {
		onOpenChange?.(false);
		onIssueSearchOpen?.();
	}
</script>

<Command.Dialog
	{open}
	onOpenChange={(v) => onOpenChange?.(v)}
	title="Commands"
	description="Run navigation and workspace actions."
>
	<div class="border-border/70 border-b px-3 py-2">
		<p class="text-muted-foreground text-[11px] uppercase tracking-wide">
			{formatShortcut(shortcuts.commandPrompt)}
		</p>
	</div>
	<Command.Input placeholder="Search options..." />
	<Command.List>
		<Command.Empty>No options found.</Command.Empty>

		<Command.Group heading="Quick Actions">
			<Command.Item
				value="search issues {slug}"
				onSelect={handleOpenIssueSearch}
				class="cursor-pointer"
			>
				<SearchIcon class="size-3.5" />
				<span class="text-sm">Search Issues</span>
				<Command.Shortcut>{formatShortcut(shortcuts.search)}</Command.Shortcut>
			</Command.Item>
			<Command.Item
				value="issues {slug}"
				onSelect={() => navigateTo(`/org/${slug}`)}
				class="cursor-pointer"
			>
				<CircleDotIcon class="size-3.5" />
				<span class="text-sm">All Issues</span>
			</Command.Item>
			<Command.Item
				value="issues open {slug}"
				onSelect={() => navigateTo(`/org/${slug}?status=open`)}
				class="cursor-pointer"
			>
				<span class="text-sm">Open Issues</span>
			</Command.Item>
			<Command.Item
				value="issues in progress {slug}"
				onSelect={() => navigateTo(`/org/${slug}?status=in_progress`)}
				class="cursor-pointer"
			>
				<span class="text-sm">In Progress Issues</span>
			</Command.Item>
			<Command.Item
				value="issues closed {slug}"
				onSelect={() => navigateTo(`/org/${slug}?status=closed`)}
				class="cursor-pointer"
			>
				<span class="text-sm">Closed Issues</span>
			</Command.Item>
			<Command.Item
				value="settings {slug}"
				onSelect={() => navigateTo(`/org/${slug}/settings`)}
				class="cursor-pointer"
			>
				<SettingsIcon class="size-3.5" />
				<span class="text-sm">Settings</span>
			</Command.Item>
		</Command.Group>

		<Command.Group heading="New Issue">
			<Command.Item
				value="new issue blank {slug}"
				onSelect={() => navigateTo(`/org/${slug}/issues/new?template=blank`)}
				class="cursor-pointer"
			>
				<PlusIcon class="size-3.5" />
				<span class="text-sm">Blank Issue</span>
			</Command.Item>
			{#each templates as template (template._id)}
				<Command.Item
					value="new issue template {template.name} {slug}"
					onSelect={() =>
						navigateTo(
							`/org/${slug}/issues/new?template=${encodeURIComponent(template._id)}`
						)}
					class="cursor-pointer"
				>
					<PlusIcon class="size-3.5" />
					<span class="truncate text-sm">Use Template: {template.name}</span>
				</Command.Item>
			{/each}
		</Command.Group>

		{#if workspace.organizations && workspace.organizations.length > 0}
			<Command.Group heading="Switch Team">
				{#each workspace.organizations as organization (organization.id)}
					<Command.Item
						value="team {organization.name} {organization.slug}"
						onSelect={() => handleSwitchTeam(organization.slug)}
						class="cursor-pointer"
					>
						<span class="truncate text-sm">{organization.name}</span>
						{#if organization.slug === workspace.activeOrg?.slug}
							<CheckIcon class="ml-auto size-3.5" />
						{/if}
					</Command.Item>
				{/each}
			</Command.Group>
		{/if}

		<Command.Group heading="Mode">
			<Command.Item
				value="mode light theme"
				onSelect={() => handleSwitchTheme('light')}
				class="cursor-pointer"
			>
				<SunIcon class="size-3.5" />
				<span class="text-sm">Light</span>
				{#if mode.current === 'light'}
					<CheckIcon class="ml-auto size-3.5" />
				{/if}
			</Command.Item>
			<Command.Item
				value="mode dark theme"
				onSelect={() => handleSwitchTheme('dark')}
				class="cursor-pointer"
			>
				<MoonIcon class="size-3.5" />
				<span class="text-sm">Dark</span>
				{#if mode.current === 'dark'}
					<CheckIcon class="ml-auto size-3.5" />
				{/if}
			</Command.Item>
			<Command.Item
				value="mode system theme"
				onSelect={() => handleSwitchTheme('system')}
				class="cursor-pointer"
			>
				<MonitorIcon class="size-3.5" />
				<span class="text-sm">System</span>
				{#if mode.current === undefined}
					<CheckIcon class="ml-auto size-3.5" />
				{/if}
			</Command.Item>
		</Command.Group>
	</Command.List>
</Command.Dialog>
