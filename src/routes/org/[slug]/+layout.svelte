<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';

	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { useMutation } from '@mmailaender/convex-svelte';

	import { api } from '$convex/_generated/api';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import ActionCommand from '$lib/components/action-command.svelte';
	import FloatingToolbar from '$lib/components/floating-toolbar.svelte';
	import IssueSearchCommand from '$lib/components/issue-search-command.svelte';
	import WorkspaceContentHeader from '$lib/components/workspace-content-header.svelte';
	import WorkspaceSidebar from '$lib/components/workspace-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { authClient } from '$lib/auth-client';
	import { gotoResolvedPath } from '$lib/goto-resolved';
	import { clearIssueSnapshots } from '$lib/issue-snapshot-cache';
	import {
		getActiveOrganization,
		listOrganizations,
		setActiveOrganization
	} from '$lib/organization';
	import {
		matchesShortcut,
		readShortcutSettings,
		type ShortcutSettings
	} from '$lib/shortcut-settings';
	import { setWorkspaceContext, type WorkspaceState } from '$lib/workspace-context';

	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const workspace = $state<WorkspaceState>(
		(() => ({
			organizations: data.organizations,
			activeOrg: data.organization,
			organizationId: data.organization.id
		}))()
	);

	setWorkspaceContext(workspace);

	const auth = useAuth();
	const ensureDefaultLabels = useMutation(api.labels.ensureDefaults);

	const slug = $derived(page.params.slug ?? '');

	let lastSyncedSlug = $state<string | null>(null);
	const seededOrgIds = new SvelteSet<string>();

	let activeCommand = $state<'issueSearch' | 'actionCommand' | null>(null);
	let shortcuts = $state<ShortcutSettings>(readShortcutSettings());

	const issueSearchOpen = $derived(activeCommand === 'issueSearch');
	const actionCommandOpen = $derived(activeCommand === 'actionCommand');

	function isEditableElement(target: EventTarget | null) {
		if (!(target instanceof HTMLElement)) return false;
		const tagName = target.tagName.toLowerCase();
		return (
			target.isContentEditable ||
			tagName === 'input' ||
			tagName === 'textarea' ||
			tagName === 'select'
		);
	}

	function openIssueSearch() {
		activeCommand = 'issueSearch';
	}

	function openActionCommand() {
		activeCommand = 'actionCommand';
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (isEditableElement(e.target)) return;

		if (matchesShortcut(e, shortcuts.search)) {
			e.preventDefault();
			activeCommand = 'issueSearch';
			return;
		}

		if (matchesShortcut(e, shortcuts.commandPrompt)) {
			e.preventDefault();
			activeCommand = 'actionCommand';
		}
	}

	// Keep server data and workspace in sync when SvelteKit navigates between slugs.
	$effect(() => {
		workspace.organizations = data.organizations;
		workspace.activeOrg = data.organization;
		workspace.organizationId = data.organization.id;
	});

	// Sync the Better Auth session's active organization when the slug changes.
	$effect(() => {
		const s = slug;
		if (lastSyncedSlug === s) return;

		lastSyncedSlug = s;
		void (async () => {
			try {
				await setActiveOrganization({ organizationSlug: s });
				const activeOrg = await getActiveOrganization();
				if (page.params.slug === s) {
					workspace.activeOrg = activeOrg ?? data.organization;
				}
			} catch {
				lastSyncedSlug = null;
			}
		})();
	});

	// Seed default labels once per org.
	$effect(() => {
		if (auth.isLoading || !auth.isAuthenticated) return;
		const id = workspace.organizationId;
		if (!id || seededOrgIds.has(id)) return;

		seededOrgIds.add(id);
		void ensureDefaultLabels({ organizationId: id }).catch(() => {
			seededOrgIds.delete(id);
		});
	});

	async function handleTeamSelect(orgSlug: string) {
		if (orgSlug === workspace.activeOrg?.slug) return;
		await setActiveOrganization({ organizationSlug: orgSlug });
		workspace.activeOrg = await getActiveOrganization();
		await gotoResolvedPath(`/org/${orgSlug}`);
	}

	async function handleSignOut() {
		clearIssueSnapshots();
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					void goto(resolve('/'));
				}
			}
		});
	}
</script>

<svelte:document onkeydown={handleKeyDown} />

<Sidebar.Provider>
	<WorkspaceSidebar
		{slug}
		pathname={page.url.pathname}
		searchString={page.url.search}
		organizations={workspace.organizations}
		activeOrg={workspace.activeOrg}
		currentUser={data.currentUser}
		{shortcuts}
		onTeamSelect={handleTeamSelect}
		onSignOut={handleSignOut}
		onSearchOpen={openIssueSearch}
		onActionCommandOpen={openActionCommand}
	/>

	<Sidebar.Inset>
		<WorkspaceContentHeader orgName={workspace.activeOrg?.name ?? ''} />
		<div class="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
			{@render children()}
		</div>
	</Sidebar.Inset>

	<FloatingToolbar {slug} onSearchOpen={openIssueSearch} onActionCommandOpen={openActionCommand} />

	<IssueSearchCommand
		open={issueSearchOpen}
		onOpenChange={(v) => {
			activeCommand = v ? 'issueSearch' : null;
		}}
		{slug}
	/>

	<ActionCommand
		open={actionCommandOpen}
		onOpenChange={(v) => {
			activeCommand = v ? 'actionCommand' : null;
		}}
		{slug}
		onIssueSearchOpen={openIssueSearch}
		{shortcuts}
	/>
</Sidebar.Provider>
