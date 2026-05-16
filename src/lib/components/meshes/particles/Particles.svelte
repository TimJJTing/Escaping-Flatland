<script>
	import { onMount, onDestroy } from 'svelte';
	import { getSceneContext } from '$lib/components/providers/scene';
	import { Particles } from '$lib/meshes/particles';

	/**
	 * @typedef {Object} Props
	 * @property {number[]} positions
	 * @property {number[]} colors
	 * @property {number[]} groups
	 */

	/** @type {Props} */
	let { positions, colors, groups } = $props();

	const ctx = getSceneContext();
	const id = {};
	const particles = new Particles(positions, colors, groups);

	onMount(() => {
		ctx.scene?.add(particles.getMesh());
		ctx.registerUpdateFunc(id, () => particles.update());
	});

	onDestroy(() => {
		ctx.deregisterUpdateFunc(id);
		ctx.scene?.remove(particles.getMesh());
		particles.dispose();
	});
</script>
