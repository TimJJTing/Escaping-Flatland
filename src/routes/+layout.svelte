<script>
	import '../app.css';

	/** @type {{ children?: import('svelte').Snippet }} */
	let { children } = $props();
</script>

<div class="app">
	{@render children?.()}
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
