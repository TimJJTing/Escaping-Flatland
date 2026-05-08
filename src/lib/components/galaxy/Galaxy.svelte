<script>
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';
	import {
		Scene,
		setOptions,
		setSelectedPoint,
		getOptions
	} from '$lib/components/providers/scene';
	import { Particles } from '$lib/meshes/particles';
	import { Star } from '$lib/meshes/star';
	import { Planet } from '$lib/meshes/planet';
	import { SolarSystem } from '$lib/meshes/solar-system';
	import { Mesh, ParticleOctree } from '$lib/components/meshes';
	import { HemisphereLight } from '$lib/components/lights';
	import { InteractionManager } from '$lib/components/interaction';
	import OptionModal from '$lib/components/modals/option/OptionModal.svelte';
	import { palette, DATA_SOURCES } from '$lib/utils';

	// setOptions and setSelectedPoint must be called before children mount
	setOptions();
	const selectedPoint = setSelectedPoint();
	const options = getOptions();

	// Reactive data — re-generates when data source changes
	let starData = $derived.by(() => {
		const srcId = $options.dataSourceId;
		return (DATA_SOURCES.find((s) => s.id === srcId) ?? DATA_SOURCES[0]).generate(palette);
	});

	let particles = $derived(new Particles(starData.positions, starData.colors, starData.groups));

	// Background center star (always present)
	const star = new Star(new THREE.Vector3(1, 1, 1), 1);

	// Solar system — single shared instance, configured per click
	// <Mesh> handles scene add/remove/update/dispose since it lives inside <Scene>
	const planetPool = [
		Object.assign(new Planet(0.3, 8), { revolutionSpeed: 0.5 }),
		Object.assign(new Planet(0.2, 14), { revolutionSpeed: 0.3 })
	];
	const solarStar = new Star(new THREE.Vector3(1, 0.8, 0.3), 2, 1);
	const solarSystem = new SolarSystem(solarStar, 'selected-star');
	solarSystem.visible = false;

	// Reset selection when data source changes (avoids stale starIndex)
	$effect(() => {
		$options.dataSourceId;
		selectedPoint.set(null);
	});

	// Configure and show solar system on star click
	$effect(() => {
		const sp = $selectedPoint;
		if (!sp) {
			solarSystem.visible = false;
			return;
		}

		const { starIndex, worldPosition } = sp;
		const d = starData;

		const [r, g, b] = palette[d.groups[starIndex]];
		solarStar.color = new THREE.Vector3(r / 255, g / 255, b / 255);
		solarStar.speed = d.speeds[starIndex];
		solarStar.diffRotationCA = d.diffRotationCAs[starIndex];
		solarStar.diffRotationCB = d.diffRotationCBs[starIndex];
		solarStar.diffRotationCC = d.diffRotationCCs[starIndex];
		solarStar.needsUpdate = true;

		for (const p of [...solarSystem.planets]) solarSystem.removePlanet(p);
		const count = d.planetCounts[starIndex];
		for (let i = 0; i < count; i++) {
			solarSystem.addPlanet(planetPool[i]);
			planetPool[i].resetClock();
		}

		solarSystem.position = worldPosition;
		solarSystem.resetClock();
		solarSystem.visible = true;
	});

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
	<Mesh mesh={star} postprocess />
	<Mesh mesh={solarSystem} postprocess />
	{#key $options.dataSourceId}
		<Mesh mesh={particles} />
		<ParticleOctree
			groupColors={palette}
			positions={starData.positions}
			groups={starData.groups}
			ids={starData.ids}
			postprocess
			bind:frustumCullerRef
		/>
	{/key}
	<InteractionManager {frustumCullerRef} />
</Scene>
