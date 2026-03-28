<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useMutation } from '@mmailaender/convex-svelte';
	import { toast } from 'svelte-sonner';

	import { api } from '$convex/_generated/api';
	import {
		TEMPLATE_FIELD_TYPES,
		type TemplateField,
		type TemplateSchema
	} from '$convex/lib/templateSchema';
	import TemplateFieldRenderer from '$lib/components/issues/template-field-renderer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { getWorkspace } from '$lib/workspace-context';

	type TemplateFieldDraft = TemplateField & { id: string };

	const workspace = getWorkspace();
	const createTemplate = useMutation(api.templates.create);

	const slug = $derived(page.params.slug ?? '');
	const organizationId = $derived(workspace.organizationId);

	let form = $state({
		name: '',
		description: ''
	});
	let fields = $state<TemplateFieldDraft[]>([
		{
			id: crypto.randomUUID(),
			key: '',
			label: '',
			type: 'text',
			required: false
		}
	]);
	let preview = $state(false);
	let submitting = $state(false);

	const previewSchema = $derived<TemplateSchema>({
		fields: fields.filter((field) => field.key && field.label).map(({ id: _id, ...field }) => field)
	});

	const jsonPreview = $derived(
		JSON.stringify({ fields: fields.filter((field) => field.key && field.label) }, null, 2)
	);

	function addField() {
		fields = [
			...fields,
			{
				id: crypto.randomUUID(),
				key: '',
				label: '',
				type: 'text',
				required: false
			}
		];
	}

	function updateField(index: number, updates: Partial<TemplateFieldDraft>) {
		fields = fields.map((field, fieldIndex) =>
			fieldIndex === index ? { ...field, ...updates } : field
		);
	}

	function removeField(index: number) {
		if (fields.length <= 1) return;
		fields = fields.filter((_, fieldIndex) => fieldIndex !== index);
	}

	async function handleSubmit() {
		if (!organizationId || !form.name.trim()) return;

		const validFields = fields.filter((field) => field.key && field.label);
		if (validFields.length === 0) {
			toast.error('Add at least one valid field with key and label');
			return;
		}

		submitting = true;
		try {
			await createTemplate({
				organizationId,
				name: form.name.trim(),
				description: form.description.trim(),
				schema: JSON.stringify({
					fields: validFields.map(({ id: _id, ...field }) => field)
				} satisfies TemplateSchema)
			});
			toast.success('Template created');
			await goto(`/org/${slug}/settings?tab=templates`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create template');
			submitting = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center justify-between border-b border-border px-4 py-3">
		<div class="flex items-center gap-3">
			<Button variant="ghost" size="sm" href={`/org/${slug}/settings?tab=templates`}>
				<ArrowLeftIcon class="h-3.5 w-3.5" />
			</Button>
			<h1 class="text-sm font-bold">New Template</h1>
		</div>
		<Button variant="outline" size="sm" onclick={() => (preview = !preview)}>
			{preview ? 'Edit' : 'Preview'}
		</Button>
	</div>

	<div class="flex-1 overflow-auto p-6">
		{#if preview}
			<div class="mx-auto max-w-lg space-y-6">
				<div>
					<h2 class="text-base font-medium">Preview: {form.name || 'Untitled'}</h2>
					<p class="text-sm text-muted-foreground">{form.description || 'No description'}</p>
				</div>
				<Separator />

				{#if previewSchema.fields.length > 0}
					<div class="space-y-4">
						{#each previewSchema.fields as field (field.key)}
							<TemplateFieldRenderer {field} readOnly value={undefined} {organizationId} />
						{/each}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">
						No valid fields to preview. Add fields with key and label.
					</p>
				{/if}
			</div>
		{:else}
			<div class="mx-auto max-w-lg space-y-6">
				<div class="grid gap-4">
					<div class="grid gap-2">
						<Label for="template-name">
							Template Name <span class="text-destructive">*</span>
						</Label>
						<Input id="template-name" placeholder="Bug Report" bind:value={form.name} />
					</div>

					<div class="grid gap-2">
						<Label for="template-description">Description</Label>
						<Input
							id="template-description"
							placeholder="Standard template for reporting bugs"
							bind:value={form.description}
						/>
					</div>
				</div>

				<Separator />

				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<Label class="text-xs tracking-wider text-muted-foreground uppercase">Fields</Label>
						<Button type="button" variant="outline" size="sm" class="gap-1.5" onclick={addField}>
							<PlusIcon class="h-3 w-3" />
							Add Field
						</Button>
					</div>

					{#each fields as field, index (field.id)}
						<div class="space-y-3 border border-border p-3">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-1.5">
									<GripVerticalIcon class="h-3.5 w-3.5 text-muted-foreground" />
									<span class="font-mono text-xs text-muted-foreground">Field {index + 1}</span>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									disabled={fields.length <= 1}
									class="text-muted-foreground hover:text-destructive"
									onclick={() => removeField(index)}
								>
									<Trash2Icon class="h-3 w-3" />
								</Button>
							</div>

							<div class="grid grid-cols-2 gap-3">
								<div class="grid gap-1.5">
									<Label for={`field-key-${field.id}`} class="text-xs">Key (camelCase)</Label>
									<Input
										id={`field-key-${field.id}`}
										placeholder="stepsToReproduce"
										value={field.key}
										class="h-8 font-mono text-sm"
										onchange={(event) =>
											updateField(index, { key: (event.currentTarget as HTMLInputElement).value })}
									/>
								</div>
								<div class="grid gap-1.5">
									<Label for={`field-label-${field.id}`} class="text-xs">Label</Label>
									<Input
										id={`field-label-${field.id}`}
										placeholder="Steps to Reproduce"
										value={field.label}
										class="h-8 text-sm"
										onchange={(event) =>
											updateField(index, {
												label: (event.currentTarget as HTMLInputElement).value
											})}
									/>
								</div>
							</div>

							<div class="grid grid-cols-2 gap-3">
								<div class="grid gap-1.5">
									<Label for={`field-type-${field.id}`} class="text-xs">Type</Label>
									<select
										id={`field-type-${field.id}`}
										class="h-8 w-full rounded-none border border-input bg-background px-2 text-sm text-foreground outline-none"
										value={field.type}
										onchange={(event) =>
											updateField(index, {
												type: (event.currentTarget as HTMLSelectElement)
													.value as TemplateField['type']
											})}
									>
										{#each TEMPLATE_FIELD_TYPES as fieldType (fieldType)}
											<option value={fieldType}>{fieldType}</option>
										{/each}
									</select>
								</div>
								<div class="flex items-end gap-2 pb-0.5">
									<div class="flex items-center gap-2">
										<Checkbox
											id={`required-${field.id}`}
											checked={field.required}
											onCheckedChange={(checked) =>
												updateField(index, { required: checked === true })}
										/>
										<Label for={`required-${field.id}`} class="cursor-pointer text-xs"
											>Required</Label
										>
									</div>
								</div>
							</div>

							{#if field.type === 'select'}
								<div class="grid gap-1.5">
									<Label for={`field-options-${field.id}`} class="text-xs"
										>Options (comma-separated)</Label
									>
									<Input
										id={`field-options-${field.id}`}
										placeholder="critical, major, minor, cosmetic"
										value={field.options?.join(', ') ?? ''}
										class="h-8 text-sm"
										onchange={(event) =>
											updateField(index, {
												options: (event.currentTarget as HTMLInputElement).value
													.split(',')
													.map((option) => option.trim())
													.filter(Boolean)
											})}
									/>
								</div>
							{/if}

							{#if field.type === 'file'}
								<div class="grid gap-3">
									<div class="flex items-center gap-2">
										<Checkbox
											id={`multiple-${field.id}`}
											checked={field.multiple !== false}
											onCheckedChange={(checked) =>
												updateField(index, { multiple: checked === true })}
										/>
										<Label for={`multiple-${field.id}`} class="cursor-pointer text-xs">
											Allow multiple files
										</Label>
									</div>
									<div class="grid gap-1.5">
										<Label for={`accept-${field.id}`} class="text-xs"
											>Accepted file types (optional)</Label
										>
										<Input
											id={`accept-${field.id}`}
											placeholder="image/*,.pdf"
											value={field.accept ?? ''}
											class="h-8 text-sm"
											onchange={(event) =>
												updateField(index, {
													accept: (event.currentTarget as HTMLInputElement).value || undefined
												})}
										/>
									</div>
								</div>
							{:else}
								<div class="grid gap-1.5">
									<Label for={`placeholder-${field.id}`} class="text-xs"
										>Placeholder (optional)</Label
									>
									<Input
										id={`placeholder-${field.id}`}
										placeholder="Enter placeholder text..."
										value={field.placeholder ?? ''}
										class="h-8 text-sm"
										onchange={(event) =>
											updateField(index, {
												placeholder: (event.currentTarget as HTMLInputElement).value || undefined
											})}
									/>
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<Separator />

				<div class="space-y-2">
					<Label class="text-xs tracking-wider text-muted-foreground uppercase">JSON Schema</Label>
					<pre
						class="overflow-auto border border-border bg-muted p-3 font-mono text-xs">{jsonPreview}</pre>
				</div>

				<div class="flex gap-3">
					<Button
						type="button"
						class="flex-1"
						disabled={submitting || !form.name.trim() || fields.length === 0}
						onclick={() => void handleSubmit()}
					>
						{submitting ? 'Creating...' : 'Create Template'}
					</Button>
					<Button type="button" variant="outline" href={`/org/${slug}/settings?tab=templates`}>
						Cancel
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
