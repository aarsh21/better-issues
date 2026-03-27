<script lang="ts">
	import { page } from '$app/state';

	import IssueListBody from '$lib/components/issues/issue-list-body.svelte';
	import { parseIssueStatusParam } from '$lib/components/issues/issue-status';
	import { gotoResolvedPath } from '$lib/goto-resolved';
	import { getWorkspace } from '$lib/workspace-context';

	const workspace = getWorkspace();

	const slug = $derived(page.params.slug ?? '');

	const statusFilter = $derived(parseIssueStatusParam(page.url.searchParams.get('status')));

	async function handleStatusChange(next: typeof statusFilter) {
		const base = `/org/${slug}`;
		const path = next ? `${base}?status=${next}` : base;
		await gotoResolvedPath(path);
	}
</script>

<IssueListBody
	{slug}
	organizationId={workspace.organizationId}
	{statusFilter}
	onStatusChange={(s) => void handleStatusChange(s)}
/>
