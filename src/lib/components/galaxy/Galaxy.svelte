<script>
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';
	import { Scene, setOptions } from '$lib/components/providers/scene';
	import { Particles } from '$lib/meshes/particles';
	import { Star } from '$lib/meshes/star';
	import { Mesh, ParticleOctree } from '$lib/components/meshes';
	import { HemisphereLight } from '$lib/components/lights';
	import { InteractionManager } from '$lib/components/interaction';
	import OptionModal from '$lib/components/modals/option/OptionModal.svelte';
	import { generateData, palette } from '$lib/utils';

	const { positions, colors, groups, ids } = generateData(palette);
	let particles = new Particles(positions, colors, groups);
	let star = new Star(new THREE.Vector3(1, 1, 1), 1);

	setOptions();

	/** @type {import('$lib/utils/FrustumCuller').FrustumCuller|undefined} */
	let frustumCullerRef = $state(undefined);

	let optionModalVisible = $state(false);

	const onKeyDown = (/** @type {KeyboardEvent} */ e) => {
		if (e.key === 'o' || e.key === 'O') optionModalVisible = !optionModalVisible;
	};

	onMount(() => {
		window.addEventListener('keydown', onKeyDown);
	});
	onDestroy(() => {
		window.removeEventListener('keydown', onKeyDown);
	});
</script>

<OptionModal bind:visible={optionModalVisible} />

<Scene stats>
	<HemisphereLight skyColor={0xffffff} groundColor={0x888888} intensity={3} />
	<Mesh mesh={particles} />
	<Mesh mesh={star} postprocess />
	<ParticleOctree groupColors={palette} {positions} {groups} {ids} postprocess bind:frustumCullerRef />
	<InteractionManager {frustumCullerRef} />
</Scene>
