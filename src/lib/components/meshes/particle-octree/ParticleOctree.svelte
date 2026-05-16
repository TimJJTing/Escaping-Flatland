<script>
	import { onMount, onDestroy } from 'svelte';
	import { getSceneContext, getParticleOptions } from '$lib/components/providers/scene';
	import { buildPointOctree } from '$lib/utils/buildPointOctree';
	import { FrustumCuller } from '$lib/utils/FrustumCuller';
	import { usePostProcessor } from '../utils';

	/**
	 * @typedef {Object} Props
	 * @property {any} positions
	 * @property {any} groups
	 * @property {any} ids
	 * @property {any} groupColors
	 * @property {boolean} [postprocess]
	 * @property {undefined|FrustumCuller} [frustumCullerRef]
	 */

	/** @type {Props} */
	let {
		positions,
		groups,
		ids,
		groupColors,
		postprocess = false,
		frustumCullerRef = $bindable(undefined)
	} = $props();

	/** @type {undefined|FrustumCuller} */
	let frustumCuller = $state(undefined);
	let octree;
	/** @type {import('three').Mesh|undefined} */
	let fcHDParticles = $state(undefined);
	/** @type {import('three').Mesh|undefined} */
	let fcSDParticles = $state(undefined);
	/** @type {import('three').Mesh|undefined} */
	let fcLDParticles = $state(undefined);

	const id = {};
	const ctx = getSceneContext();
	const particleOpts = getParticleOptions();

	$effect(() => {
		usePostProcessor(postprocess, ctx.postprocessor, fcHDParticles);
	});
	$effect(() => {
		usePostProcessor(postprocess, ctx.postprocessor, fcSDParticles);
	});
	$effect(() => {
		usePostProcessor(postprocess, ctx.postprocessor, fcLDParticles);
	});

	$effect(() => {
		if (!frustumCuller) return;
		frustumCuller.getLabels().visible = particleOpts.labelsEnabled;
	});

	$effect(() => {
		if (!frustumCuller) return;
		frustumCuller.getOctantHelper().visible = particleOpts.octantHelperEnabled;
	});

	onMount(() => {
		if (ctx.scene && ctx.camera) {
			octree = buildPointOctree(ctx.scene, positions, groups, ids);

			frustumCuller = new FrustumCuller(octree, ctx.camera, 500, 600);
			frustumCullerRef = frustumCuller;
			fcHDParticles = frustumCuller.getHDMesh();
			ctx.scene.add(fcHDParticles);

			fcSDParticles = frustumCuller.getSDMesh();
			ctx.scene.add(fcSDParticles);

			fcLDParticles = frustumCuller.getLDMesh();
			ctx.scene.add(fcLDParticles);

			ctx.scene.add(frustumCuller.getLabels());
			ctx.scene.add(frustumCuller.getOctantHelper());
			ctx.postprocessor?.invalidateCache();

			frustumCuller.cull(groupColors);

			ctx.registerCameraFunc(id, () => {
				frustumCuller?.cull(groupColors);
			});
		}
	});

	onDestroy(() => {
		ctx.deregisterCameraFunc(id);
		if (frustumCuller) {
			ctx.scene?.remove(frustumCuller.getHDMesh());
			ctx.scene?.remove(frustumCuller.getSDMesh());
			ctx.scene?.remove(frustumCuller.getLDMesh());
			ctx.scene?.remove(frustumCuller.getLabels());
			ctx.scene?.remove(frustumCuller.getOctantHelper());
			ctx.postprocessor?.invalidateCache();
			frustumCuller.dispose();
		}
	});
</script>
