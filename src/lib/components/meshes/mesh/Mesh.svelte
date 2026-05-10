<script>
	import { onMount, onDestroy } from 'svelte';
	import {
		getScene,
		getFuncPipelines,
		getPostprocessor
	} from '$lib/components/providers/scene';
	import { usePostProcessor, useRaycast } from '../utils';
	
	/**
	 * @typedef {Object} Props
	 * @property {any} mesh - mesh to add into scene
	 * @property {boolean} [raycast] - enable raycasting?
	 * @property {boolean} [postprocess] - add to postprocess?
	 */

	/** @type {Props} */
	let { mesh, raycast = false, postprocess = false } = $props();

	let id = {};
	let scene = getScene();
	let funcPipelines = getFuncPipelines();
	let postprocessor = getPostprocessor();

	$effect(() => {
		useRaycast(raycast, mesh?.getMesh());
	});
	$effect(() => {
		usePostProcessor(postprocess, $postprocessor, mesh?.getMesh());
	});

	onMount(() => {
		// add mesh into scene
		if ($scene) {
			$scene.add(mesh.getMesh());
		}
		$funcPipelines.registerUpdateFunc(id, () => {
			mesh.update();
		});
	});

	onDestroy(() => {
		$funcPipelines.deregisterUpdateFunc(id);
		$scene?.remove(mesh.getMesh());
		mesh.dispose();
	});
</script>
