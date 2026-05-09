<script>
	import { fade } from 'svelte/transition';
	let { loading } = $props();
</script>

{#if loading}
	<div class="overlay" transition:fade={{ duration: 600 }}>
		<div class="stars">
			<span class="dot blue" style="--d:0s"></span>
			<span class="dot orange" style="--d:0.25s"></span>
			<span class="dot cyan" style="--d:0.5s"></span>
			<span class="dot pink" style="--d:0.75s"></span>
			<span class="dot green" style="--d:1s"></span>
		</div>
		<p class="label">Mapping the galaxy</p>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: #121215;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 24px;
	}
	.stars {
		display: flex;
		gap: 12px;
		align-items: center;
	}
	.dot {
		border-radius: 50%;
		animation: tw 1.6s ease-in-out infinite var(--d);
	}
	.blue   { width: 5px; height: 5px; background: #6af; box-shadow: 0 0 8px #6af; }
	.orange { width: 7px; height: 7px; background: #fa6; box-shadow: 0 0 10px #fa6; }
	.cyan   { width: 4px; height: 4px; background: #adf; box-shadow: 0 0 7px #adf; }
	.pink   { width: 6px; height: 6px; background: #f8a; box-shadow: 0 0 9px #f8a; }
	.green  { width: 5px; height: 5px; background: #afa; box-shadow: 0 0 8px #afa; }
	.label {
		color: #555;
		font-size: 11px;
		letter-spacing: 4px;
		text-transform: uppercase;
	}
	@keyframes tw {
		0%, 100% { opacity: 0.15; transform: scale(0.6); }
		50%       { opacity: 1;    transform: scale(1.3); }
	}
</style>
