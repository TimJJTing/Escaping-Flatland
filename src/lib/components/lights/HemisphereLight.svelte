<script>
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { getSceneContext } from '$lib/components/providers/scene';




	/**
	 * @typedef {Object} Props
	 * @property {THREE.ColorRepresentation} skyColor
	 * @property {THREE.ColorRepresentation} groundColor
	 * @property {number} intensity
	 */

	/** @type {Props} */
	let { skyColor, groundColor, intensity } = $props();

	const ctx = getSceneContext();

	/**
	 * @type {THREE.HemisphereLight}
	 */
	let light;

	onMount(() => {
		if (ctx.scene) {
			light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
			// light direction: default = up -> down
			light.position.set(0, 1, 0);
			ctx.scene.add(light);
		}
		return () => {
			if (light) {
				ctx.scene?.remove(light);
				light.dispose();
			}
		};
	});
</script>
