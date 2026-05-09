<script>
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner';

	/** @type {{ children?: import('svelte').Snippet }} */
	let { children } = $props();
</script>

<div class="app">
	{@render children?.()}
	<Toaster position="bottom-center" theme="dark" />
</div>

<style>
	.app {
		margin: 0;
		padding: 0;
		width: 100vw;
		height: 100vh;
		background-color: black;
		color: white;
		box-sizing: border-box;
		overflow: hidden;
	}
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: black;
	}
</style>
