<script>

	import { onMount, onDestroy } from 'svelte';
	import {
		getScene,
		getCamera,
		getFuncPipelines,
		getPostprocessor,
		getOptions
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
	 * @property {boolean} [postprocess]
	 * @property {undefined|import('sparse-octree').PointOctree<any>} [octree]
	 * @property {undefined|FrustumCuller} [frustumCullerRef]
	 */

	/** @type {Props} */
	let {
		positions,
		groups,
		ids,
		groupColors,
		postprocess = false,
		octree = $bindable(undefined),
		frustumCullerRef = $bindable(undefined)
	} = $props();

	/** @type {undefined|FrustumCuller} */
	let frustumCuller = undefined;
	/** @type {import('three').Mesh|undefined} */
	let fcHDParticles = $state(undefined);
	/** @type {import('three').Mesh|undefined} */
	let fcSDParticles = $state();
	/** @type {import('three').Mesh|undefined} */
	let fcLDParticles = $state();

	let labelsInScene = false;

	let id = {};
	let scene = getScene();
	let camera = getCamera();
	let funcPipelines = getFuncPipelines();
	let postprocessor = getPostprocessor();
	let options = getOptions();

	$effect(() => {
		usePostProcessor(postprocess, $postprocessor, fcHDParticles);
	});
	$effect(() => {
		usePostProcessor(postprocess, $postprocessor, fcSDParticles);
	});
	$effect(() => {
		usePostProcessor(postprocess, $postprocessor, fcLDParticles);
	});

	$effect(() => {
		if (!frustumCuller || !$scene) return;
		const labelMesh = frustumCuller.getLabels();
		if ($options.labelsEnabled && !labelsInScene) {
			$scene.add(labelMesh);
			labelsInScene = true;
		} else if (!$options.labelsEnabled && labelsInScene) {
			$scene.remove(labelMesh);
			labelsInScene = false;
		}
	});

	onMount(() => {
		if ($scene && $camera) {
			octree = buildPointOctree($scene, positions, groups, ids);

			frustumCuller = new FrustumCuller(octree, $camera, 500, 600);
			frustumCullerRef = frustumCuller;
			fcHDParticles = frustumCuller.getHDMesh();
			$scene.add(fcHDParticles);

			fcSDParticles = frustumCuller.getSDMesh();
			$scene.add(fcSDParticles);

			fcLDParticles = frustumCuller.getLDMesh();
			$scene.add(fcLDParticles);

			if ($options.labelsEnabled) {
				$scene.add(frustumCuller.getLabels());
				labelsInScene = true;
			}

			frustumCuller.cull(groupColors);

			$funcPipelines.registerCameraFunc(id, () => {
				frustumCuller?.cull(groupColors);
			});
		}
	});

	onDestroy(() => {
		$funcPipelines.deregisterCameraFunc(id);
		if (frustumCuller) {
			$scene?.remove(frustumCuller.getHDMesh());
			$scene?.remove(frustumCuller.getSDMesh());
			$scene?.remove(frustumCuller.getLDMesh());
			if (labelsInScene) $scene?.remove(frustumCuller.getLabels());
			frustumCuller.dispose();
		}
	});
</script>
