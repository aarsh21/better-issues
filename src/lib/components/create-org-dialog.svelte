<script lang="ts">
	import {
		createOrganization,
		setActiveOrganization,
		slugifyOrganizationName,
		type OrganizationSummary
	} from '$lib/organization';
	import { gotoResolvedPath } from '$lib/goto-resolved';

	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let {
		open = $bindable(false)
	}: {
		open?: boolean;
	} = $props();

	let name = $state('');
	let slug = $state('');
	let loading = $state(false);
	let formError = $state<string | null>(null);

	function onNameInput(value: string) {
		name = value;
		slug = slugifyOrganizationName(value);
	}

	function resetForm() {
		name = '';
		slug = '';
		formError = null;
	}

	async function onSubmit(e: Event) {
		e.preventDefault();
		const trimmedName = name.trim();
		const trimmedSlug = slug.trim();
		if (!trimmedName || !trimmedSlug) return;

		loading = true;
		formError = null;

		let created: OrganizationSummary | null = null;

		try {
			created = await createOrganization({ name: trimmedName, slug: trimmedSlug });
		} catch (err) {
			formError = err instanceof Error ? err.message : 'Failed to create team';
			loading = false;
			return;
		}

		if (!created) {
			formError = 'Failed to create team';
			loading = false;
			return;
		}

		try {
			await setActiveOrganization({ organizationId: created.id });
		} catch (err) {
			formError = err instanceof Error ? err.message : 'Failed to activate team';
			loading = false;
			return;
		}

		open = false;
		resetForm();
		loading = false;
		await gotoResolvedPath(`/org/${created.slug}`);
	}
</script>

<Dialog.Root
	bind:open
	onOpenChange={(next) => {
		if (next) {
			formError = null;
		}
	}}
>
	<Dialog.Content class="sm:max-w-md">
		<form onsubmit={onSubmit}>
			<Dialog.Header>
				<Dialog.Title>Create team</Dialog.Title>
				<Dialog.Description>
					Teams are workspaces where your people track and resolve issues together.
				</Dialog.Description>
			</Dialog.Header>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="org-name">Name</Label>
					<Input
						id="org-name"
						placeholder="Backend"
						value={name}
						oninput={(e) => onNameInput(e.currentTarget.value)}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="org-slug">Slug</Label>
					<Input
						id="org-slug"
						placeholder="backend"
						bind:value={slug}
					/>
					<p class="text-xs text-muted-foreground">Used in URLs: /org/{slug || '…'}</p>
				</div>
				{#if formError}
					<p class="text-xs text-destructive" role="alert">{formError}</p>
				{/if}
			</div>
			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" disabled={loading || !name.trim() || !slug.trim()}>
					{loading ? 'Creating...' : 'Create'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
