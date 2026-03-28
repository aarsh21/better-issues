<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useMutation, useQuery } from '@mmailaender/convex-svelte';
	import { toast } from 'svelte-sonner';

	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import type { TemplateSchema } from '$convex/lib/templateSchema';
	import { getIssueSnapshot } from '$lib/issue-snapshot-cache';
	import ConfirmDialog from '$lib/components/confirm-dialog.svelte';
	import LabelBadge from '$lib/components/issues/label-badge.svelte';
	import PriorityIndicator from '$lib/components/issues/priority-indicator.svelte';
	import StatusBadge from '$lib/components/issues/status-badge.svelte';
	import TemplateFieldRenderer from '$lib/components/issues/template-field-renderer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Textarea } from '$lib/components/ui/textarea';
	import { formatDate } from '$lib/utils';
	import { getWorkspace } from '$lib/workspace-context';

	type IssueStatus = 'open' | 'in_progress' | 'closed';
	type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

	const workspace = getWorkspace();
	const slug = $derived(page.params.slug ?? '');
	const issueNumber = $derived(Number.parseInt(page.params.number ?? '', 10));
	const organizationId = $derived(workspace.organizationId);

	const issueQuery = useQuery(api.issues.getByNumber, () =>
		organizationId && Number.isFinite(issueNumber)
			? { organizationId, number: issueNumber }
			: 'skip'
	);
	const labelsQuery = useQuery(api.labels.list, () =>
		organizationId ? { organizationId } : 'skip'
	);
	const templateQuery = useQuery(api.templates.get, () =>
		issueQuery.data?.templateSchemaSnapshot || !issueQuery.data?.templateId
			? 'skip'
			: { templateId: issueQuery.data.templateId }
	);

	const updateIssue = useMutation(api.issues.update);
	const updateStatus = useMutation(api.issues.updateStatus);
	const removeIssue = useMutation(api.issues.remove);

	let editing = $state(false);
	let editTitle = $state('');
	let editDescription = $state('');
	let deleteOpen = $state(false);

	const cachedIssue = $derived(
		organizationId && Number.isFinite(issueNumber)
			? getIssueSnapshot(organizationId, issueNumber)
			: undefined
	);
	const issue = $derived(issueQuery.data ?? cachedIssue);
	const labels = $derived(labelsQuery.data ?? []);
	const parsedTemplateData = $derived.by(() => {
		if (!issue?.templateData) {
			return {} as Record<string, unknown>;
		}

		try {
			return JSON.parse(issue.templateData) as Record<string, unknown>;
		} catch {
			return {};
		}
	});
	const parsedSchema = $derived.by(() => {
		const schemaJson = issue?.templateSchemaSnapshot ?? templateQuery.data?.schema;

		if (!schemaJson) {
			return null;
		}

		try {
			return JSON.parse(schemaJson) as TemplateSchema;
		} catch {
			return null;
		}
	});
	const templateTitle = $derived(
		issue?.templateNameSnapshot ?? templateQuery.data?.name ?? 'Template Data'
	);

	function startEdit() {
		if (!issue) return;
		editTitle = issue.title;
		editDescription = issue.description ?? '';
		editing = true;
	}

	async function saveEdit() {
		if (!issue) return;

		try {
			await updateIssue({
				issueId: issue._id,
				title: editTitle.trim(),
				description: editDescription.trim() || undefined
			});
			editing = false;
			toast.success('Issue updated');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update issue');
		}
	}

	async function changeStatus(status: IssueStatus) {
		if (!issue) return;
		try {
			await updateStatus({ issueId: issue._id, status });
			toast.success(`Status changed to ${status.replace('_', ' ')}`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update status');
		}
	}

	async function changePriority(priority: IssuePriority) {
		if (!issue) return;
		try {
			await updateIssue({ issueId: issue._id, priority });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update priority');
		}
	}

	async function toggleLabel(labelId: Id<'labels'>) {
		if (!issue) return;

		const nextLabels = issue.labelIds.includes(labelId)
			? issue.labelIds.filter((id) => id !== labelId)
			: [...issue.labelIds, labelId];

		try {
			await updateIssue({ issueId: issue._id, labelIds: nextLabels });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to update labels');
		}
	}

	async function deleteIssue() {
		if (!issue) return;
		try {
			await removeIssue({ issueId: issue._id });
			toast.success('Issue deleted');
			await goto(`/org/${slug}`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete issue');
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center justify-between border-b border-border px-4 py-3">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="sm" href={`/org/${slug}`}>
				<ArrowLeftIcon class="h-3.5 w-3.5" />
			</Button>
			{#if issue}
				<span class="font-mono text-sm text-muted-foreground">#{issue.number}</span>
			{:else}
				<Skeleton class="h-4 w-10" />
			{/if}
		</div>
		{#if issue}
			<div class="flex items-center gap-2">
				<Button variant="ghost" size="sm" class="gap-1.5" onclick={startEdit}>
					<PencilIcon class="h-3.5 w-3.5" />
					Edit
				</Button>
				<Button
					variant="ghost"
					size="sm"
					class="text-destructive hover:text-destructive"
					onclick={() => (deleteOpen = true)}
				>
					<Trash2Icon class="h-3.5 w-3.5" />
				</Button>
			</div>
		{/if}
	</div>

	<div class="flex-1 overflow-auto">
		{#if organizationId === undefined || issue === undefined}
			<div class="space-y-4 p-6">
				<Skeleton class="h-8 w-40" />
				<Skeleton class="h-10 w-full" />
				<Skeleton class="h-32 w-full" />
			</div>
		{:else if issue === null}
			<div class="flex h-full flex-col items-center justify-center gap-3">
				<p class="text-sm font-medium">Issue not found</p>
				<Button variant="outline" size="sm" href={`/org/${slug}`}>Back to issues</Button>
			</div>
		{:else}
			<div class="mx-auto grid max-w-3xl gap-8 p-6 md:grid-cols-[1fr_220px]">
				<div class="space-y-6">
					{#if editing}
						<div class="space-y-4">
							<Input bind:value={editTitle} class="text-lg font-bold" />
							<Textarea bind:value={editDescription} rows={6} placeholder="Description..." />
							<div class="flex gap-2">
								<Button size="sm" onclick={() => void saveEdit()}>Save</Button>
								<Button size="sm" variant="outline" onclick={() => (editing = false)}>Cancel</Button
								>
							</div>
						</div>
					{:else}
						<div>
							<h1 class="text-lg font-bold">{issue.title}</h1>
							{#if issue.description}
								<p class="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">
									{issue.description}
								</p>
							{/if}
						</div>
					{/if}

					{#if parsedSchema && Object.keys(parsedTemplateData).length > 0}
						<Separator />
						<div class="space-y-4">
							<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
								{templateTitle}
							</p>
							{#each parsedSchema.fields as field (field.key)}
								{#if parsedTemplateData[field.key] !== undefined && parsedTemplateData[field.key] !== ''}
									<TemplateFieldRenderer
										{field}
										value={parsedTemplateData[field.key]}
										readOnly
										{organizationId}
										issueId={issue._id}
									/>
								{/if}
							{/each}
						</div>
					{/if}
				</div>

				<div class="space-y-6">
					<div class="space-y-3">
						<Label
							for="issue-status"
							class="text-xs tracking-wider text-muted-foreground uppercase"
						>
							Status
						</Label>
						<div class="flex items-center gap-2 border border-border px-2 py-2">
							<StatusBadge status={issue.status} />
							<select
								id="issue-status"
								class="w-full bg-background text-sm outline-none"
								value={issue.status}
								onchange={(event) =>
									void changeStatus(
										(event.currentTarget as HTMLSelectElement).value as IssueStatus
									)}
							>
								<option value="open">Open</option>
								<option value="in_progress">In Progress</option>
								<option value="closed">Closed</option>
							</select>
						</div>
					</div>

					<div class="space-y-3">
						<Label
							for="issue-priority"
							class="text-xs tracking-wider text-muted-foreground uppercase"
						>
							Priority
						</Label>
						<div class="flex items-center gap-2 border border-border px-2 py-2">
							<PriorityIndicator priority={issue.priority} />
							<select
								id="issue-priority"
								class="w-full bg-background text-sm outline-none"
								value={issue.priority}
								onchange={(event) =>
									void changePriority(
										(event.currentTarget as HTMLSelectElement).value as IssuePriority
									)}
							>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
								<option value="urgent">Urgent</option>
							</select>
						</div>
					</div>

					<div class="space-y-3">
						<Label class="text-xs tracking-wider text-muted-foreground uppercase">Labels</Label>
						<div class="flex flex-wrap gap-2">
							{#if labels.length === 0}
								<span class="text-xs text-muted-foreground">No labels configured</span>
							{:else}
								{#each labels as label (label._id)}
									<button
										type="button"
										class={!issue.labelIds.includes(label._id) ? 'opacity-40' : ''}
										onclick={() => void toggleLabel(label._id)}
									>
										<LabelBadge name={label.name} color={label.color} />
									</button>
								{/each}
							{/if}
						</div>
					</div>

					<Separator />

					<div class="space-y-2 text-xs text-muted-foreground">
						<div class="flex items-center gap-1.5">
							<ClockIcon class="h-3 w-3" />
							Created {formatDate(issue.createdAt)}
						</div>
						{#if issue.updatedAt !== issue.createdAt}
							<div class="flex items-center gap-1.5">
								<ClockIcon class="h-3 w-3" />
								Updated {formatDate(issue.updatedAt)}
							</div>
						{/if}
						{#if issue.closedAt}
							<div class="flex items-center gap-1.5">
								<ClockIcon class="h-3 w-3" />
								Closed {formatDate(issue.closedAt)}
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>

	<ConfirmDialog
		bind:open={deleteOpen}
		title="Delete issue"
		description="Are you sure you want to delete this issue? This action cannot be undone."
		confirmLabel="Delete"
		variant="destructive"
		onConfirm={deleteIssue}
	/>
</div>
