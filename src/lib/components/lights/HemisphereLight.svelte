<script>
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { getScene } from '$lib/components/providers/scene';

	/**
	 * @type {THREE.ColorRepresentation}
	 */
	export let skyColor;
	/**
	 * @type {THREE.ColorRepresentation}
	 */
	export let groundColor;
	/**
	 * @type {number}
	 */
	export let intensity;

	let scene = getScene();

	/**
	 * @type {THREE.HemisphereLight}
	 */
	let light;

	onMount(() => {
		if ($scene) {
			light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
			// light direction: default = up -> down
			light.position.set(0, 1, 0);
			$scene.add(light);
		}
		return () => {
			if (light) {
				$scene?.remove(light);
				light.dispose();
			}
		};
	});
</script>
