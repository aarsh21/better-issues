<script lang="ts">
	let { class: className = '', ...restProps }: { class?: string } & Record<string, unknown> =
		$props();
</script>

<!-- Minimal stand-in for @lucide icons in Vitest browser tests. -->
<span class={['icon-stub', className]} {...restProps}></span>
