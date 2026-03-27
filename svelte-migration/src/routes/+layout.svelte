<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { ModeWatcher } from 'mode-watcher';
	import { authClient } from '$lib/auth-client';
	import { Toaster } from '$lib/components/ui/sonner';

	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	createSvelteAuthClient({
		authClient,
		getServerState: () => data.authState
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />
<Toaster richColors />
{@render children()}
