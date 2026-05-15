<script>
	import { onMount, onDestroy } from 'svelte';
	import { getSceneContext } from '$lib/components/providers/scene';
	import { usePostProcessor, useRaycast } from '../utils';

	/**
	 * @typedef {Object} Props
	 * @property {any} mesh - mesh to add into scene
	 * @property {boolean} [raycast] - enable raycasting?
	 * @property {boolean} [postprocess] - add to postprocess?
	 */

	/** @type {Props} */
	let { mesh, raycast = false, postprocess = false } = $props();

	const id = {};
	const ctx = getSceneContext();

	$effect(() => {
		useRaycast(raycast, mesh?.getMesh());
	});
	$effect(() => {
		usePostProcessor(postprocess, ctx.postprocessor, mesh?.getMesh());
	});

	onMount(() => {
		// add mesh into scene
		if (ctx.scene) {
			ctx.scene.add(mesh.getMesh());
		}
		ctx.registerUpdateFunc(id, () => {
			mesh.update();
		});
	});

	onDestroy(() => {
		ctx.deregisterUpdateFunc(id);
		ctx.scene?.remove(mesh.getMesh());
		mesh.dispose();
	});
</script>
