<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useMutation, useQuery } from '@mmailaender/convex-svelte';
	import { toast } from 'svelte-sonner';

	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import type { TemplateSchema } from '$convex/lib/templateSchema';
	import LabelBadge from '$lib/components/issues/label-badge.svelte';
	import TemplateFieldRenderer from '$lib/components/issues/template-field-renderer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Textarea } from '$lib/components/ui/textarea';
	import { getWorkspace } from '$lib/workspace-context';

	type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

	const workspace = getWorkspace();
	const createIssue = useMutation(api.issues.create);

	const slug = $derived(page.params.slug ?? '');
	const organizationId = $derived(workspace.organizationId);
	const templatesQuery = useQuery(api.templates.list, () =>
		organizationId ? { organizationId } : 'skip'
	);
	const labelsQuery = useQuery(api.labels.list, () =>
		organizationId ? { organizationId } : 'skip'
	);

	let selectedTemplateId = $state<Id<'issueTemplates'> | null>(null);
	let templateChosen = $state(false);
	let form = $state({
		title: '',
		description: '',
		priority: 'medium' as IssuePriority
	});
	let selectedLabels = $state<Id<'labels'>[]>([]);
	let templateData = $state<Record<string, unknown>>({});
	let submitting = $state(false);

	const templateParam = $derived(
		page.url.searchParams.get('template') ?? page.url.searchParams.get('templates')
	);
	const templates = $derived(templatesQuery.data ?? []);
	const labels = $derived(labelsQuery.data ?? []);

	const selectedTemplateFromSearch = $derived.by(() => {
		if (!templateParam) {
			return undefined;
		}
		if (templateParam === 'blank') {
			return null;
		}

		return templates.find((template) => template._id === templateParam) ?? undefined;
	});

	const selectedTemplate = $derived.by(() => {
		if (selectedTemplateFromSearch !== undefined) {
			return selectedTemplateFromSearch;
		}

		if (!templateChosen) {
			return undefined;
		}

		return templates.find((template) => template._id === selectedTemplateId) ?? null;
	});

	const parsedSchema = $derived.by(() => {
		if (!selectedTemplate) {
			return null;
		}

		try {
			return JSON.parse(selectedTemplate.schema) as TemplateSchema;
		} catch {
			return null;
		}
	});

	const showingForm = $derived(selectedTemplateFromSearch !== undefined || templateChosen);

	function toggleLabel(labelId: Id<'labels'>) {
		selectedLabels = selectedLabels.includes(labelId)
			? selectedLabels.filter((id) => id !== labelId)
			: [...selectedLabels, labelId];
	}

	function chooseTemplate(templateId: Id<'issueTemplates'> | null) {
		selectedTemplateId = templateId;
		templateChosen = true;
		templateData = {};
	}

	async function goBackToSelection() {
		templateChosen = false;
		selectedTemplateId = null;
		templateData = {};
		await goto(`/org/${slug}/issues/new`);
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!organizationId || !form.title.trim()) {
			return;
		}

		submitting = true;
		try {
			const result = await createIssue({
				organizationId,
				title: form.title.trim(),
				description: form.description.trim() || undefined,
				priority: form.priority,
				labelIds: selectedLabels,
				templateId: selectedTemplate?._id,
				templateData:
					Object.keys(templateData).length > 0 ? JSON.stringify(templateData) : undefined
			});

			toast.success(`Issue #${result.number} created`);
			await goto(`/org/${slug}/issues/${result.number}`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create issue');
			submitting = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center gap-3 border-b border-border px-4 py-3">
		{#if showingForm}
			<Button variant="ghost" size="sm" onclick={() => void goBackToSelection()}>
				<ArrowLeftIcon class="h-3.5 w-3.5" />
			</Button>
		{/if}
		<h1 class="text-sm font-bold">
			New Issue
			{#if selectedTemplate}
				<span class="ml-2 font-normal text-muted-foreground">/ {selectedTemplate.name}</span>
			{/if}
		</h1>
	</div>

	<div class="flex-1 overflow-auto p-6">
		{#if !organizationId}
			<div class="space-y-4">
				<Skeleton class="h-8 w-48" />
				<Skeleton class="h-10 w-full" />
				<Skeleton class="h-32 w-full" />
			</div>
		{:else if !showingForm}
			<div class="mx-auto max-w-lg space-y-4">
				<div>
					<h2 class="text-base font-medium">Choose a template</h2>
					<p class="text-sm text-muted-foreground">
						Select a template for structured reporting, or start blank.
					</p>
				</div>

				<div
					class="flex items-center gap-2 border border-border px-3 py-2 text-sm text-muted-foreground"
				>
					<SearchIcon class="h-3.5 w-3.5" />
					<span>Tip: search existing issues before creating a new one.</span>
				</div>

				<button
					type="button"
					onclick={() => chooseTemplate(null)}
					class="flex w-full cursor-pointer items-center gap-3 border border-border p-4 text-left transition-colors hover:bg-accent"
				>
					<FileTextIcon class="h-5 w-5 text-muted-foreground" />
					<div>
						<p class="text-sm font-medium">Blank issue</p>
						<p class="text-xs text-muted-foreground">
							Start from scratch with title and description
						</p>
					</div>
				</button>

				{#if templatesQuery.data === undefined}
					<div class="space-y-2">
						<Skeleton class="h-16 w-full" />
						<Skeleton class="h-16 w-full" />
					</div>
				{:else}
					{#each templates as template (template._id)}
						<button
							type="button"
							onclick={() => chooseTemplate(template._id)}
							class="flex w-full cursor-pointer items-center gap-3 border border-border p-4 text-left transition-colors hover:bg-accent"
						>
							<FileTextIcon class="h-5 w-5 text-muted-foreground" />
							<div>
								<p class="text-sm font-medium">{template.name}</p>
								<p class="text-xs text-muted-foreground">{template.description}</p>
							</div>
						</button>
					{/each}
				{/if}
			</div>
		{:else}
			<form class="mx-auto max-w-lg space-y-6" onsubmit={handleSubmit}>
				<div class="grid gap-4">
					<div class="grid gap-2">
						<Label for="new-issue-title">
							Title <span class="text-destructive">*</span>
						</Label>
						<Input
							id="new-issue-title"
							placeholder="Brief summary of the issue"
							bind:value={form.title}
						/>
					</div>

					<div class="grid gap-2">
						<Label for="new-issue-description">Description</Label>
						<Textarea
							id="new-issue-description"
							rows={4}
							placeholder="Provide more details..."
							bind:value={form.description}
						/>
					</div>

					<div class="grid gap-2">
						<Label for="new-issue-priority">Priority</Label>
						<select
							id="new-issue-priority"
							class="h-8 w-full rounded-none border border-input bg-background px-2 text-sm text-foreground outline-none"
							bind:value={form.priority}
						>
							<option value="low">Low</option>
							<option value="medium">Medium</option>
							<option value="high">High</option>
							<option value="urgent">Urgent</option>
						</select>
					</div>

					<div class="grid gap-2">
						<Label>Labels</Label>
						<div class="flex flex-wrap gap-2">
							{#if labels.length === 0}
								<p class="text-xs text-muted-foreground">No labels configured yet.</p>
							{:else}
								{#each labels as label (label._id)}
									<button
										type="button"
										class:selected={selectedLabels.includes(label._id)}
										class="cursor-pointer transition-opacity"
										onclick={() => toggleLabel(label._id)}
									>
										<LabelBadge
											name={label.name}
											color={label.color}
											class={!selectedLabels.includes(label._id) ? 'opacity-40' : ''}
										/>
									</button>
								{/each}
							{/if}
						</div>
					</div>
				</div>

				{#if parsedSchema}
					<div class="space-y-4">
						<div>
							<h2 class="text-sm font-medium">{selectedTemplate?.name}</h2>
							<p class="text-xs text-muted-foreground">{selectedTemplate?.description}</p>
						</div>

						{#each parsedSchema.fields as field (field.key)}
							<TemplateFieldRenderer
								{field}
								bind:value={templateData[field.key]}
								{organizationId}
							/>
						{/each}
					</div>
				{/if}

				<div class="flex gap-3">
					<Button type="submit" class="flex-1" disabled={submitting || !form.title.trim()}>
						{submitting ? 'Creating...' : 'Create Issue'}
					</Button>
					<Button type="button" variant="outline" onclick={() => void goto(`/org/${slug}`)}>
						Cancel
					</Button>
				</div>
			</form>
		{/if}
	</div>
</div>
