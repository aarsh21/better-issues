<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ClipboardCopyIcon from '@lucide/svelte/icons/clipboard-copy';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import KeyboardIcon from '@lucide/svelte/icons/keyboard';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import TagIcon from '@lucide/svelte/icons/tag';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import UserIcon from '@lucide/svelte/icons/user';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import UsersIcon from '@lucide/svelte/icons/users';
	import XIcon from '@lucide/svelte/icons/x';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useMutation, useQuery } from '@mmailaender/convex-svelte';
	import { toast } from 'svelte-sonner';

	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import ConfirmDialog from '$lib/components/confirm-dialog.svelte';
	import LabelBadge from '$lib/components/issues/label-badge.svelte';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { TEMPLATE_PRESETS } from '$lib/template-presets';
	import {
		cancelInvitation,
		inviteMember,
		listInvitations,
		listMembers,
		removeMember,
		type OrganizationInvitation,
		type OrganizationMember
	} from '$lib/organization';
	import {
		DEFAULT_SHORTCUTS,
		formatShortcut,
		normalizeShortcutKey,
		readShortcutSettings,
		resetShortcutSettings,
		shortcutBindingsEqual,
		updateShortcutSetting,
		type ShortcutSettings
	} from '$lib/shortcut-settings';
	import { getWorkspace } from '$lib/workspace-context';
	import { authClient } from '$lib/auth-client';

	type SettingsTab = 'profile' | 'shortcuts' | 'labels' | 'templates' | 'members';
	type ShortcutTarget = 'search' | 'commandPrompt';
	type ShortcutOption = Readonly<{
		target: ShortcutTarget;
		title: string;
		description: string;
	}>;

	const LABEL_COLORS = [
		'#ef4444',
		'#f97316',
		'#eab308',
		'#22c55e',
		'#06b6d4',
		'#3b82f6',
		'#8b5cf6',
		'#ec4899',
		'#6b7280',
		'#1e293b'
	];
	const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
	const USERNAME_REGEX = /^[a-zA-Z0-9_.]+$/;
	const SHORTCUT_OPTIONS: readonly ShortcutOption[] = [
		{
			target: 'search',
			title: 'Issue search',
			description: 'Opens the issue search dialog'
		},
		{
			target: 'commandPrompt',
			title: 'Command prompt',
			description: 'Opens the workspace command dialog'
		}
	];

	const workspace = getWorkspace();
	const slug = $derived(page.params.slug ?? '');
	const activeTab = $derived((page.url.searchParams.get('tab') as SettingsTab | null) ?? 'profile');
	const organizationId = $derived(workspace.organizationId);

	const currentUserQuery = useQuery(api.auth.getCurrentUser, () => ({}));
	const labelsQuery = useQuery(api.labels.list, () =>
		organizationId ? { organizationId } : 'skip'
	);
	const templatesQuery = useQuery(api.templates.list, () =>
		organizationId ? { organizationId } : 'skip'
	);

	const createLabel = useMutation(api.labels.create);
	const removeLabel = useMutation(api.labels.remove);
	const removeTemplate = useMutation(api.templates.remove);
	const createTemplate = useMutation(api.templates.create);
	const generateAvatarUploadUrl = useMutation(api.files.generateAvatarUploadUrl);
	const createAvatarReference = useMutation(api.files.createAvatarReference);

	let usernameDraft = $state('');
	let avatarPreview = $state<string | null | undefined>(undefined);
	let savingUsername = $state(false);
	let uploadingAvatar = $state(false);
	let removingAvatar = $state(false);

	let shortcuts = $state<ShortcutSettings>(readShortcutSettings());
	let capturingTarget = $state<ShortcutTarget | null>(null);

	let showLabelCreator = $state(false);
	let newLabelName = $state('');
	let newLabelColor = $state(LABEL_COLORS[0]!);
	let newLabelDescription = $state('');

	let members = $state<OrganizationMember[]>([]);
	let invitations = $state<OrganizationInvitation[]>([]);
	let membersLoading = $state(true);
	let invitationsLoading = $state(true);
	let showInviteForm = $state(false);
	let inviteEmail = $state('');
	let inviteRole = $state<'member' | 'admin'>('member');
	let copiedInvitationId = $state<string | null>(null);

	let confirmOpen = $state(false);
	let confirmTitle = $state('');
	let confirmDescription = $state('');
	let confirmLabel = $state('Confirm');
	let confirmAction = $state<null | (() => Promise<void>)>(null);

	$effect(() => {
		const currentUser = currentUserQuery.data;
		if (!currentUser) return;

		if (usernameDraft.length === 0) {
			usernameDraft = currentUser.username ?? '';
		}
		if (avatarPreview === undefined) {
			avatarPreview = currentUser.image ?? null;
		}
	});

	$effect(() => {
		const id = organizationId;
		if (!id) return;

		membersLoading = true;
		invitationsLoading = true;

		void (async () => {
			try {
				members = await listMembers();
			} catch (error) {
				toast.error(error instanceof Error ? error.message : 'Failed to load members');
			} finally {
				membersLoading = false;
			}
		})();

		void (async () => {
			try {
				invitations = await listInvitations();
			} catch (error) {
				toast.error(error instanceof Error ? error.message : 'Failed to load invitations');
			} finally {
				invitationsLoading = false;
			}
		})();
	});

	$effect(() => {
		if (!capturingTarget) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !event.metaKey && !event.ctrlKey && !event.altKey) {
				event.preventDefault();
				capturingTarget = null;
				return;
			}

			if (!(event.metaKey || event.ctrlKey)) {
				return;
			}

			const normalizedKey = normalizeShortcutKey(event.key);
			if (!normalizedKey) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			const nextBinding = {
				key: normalizedKey,
				shift: event.shiftKey,
				alt: event.altKey
			};

			const otherTarget: ShortcutTarget = capturingTarget === 'search' ? 'commandPrompt' : 'search';
			if (shortcutBindingsEqual(nextBinding, shortcuts[otherTarget])) {
				toast.error('This shortcut is already used. Pick a different combination.');
				return;
			}

			const target = capturingTarget;
			if (!target) {
				return;
			}

			shortcuts = updateShortcutSetting(target, nextBinding);
			toast.success(`Shortcut updated to ${formatShortcut(nextBinding)}`);
			capturingTarget = null;
		};

		window.addEventListener('keydown', onKeyDown, true);
		return () => window.removeEventListener('keydown', onKeyDown, true);
	});

	const currentUser = $derived(currentUserQuery.data);
	const labels = $derived(labelsQuery.data ?? []);
	const templates = $derived(templatesQuery.data ?? []);
	const currentUserId = $derived(currentUser?._id);
	const currentMember = $derived(members.find((member) => member.user.id === currentUserId));
	const isAdmin = $derived(currentMember?.role === 'admin' || currentMember?.role === 'owner');
	const pendingInvitations = $derived(
		invitations.filter((invitation) => invitation.status === 'pending')
	);
	const templateNameSet = $derived(
		new Set(templates.map((template) => template.name.trim().toLowerCase()))
	);
	const currentUsername = $derived(currentUser?.username?.trim() ?? '');
	const normalizedUsername = $derived(usernameDraft.trim());
	const usernameValidationError = $derived.by(() => {
		if (normalizedUsername.length === 0) return 'Username is required';
		if (normalizedUsername.length < 3) return 'Username must be at least 3 characters';
		if (normalizedUsername.length > 30) return 'Username must be at most 30 characters';
		if (!USERNAME_REGEX.test(normalizedUsername)) {
			return 'Only letters, numbers, underscores, and dots are allowed';
		}
		return null;
	});
	const hasUsernameChanged = $derived(normalizedUsername !== currentUsername);
	const userInitial = $derived(
		currentUser?.name?.charAt(0)?.toUpperCase() ??
			currentUser?.email?.charAt(0)?.toUpperCase() ??
			'U'
	);

	async function setTab(tab: SettingsTab) {
		await goto(`/org/${slug}/settings?tab=${tab}`, { replaceState: true, noScroll: true });
	}

	async function saveUsername() {
		if (!currentUser || usernameValidationError || !hasUsernameChanged) {
			return;
		}

		savingUsername = true;
		const { error } = await authClient.updateUser({ username: normalizedUsername });
		savingUsername = false;

		if (error) {
			toast.error(error.message || error.statusText || 'Failed to save username');
			return;
		}

		toast.success(currentUsername ? 'Username updated' : 'Username added');
	}

	async function uploadProfilePhoto(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		(event.currentTarget as HTMLInputElement).value = '';
		if (!file || !organizationId) return;

		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file');
			return;
		}
		if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
			toast.error('Profile photos must be 5MB or smaller');
			return;
		}

		uploadingAvatar = true;
		try {
			const avatarUpload = await generateAvatarUploadUrl({ organizationId });
			const uploadResponse = await fetch(avatarUpload.uploadUrl, {
				method: 'POST',
				headers: { 'Content-Type': file.type },
				body: file
			});

			if (!uploadResponse.ok) {
				throw new Error('Failed to upload profile photo');
			}

			const uploadResult = (await uploadResponse.json()) as { storageId?: Id<'_storage'> };
			if (!uploadResult.storageId) {
				throw new Error('Could not save uploaded profile photo');
			}

			const imageReference = await createAvatarReference({
				organizationId,
				storageId: uploadResult.storageId,
				uploadToken: avatarUpload.uploadToken
			});
			const { error } = await authClient.updateUser({ image: imageReference });

			if (error) {
				throw new Error(error.message || error.statusText || 'Failed to update profile photo');
			}

			avatarPreview = URL.createObjectURL(file);
			toast.success('Profile photo updated');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to upload profile photo');
		} finally {
			uploadingAvatar = false;
		}
	}

	async function removeProfilePhoto() {
		removingAvatar = true;
		const { error } = await authClient.updateUser({ image: null });
		removingAvatar = false;

		if (error) {
			toast.error(error.message || error.statusText || 'Failed to remove profile photo');
			return;
		}

		avatarPreview = null;
		toast.success('Profile photo removed');
	}

	async function createNewLabel() {
		if (!organizationId || !newLabelName.trim()) return;

		try {
			await createLabel({
				organizationId,
				name: newLabelName.trim(),
				color: newLabelColor,
				description: newLabelDescription.trim() || undefined
			});
			toast.success('Label created');
			newLabelName = '';
			newLabelDescription = '';
			showLabelCreator = false;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create label');
		}
	}

	function askToRemoveLabel(labelId: Id<'labels'>) {
		confirmTitle = 'Remove label';
		confirmDescription =
			'This label can only be removed after it has been detached from every issue that still uses it.';
		confirmLabel = 'Remove';
		confirmAction = async () => {
			await removeLabel({ labelId });
			toast.success('Label removed');
		};
		confirmOpen = true;
	}

	function askToRemoveTemplate(templateId: Id<'issueTemplates'>) {
		confirmTitle = 'Remove template';
		confirmDescription =
			'Existing issues keep their saved template fields, but this template will stop being available for future issues.';
		confirmLabel = 'Remove';
		confirmAction = async () => {
			await removeTemplate({ templateId });
			toast.success('Template removed');
		};
		confirmOpen = true;
	}

	async function createPresetTemplate(preset: (typeof TEMPLATE_PRESETS)[number]) {
		if (!organizationId) return;

		try {
			await createTemplate({
				organizationId,
				name: preset.name,
				description: preset.description,
				schema: JSON.stringify(preset.schema)
			});
			toast.success(`${preset.name} template created`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create template');
		}
	}

	async function sendInvitation() {
		if (!inviteEmail.trim()) return;

		try {
			const invitation = await inviteMember({
				email: inviteEmail.trim(),
				role: inviteRole
			});
			const invitationId = invitation?.id ?? invitation?.invitationId;
			if (invitationId) {
				await navigator.clipboard.writeText(`${window.location.origin}/invite/${invitationId}`);
				toast.success('Invitation created — link copied to clipboard');
			} else {
				toast.success('Invitation sent');
			}
			inviteEmail = '';
			inviteRole = 'member';
			showInviteForm = false;
			invitations = await listInvitations();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
		}
	}

	async function copyInvitationLink(invitationId: string) {
		await navigator.clipboard.writeText(`${window.location.origin}/invite/${invitationId}`);
		copiedInvitationId = invitationId;
		toast.success('Invite link copied');
		setTimeout(() => {
			if (copiedInvitationId === invitationId) {
				copiedInvitationId = null;
			}
		}, 2_000);
	}

	function askToCancelInvitation(invitationId: string, email: string) {
		confirmTitle = 'Cancel invitation';
		confirmDescription = `Cancel the invitation to ${email}?`;
		confirmLabel = 'Cancel invite';
		confirmAction = async () => {
			await cancelInvitation({ invitationId });
			invitations = await listInvitations();
			toast.success('Invitation cancelled');
		};
		confirmOpen = true;
	}

	function askToRemoveMember(memberEmail: string) {
		confirmTitle = 'Remove member';
		confirmDescription = `Remove ${memberEmail} from the team?`;
		confirmLabel = 'Remove member';
		confirmAction = async () => {
			await removeMember({ memberIdOrEmail: memberEmail });
			members = await listMembers();
			toast.success('Member removed');
		};
		confirmOpen = true;
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center gap-3 border-b border-border px-4 py-3">
		<Button variant="ghost" size="sm" href={`/org/${slug}`}>
			<ArrowLeftIcon class="h-3.5 w-3.5" />
		</Button>
		<h1 class="text-sm font-bold">Settings</h1>
	</div>

	<div class="flex-1 overflow-auto p-6">
		<div class="mx-auto max-w-2xl space-y-6">
			<div class="flex flex-wrap gap-2">
				<Button
					variant={activeTab === 'profile' ? 'secondary' : 'outline'}
					size="sm"
					class="gap-1.5"
					onclick={() => void setTab('profile')}
				>
					<UserIcon class="h-3.5 w-3.5" />
					Profile
				</Button>
				<Button
					variant={activeTab === 'shortcuts' ? 'secondary' : 'outline'}
					size="sm"
					class="gap-1.5"
					onclick={() => void setTab('shortcuts')}
				>
					<KeyboardIcon class="h-3.5 w-3.5" />
					Shortcuts
				</Button>
				<Button
					variant={activeTab === 'labels' ? 'secondary' : 'outline'}
					size="sm"
					class="gap-1.5"
					onclick={() => void setTab('labels')}
				>
					<TagIcon class="h-3.5 w-3.5" />
					Labels
				</Button>
				<Button
					variant={activeTab === 'templates' ? 'secondary' : 'outline'}
					size="sm"
					class="gap-1.5"
					onclick={() => void setTab('templates')}
				>
					<FileTextIcon class="h-3.5 w-3.5" />
					Templates
				</Button>
				<Button
					variant={activeTab === 'members' ? 'secondary' : 'outline'}
					size="sm"
					class="gap-1.5"
					onclick={() => void setTab('members')}
				>
					<UsersIcon class="h-3.5 w-3.5" />
					Members
				</Button>
			</div>

			{#if activeTab === 'profile'}
				<div class="space-y-6">
					<div>
						<h2 class="text-sm font-medium">Profile</h2>
						<p class="text-xs text-muted-foreground">
							Update your username, avatar, and identity across your workspace.
						</p>
					</div>

					<div class="space-y-4 border border-border p-4">
						<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div class="flex items-center gap-3">
								<Avatar size="lg">
									<AvatarImage
										src={avatarPreview ?? undefined}
										alt={currentUser?.name ?? 'User avatar'}
									/>
									<AvatarFallback class="text-sm font-semibold">{userInitial}</AvatarFallback>
								</Avatar>
								<div>
									<p class="text-sm font-medium">Profile photo</p>
									<p class="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB.</p>
								</div>
							</div>
							<div class="flex flex-wrap items-center gap-2">
								<Input
									type="file"
									accept="image/*"
									class="max-w-[220px]"
									disabled={uploadingAvatar || removingAvatar}
									onchange={uploadProfilePhoto}
								/>
								<Button
									variant="outline"
									size="sm"
									disabled={uploadingAvatar || removingAvatar || !avatarPreview}
									onclick={() => void removeProfilePhoto()}
								>
									{removingAvatar ? 'Removing...' : 'Remove'}
								</Button>
							</div>
						</div>
					</div>

					<div class="space-y-4 border border-border p-4">
						<div>
							<h3 class="text-sm font-medium">Username</h3>
							<p class="text-xs text-muted-foreground">
								Older accounts might not have one yet. Add one to sign in with username.
							</p>
						</div>

						<div class="space-y-2">
							<Label for="profile-username">Username</Label>
							<Input
								id="profile-username"
								placeholder="jane_doe"
								autocomplete="username"
								bind:value={usernameDraft}
							/>
							{#if usernameValidationError}
								<p class="text-xs text-destructive">{usernameValidationError}</p>
							{/if}
						</div>

						<div class="flex justify-end">
							<Button
								disabled={savingUsername || !hasUsernameChanged || usernameValidationError !== null}
								onclick={() => void saveUsername()}
							>
								{savingUsername ? 'Saving...' : 'Save Username'}
							</Button>
						</div>
					</div>
				</div>
			{:else if activeTab === 'shortcuts'}
				<div class="space-y-6">
					<div>
						<h2 class="text-sm font-medium">Keyboard Shortcuts</h2>
						<p class="text-xs text-muted-foreground">
							Customize keys for issue search and the command prompt.
						</p>
					</div>

					{#each SHORTCUT_OPTIONS as { target, title, description } (target)}
						<div
							class="flex flex-col gap-3 border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
						>
							<div>
								<p class="text-sm font-medium">{title}</p>
								<p class="text-xs text-muted-foreground">{description}</p>
							</div>
							<div class="flex flex-wrap items-center gap-2">
								<span
									class="border border-border px-2 py-1 font-mono text-xs text-muted-foreground"
								>
									{formatShortcut(shortcuts[target])}
								</span>
								<Button
									variant={capturingTarget === target ? 'default' : 'outline'}
									size="sm"
									onclick={() => (capturingTarget = capturingTarget === target ? null : target)}
								>
									{capturingTarget === target ? 'Listening...' : 'Change'}
								</Button>
							</div>
						</div>
					{/each}

					<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<p class="text-xs text-muted-foreground">
							Press Escape to cancel capture. Shortcuts always use Ctrl/Cmd as the base modifier.
						</p>
						<Button
							variant="outline"
							size="sm"
							onclick={() => {
								shortcuts = resetShortcutSettings();
								capturingTarget = null;
								toast.success('Shortcuts reset to defaults');
							}}
						>
							Reset to defaults
						</Button>
					</div>
				</div>
			{:else if activeTab === 'labels'}
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<h2 class="text-sm font-medium">Labels</h2>
							<p class="text-xs text-muted-foreground">
								Manage labels for categorizing issues. We recommend 5-8 labels.
							</p>
						</div>
						<Button
							size="sm"
							class="gap-1.5"
							disabled={labels.length >= 15}
							onclick={() => (showLabelCreator = !showLabelCreator)}
						>
							<PlusIcon class="h-3.5 w-3.5" />
							New Label
						</Button>
					</div>

					{#if showLabelCreator}
						<div class="space-y-4 border border-border p-4">
							<div class="grid gap-2">
								<Label for="label-name">Name</Label>
								<Input id="label-name" placeholder="type: bug" bind:value={newLabelName} />
							</div>
							<div class="grid gap-2">
								<Label>Color</Label>
								<div class="flex flex-wrap gap-2">
									{#each LABEL_COLORS as color (color)}
										<button
											type="button"
											aria-label={`Select ${color} label color`}
											class="h-6 w-6 cursor-pointer border-2 transition-transform"
											style={`background-color:${color};border-color:${newLabelColor === color ? 'var(--color-foreground)' : 'transparent'};transform:${newLabelColor === color ? 'scale(1.2)' : 'scale(1)'}`}
											onclick={() => (newLabelColor = color)}
										></button>
									{/each}
								</div>
								<div class="mt-1">
									<LabelBadge name={newLabelName || 'preview'} color={newLabelColor} />
								</div>
							</div>
							<div class="grid gap-2">
								<Label for="label-description">Description</Label>
								<Input
									id="label-description"
									placeholder="Brief description..."
									bind:value={newLabelDescription}
								/>
							</div>
							<div class="flex gap-2">
								<Button variant="outline" onclick={() => (showLabelCreator = false)}>Cancel</Button>
								<Button onclick={() => void createNewLabel()} disabled={!newLabelName.trim()}>
									Create
								</Button>
							</div>
						</div>
					{/if}

					{#if labelsQuery.data === undefined}
						<div class="space-y-2">
							{#each [0, 1, 2] as row (row)}
								<Skeleton class="h-10 w-full" />
							{/each}
						</div>
					{:else if labels.length === 0}
						<div class="border border-dashed border-border p-8 text-center">
							<p class="text-sm text-muted-foreground">
								No labels yet. Create labels to categorize your issues.
							</p>
						</div>
					{:else}
						<div class="space-y-1">
							{#each labels as label (label._id)}
								<div class="flex items-center justify-between border border-border px-3 py-2">
									<div class="flex items-center gap-3">
										<LabelBadge name={label.name} color={label.color} />
										{#if label.description}
											<span class="text-xs text-muted-foreground">{label.description}</span>
										{/if}
									</div>
									<Button
										variant="ghost"
										size="icon-sm"
										class="text-muted-foreground hover:text-destructive"
										onclick={() => askToRemoveLabel(label._id)}
									>
										<Trash2Icon class="h-3.5 w-3.5" />
									</Button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else if activeTab === 'templates'}
				<div class="space-y-6">
					<div class="flex items-center justify-between">
						<div>
							<h2 class="text-sm font-medium">Issue Templates</h2>
							<p class="text-xs text-muted-foreground">
								Define structured templates with custom fields for issue reporting.
							</p>
						</div>
						<Button size="sm" class="gap-1.5" href={`/org/${slug}/settings/templates/new`}>
							<PlusIcon class="h-3.5 w-3.5" />
							New Template
						</Button>
					</div>

					{#if templatesQuery.data === undefined}
						<div class="space-y-2">
							{#each [0, 1] as row (row)}
								<Skeleton class="h-16 w-full" />
							{/each}
						</div>
					{:else}
						<div class="space-y-6">
							{#if templates.length === 0}
								<div class="border border-dashed border-border p-8 text-center">
									<p class="text-sm text-muted-foreground">
										No templates yet. Templates help reporters provide structured information.
									</p>
								</div>
							{:else}
								<div class="space-y-1">
									{#each templates as template (template._id)}
										<div class="flex items-center justify-between border border-border px-3 py-3">
											<div>
												<p class="text-sm font-medium">{template.name}</p>
												<p class="text-xs text-muted-foreground">{template.description}</p>
											</div>
											<Button
												variant="ghost"
												size="icon-sm"
												class="text-muted-foreground hover:text-destructive"
												onclick={() => askToRemoveTemplate(template._id)}
											>
												<Trash2Icon class="h-3.5 w-3.5" />
											</Button>
										</div>
									{/each}
								</div>
							{/if}

							<Separator />

							<div class="space-y-3">
								<div>
									<h3 class="text-sm font-medium">Starter templates</h3>
									<p class="text-xs text-muted-foreground">
										Start with a proven structure and customize later.
									</p>
								</div>
								<div class="grid gap-3">
									{#each TEMPLATE_PRESETS as preset (preset.name)}
										<div
											class="flex flex-col gap-3 border border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
										>
											<div>
												<p class="text-sm font-medium">{preset.name}</p>
												<p class="text-xs text-muted-foreground">{preset.description}</p>
											</div>
											<Button
												size="sm"
												variant="outline"
												onclick={() => void createPresetTemplate(preset)}
												disabled={templateNameSet.has(preset.name.toLowerCase())}
											>
												{templateNameSet.has(preset.name.toLowerCase())
													? 'Already created'
													: 'Use template'}
											</Button>
										</div>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<div class="space-y-6">
					<div class="flex items-center justify-between">
						<div>
							<h2 class="text-sm font-medium">Members</h2>
							<p class="text-xs text-muted-foreground">
								Manage your team's members and invite new ones.
							</p>
						</div>
						<Button
							size="sm"
							class="gap-1.5"
							disabled={!isAdmin}
							onclick={() => (showInviteForm = !showInviteForm)}
						>
							<UserPlusIcon class="h-3.5 w-3.5" />
							Invite
						</Button>
					</div>

					{#if showInviteForm}
						<div class="grid gap-4 border border-border p-4">
							<div class="grid gap-2">
								<Label for="invite-email">Email address</Label>
								<Input
									id="invite-email"
									type="email"
									placeholder="team@example.com"
									bind:value={inviteEmail}
								/>
							</div>
							<div class="grid gap-2">
								<Label for="invite-role">Role</Label>
								<select
									id="invite-role"
									class="h-8 w-full rounded-none border border-input bg-background px-2 text-sm text-foreground outline-none"
									bind:value={inviteRole}
								>
									<option value="member">Member</option>
									<option value="admin">Admin</option>
								</select>
							</div>
							<div class="flex gap-2">
								<Button variant="outline" onclick={() => (showInviteForm = false)}>Cancel</Button>
								<Button onclick={() => void sendInvitation()} disabled={!inviteEmail.trim()}>
									Send Invitation
								</Button>
							</div>
						</div>
					{/if}

					{#if membersLoading}
						<div class="space-y-2">
							{#each [0, 1, 2] as row (row)}
								<Skeleton class="h-12 w-full" />
							{/each}
						</div>
					{:else}
						<div class="space-y-1">
							{#each members as member (member.id)}
								<div class="flex items-center justify-between border border-border px-3 py-2">
									<div class="flex items-center gap-3">
										<div
											class="flex h-8 w-8 items-center justify-center bg-muted text-xs font-medium uppercase"
										>
											{member.user.name?.charAt(0) ?? member.user.email.charAt(0)}
										</div>
										<div>
											<p class="text-sm font-medium">{member.user.name}</p>
											<p class="text-xs text-muted-foreground">{member.user.email}</p>
										</div>
									</div>
									<div class="flex items-center gap-2">
										<span
											class="border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground"
										>
											{member.role}
										</span>
										{#if isAdmin && member.role !== 'owner' && member.user.id !== currentUserId}
											<Button
												variant="ghost"
												size="icon-sm"
												class="text-muted-foreground hover:text-destructive"
												onclick={() => askToRemoveMember(member.user.email)}
											>
												<XIcon class="h-3.5 w-3.5" />
											</Button>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<Separator />

					<div class="space-y-4">
						<div>
							<h2 class="text-sm font-medium">Pending Invitations</h2>
							<p class="text-xs text-muted-foreground">
								Share the invite link with the person you're inviting.
							</p>
						</div>

						{#if invitationsLoading}
							<div class="space-y-2">
								{#each [0, 1] as row (row)}
									<Skeleton class="h-12 w-full" />
								{/each}
							</div>
						{:else if pendingInvitations.length === 0}
							<div class="border border-dashed border-border p-6 text-center">
								<p class="text-sm text-muted-foreground">No pending invitations.</p>
							</div>
						{:else}
							<div class="space-y-1">
								{#each pendingInvitations as invitation (invitation.id)}
									<div class="flex items-center justify-between border border-border px-3 py-2">
										<div class="flex items-center gap-3">
											<div class="flex h-8 w-8 items-center justify-center bg-muted text-xs">
												<ClockIcon class="h-3.5 w-3.5 text-muted-foreground" />
											</div>
											<div>
												<p class="text-sm font-medium">{invitation.email}</p>
												<p class="text-xs text-muted-foreground">
													Invited as {invitation.role}
													{#if invitation.expiresAt}
														· expires {new Date(invitation.expiresAt).toLocaleDateString()}
													{/if}
												</p>
											</div>
										</div>
										<div class="flex items-center gap-1">
											<Button
												variant="ghost"
												size="sm"
												class="h-7 gap-1 px-2 text-xs text-muted-foreground"
												onclick={() => void copyInvitationLink(invitation.id)}
											>
												{#if copiedInvitationId === invitation.id}
													<CheckIcon class="h-3 w-3" />
													Copied
												{:else}
													<ClipboardCopyIcon class="h-3 w-3" />
													Copy link
												{/if}
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												class="text-muted-foreground hover:text-destructive"
												onclick={() => askToCancelInvitation(invitation.id, invitation.email)}
											>
												<XIcon class="h-3.5 w-3.5" />
											</Button>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<ConfirmDialog
		bind:open={confirmOpen}
		title={confirmTitle}
		description={confirmDescription}
		{confirmLabel}
		variant="destructive"
		onConfirm={async () => {
			if (confirmAction) {
				await confirmAction();
			}
		}}
	/>
</div>
