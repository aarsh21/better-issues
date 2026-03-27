<script lang="ts">
	import { page } from '$app/state';

	import { Button } from '$lib/components/ui/button';
</script>

<div class="flex h-svh items-center justify-center">
	<div class="max-w-sm space-y-4 p-8 text-center">
		{#if page.status === 404}
			<h2 class="text-sm font-bold">Not Found</h2>
			<p class="text-muted-foreground text-xs">
				The page you are looking for does not exist.
			</p>
		{:else}
			<h2 class="text-sm font-bold">Something went wrong</h2>
			<p class="text-muted-foreground text-xs">
				{page.error?.message ?? 'An unexpected error occurred.'}
			</p>
		{/if}
		<Button variant="outline" size="sm" href="/">Go home</Button>
	</div>
</div>
