<script>
	import { run } from 'svelte/legacy';

	import { onMount, onDestroy } from 'svelte';
	import {
		getScene,
		getCamera,
		getFuncPipelines,
		getPostprocessor
	} from '$lib/components/providers/scene';
	import { buildPointOctree } from './buildPointOctree';
	import { FrustumCuller } from '$lib/utils/FrustumCuller';
	import { usePostProcessor } from '../utils';


	

	
	/**
	 * @typedef {Object} Props
	 * @property {any} positions
	 * @property {any} groups
	 * @property {any} ids
	 * @property {any} groupColors
	 * @property {boolean} [postprocess] - add to postprocess?
	 * @property {undefined|import('sparse-octree').PointOctree<any>} [octree]
	 */

	/** @type {Props} */
	let {
		positions,
		groups,
		ids,
		groupColors,
		postprocess = false,
		octree = $bindable(undefined)
	} = $props();

	/**
	 * @type {undefined|FrustumCuller}
	 */
	let frustumCuller = undefined;
	/**
	 * @type {import('three').Mesh|undefined}
	 */
	let fcHDParticles = $state(undefined);
	/**
	 * @type {import('three').Mesh|undefined}
	 */
	let fcSDParticles = $state();
	/**
	 * @type {import('three').Mesh|undefined}
	 */
	let fcLDParticles = $state();

	let id = {};
	let scene = getScene();
	let camera = getCamera();
	let funcPipelines = getFuncPipelines();
	let postprocessor = getPostprocessor();

	run(() => {
		usePostProcessor(postprocess, $postprocessor, fcHDParticles);
	});
	run(() => {
		usePostProcessor(postprocess, $postprocessor, fcSDParticles);
	});
	run(() => {
		usePostProcessor(postprocess, $postprocessor, fcLDParticles);
	});

	onMount(() => {
		// add mesh into scene
		if ($scene && $camera) {
			octree = buildPointOctree($scene, positions, groups, ids);

			// Frustum culling for Octree
			frustumCuller = new FrustumCuller(octree, $camera, 500, 600);
			// frustum culled points are points with more detail and interactive
			fcHDParticles = frustumCuller.getHDMesh();
			$scene.add(fcHDParticles);

			fcSDParticles = frustumCuller.getSDMesh();
			$scene.add(fcSDParticles);

			fcLDParticles = frustumCuller.getLDMesh();
			$scene.add(fcLDParticles);
			// if ($option.octantHelperEnabled) scene.add(frustumCuller.getOctantHelper());
			// if ($option.cameraHelperEnabled) scene.add(frustumCuller.getCameraHelper());
			// if ($option.labelsEnabled) scene.add(frustumCuller.getLabels());

			// compute for the first render
			frustumCuller.cull(groupColors);
			
			// make frustumCamera to stay in sync
			$funcPipelines.registerCameraFunc(id, () => {
				frustumCuller.cull(groupColors);
			});
		}
	});

	onDestroy(() => {
		$funcPipelines.deregisterCameraFunc(id);
		if (frustumCuller) {
			$scene?.remove(frustumCuller.getHDMesh());
			$scene?.remove(frustumCuller.getSDMesh());
			$scene?.remove(frustumCuller.getLDMesh());
			frustumCuller.dispose();
		}
	});
</script>
