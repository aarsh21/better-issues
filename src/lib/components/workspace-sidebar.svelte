<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
	import CommandIcon from '@lucide/svelte/icons/command';
	import LayoutListIcon from '@lucide/svelte/icons/layout-list';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import MonitorIcon from '@lucide/svelte/icons/monitor';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import SunIcon from '@lucide/svelte/icons/sun';
	import TagIcon from '@lucide/svelte/icons/tag';
	import UsersIcon from '@lucide/svelte/icons/users';
	import { setMode, mode } from 'mode-watcher';

	import CreateOrgDialog from '$lib/components/create-org-dialog.svelte';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuGroup,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Kbd, KbdGroup } from '$lib/components/ui/kbd';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { cn } from '$lib/utils';
	import type { ActiveOrganization, OrganizationSummary } from '$lib/organization';
	import { gotoResolvedPath } from '$lib/goto-resolved';
	import { getShortcutDisplayParts, type ShortcutSettings } from '$lib/shortcut-settings';
	import type { CurrentUser } from '$lib/server/auth';

	let {
		slug,
		pathname,
		searchString,
		organizations,
		activeOrg,
		currentUser,
		shortcuts,
		onTeamSelect,
		onSignOut,
		onSearchOpen,
		onActionCommandOpen
	}: {
		slug: string;
		pathname: string;
		searchString: string;
		organizations: OrganizationSummary[] | null;
		activeOrg: ActiveOrganization | null;
		currentUser: CurrentUser;
		shortcuts: ShortcutSettings;
		onTeamSelect: (organizationSlug: string) => void | Promise<void>;
		onSignOut: () => void | Promise<void>;
		onSearchOpen?: () => void;
		onActionCommandOpen?: () => void;
	} = $props();

	let createOrgOpen = $state(false);

	const activeStatus = $derived(new URLSearchParams(searchString).get('status'));
	const isOnIssuesIndex = $derived(pathname === `/org/${slug}`);
	const searchShortcutParts = $derived(getShortcutDisplayParts(shortcuts.search));
	const commandShortcutParts = $derived(getShortcutDisplayParts(shortcuts.commandPrompt));

	function navIssuesHref(filter?: 'open' | 'in_progress' | 'closed') {
		const base = `/org/${slug}`;
		if (!filter) return base;
		return `${base}?status=${filter}`;
	}
</script>

<Sidebar.Root collapsible="offcanvas">
	<Sidebar.Header class="md:pt-10">
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						class={cn(
							'flex w-full cursor-pointer items-center gap-2 rounded-none p-2 text-left text-xs outline-hidden group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground'
						)}
					>
						<div
							class="flex aspect-square size-8 shrink-0 items-center justify-center bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground"
						>
							{(activeOrg?.name ?? 'T').charAt(0).toUpperCase()}
						</div>
						<div class="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
							<span class="truncate text-xs font-semibold text-sidebar-foreground">
								{activeOrg?.name ?? 'Select team'}
							</span>
							<span class="truncate text-[10px] text-sidebar-foreground/60">
								{activeOrg?.slug ?? ''}
							</span>
						</div>
						<ChevronsUpDownIcon
							class="ml-auto size-4 shrink-0 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden"
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent class="min-w-56" align="start" sideOffset={4}>
						<DropdownMenuGroup>
							<DropdownMenuLabel class="text-xs text-muted-foreground">Teams</DropdownMenuLabel>
							{#if organizations}
								{#each organizations as org (org.id)}
									<DropdownMenuItem
										class="cursor-pointer gap-2 p-2"
										onSelect={() => void onTeamSelect(org.slug)}
									>
										<div
											class="flex size-6 items-center justify-center bg-primary text-[10px] font-semibold text-primary-foreground"
										>
											{org.name.charAt(0).toUpperCase()}
										</div>
										<span class="truncate font-mono text-xs">{org.name}</span>
										{#if activeOrg?.id === org.id}
											<CheckIcon class="ml-auto h-3.5 w-3.5" />
										{/if}
									</DropdownMenuItem>
								{/each}
							{/if}
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							class="cursor-pointer gap-2 p-2"
							onSelect={() => (createOrgOpen = true)}
						>
							<div class="flex size-6 items-center justify-center border border-dashed">
								<PlusIcon class="size-3.5" />
							</div>
							<span class="text-xs text-muted-foreground">Create team</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		<!-- Quick Actions -->
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton tooltipContent="Search issues" onclick={onSearchOpen}>
							<SearchIcon />
							<span>Search</span>
							<KbdGroup
								class="ml-auto text-sidebar-foreground group-data-[collapsible=icon]:hidden"
							>
								{#each searchShortcutParts as part, index (`search-${index}-${part}`)}
									<Kbd class="h-6 min-w-6 px-2 text-sm font-semibold">{part}</Kbd>
								{/each}
							</KbdGroup>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton tooltipContent="Command options" onclick={onActionCommandOpen}>
							<CommandIcon />
							<span>Commands</span>
							<KbdGroup
								class="ml-auto text-sidebar-foreground group-data-[collapsible=icon]:hidden"
							>
								{#each commandShortcutParts as part, index (`command-${index}-${part}`)}
									<Kbd class="h-6 min-w-6 px-2 text-sm font-semibold">{part}</Kbd>
								{/each}
							</KbdGroup>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContent="New Issue"
							onclick={() => void gotoResolvedPath(`/org/${slug}/issues/new`)}
						>
							<PlusIcon />
							<span>New Issue</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<Sidebar.Separator />

		<!-- Navigation -->
		<Sidebar.Group>
			<Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContent="Issues"
							isActive={isOnIssuesIndex && activeStatus === null}
							onclick={() => void gotoResolvedPath(`/org/${slug}`)}
						>
							<CircleDotIcon />
							<span>Issues</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContent="Settings"
							isActive={pathname.startsWith(`/org/${slug}/settings`)}
							onclick={() => void gotoResolvedPath(`/org/${slug}/settings`)}
						>
							<SettingsIcon />
							<span>Settings</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<Sidebar.Separator />

		<!-- Filters -->
		<Sidebar.Group>
			<Sidebar.GroupLabel>Filters</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContent="Open issues"
							isActive={isOnIssuesIndex && activeStatus === 'open'}
							onclick={() => void gotoResolvedPath(navIssuesHref('open'))}
						>
							<LayoutListIcon />
							<span>Open</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContent="In progress issues"
							isActive={isOnIssuesIndex && activeStatus === 'in_progress'}
							onclick={() => void gotoResolvedPath(navIssuesHref('in_progress'))}
						>
							<CircleDotIcon />
							<span>In Progress</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContent="Closed issues"
							isActive={isOnIssuesIndex && activeStatus === 'closed'}
							onclick={() => void gotoResolvedPath(navIssuesHref('closed'))}
						>
							<TagIcon />
							<span>Closed</span>
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						class={cn(
							'flex w-full cursor-pointer items-center gap-2 rounded-none p-2 text-left text-xs outline-hidden group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground'
						)}
					>
						<Avatar class="h-8 w-8 shrink-0">
							<AvatarImage
								src={currentUser.image ?? undefined}
								alt={currentUser.name ?? currentUser.email}
							/>
							<AvatarFallback
								class="bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground"
							>
								{(currentUser.name ?? currentUser.email).charAt(0).toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div class="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
							<span class="truncate text-xs font-semibold text-sidebar-foreground">
								{currentUser.name ?? 'User'}
							</span>
							<span class="truncate text-[10px] text-sidebar-foreground/60"
								>{currentUser.email}</span
							>
						</div>
						<ChevronsUpDownIcon
							class="ml-auto size-4 shrink-0 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden"
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent class="min-w-56" align="end" sideOffset={4}>
						<DropdownMenuGroup>
							<DropdownMenuLabel class="p-0 font-normal">
								<div class="flex items-center gap-2 px-1 py-1.5 text-left">
									<Avatar class="h-8 w-8">
										<AvatarImage
											src={currentUser.image ?? undefined}
											alt={currentUser.name ?? currentUser.email}
										/>
										<AvatarFallback class="text-xs font-semibold">
											{(currentUser.name ?? currentUser.email).charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div class="grid flex-1 text-left leading-tight">
										<span class="truncate text-xs font-semibold">{currentUser.name ?? 'User'}</span>
										<span class="truncate text-[10px] text-muted-foreground"
											>{currentUser.email}</span
										>
									</div>
								</div>
							</DropdownMenuLabel>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem
								class="cursor-pointer gap-2"
								onSelect={() => void gotoResolvedPath('/org')}
							>
								<UsersIcon class="size-4" />
								Teams
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuLabel class="text-[10px] text-muted-foreground">Theme</DropdownMenuLabel>
							<DropdownMenuItem onSelect={() => setMode('light')} class="cursor-pointer gap-2">
								<SunIcon class="size-4" />
								Light
								{#if mode.current === 'light'}
									<CheckIcon class="ml-auto size-3.5" />
								{/if}
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => setMode('dark')} class="cursor-pointer gap-2">
								<MoonIcon class="size-4" />
								Dark
								{#if mode.current === 'dark'}
									<CheckIcon class="ml-auto size-3.5" />
								{/if}
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => setMode('system')} class="cursor-pointer gap-2">
								<MonitorIcon class="size-4" />
								System
								{#if mode.current === undefined}
									<CheckIcon class="ml-auto size-3.5" />
								{/if}
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							class="cursor-pointer gap-2 text-destructive"
							onSelect={() => void onSignOut()}
						>
							<LogOutIcon class="size-4" />
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>

<CreateOrgDialog bind:open={createOrgOpen} />
