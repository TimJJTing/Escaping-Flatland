<script>
	import * as THREE from 'three';
	import { onMount, onDestroy, untrack } from 'svelte';
	import { Settings, CircleQuestionMark } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import {
		Scene,
		setDataOptions,
		getDataOptions,
		setParticleOptions,
		setSceneOptions,
		getSceneOptions,
		setSelectedPoint
	} from '$lib/components/providers/scene';
	import { Particles } from '$lib/meshes/particles';
	import { Star } from '$lib/meshes/star';
	import { Planet } from '$lib/meshes/planet';
	import { SolarSystem } from '$lib/meshes/solar-system';
	import { Mesh, ParticleOctree } from '$lib/components/meshes';
	import { HemisphereLight } from '$lib/components/lights';
	import { InteractionManager } from '$lib/components/interaction';
	import { OptionModal } from '$lib/components/modals/option';
	import { HelpModal } from '$lib/components/modals/help';
	import { getParticleOptions } from '$lib/components/providers/scene';
	import { LoadingOverlay } from '$lib/components/loading';
	import { StarDashboard } from '$lib/components/dashboard';
	import { SearchBar } from '$lib/components/search-bar';
	import { palette, DATA_SOURCES } from '$lib/utils';

	// set* must be called before children mount so context is available
	setDataOptions();
	setParticleOptions();
	setSceneOptions();
	const selectedPoint = setSelectedPoint();
	const dataOptions = getDataOptions();
	const sceneOptions = getSceneOptions();
	const particleOptions = getParticleOptions();

	// Reactive data — re-generates only when dataSourceId changes
	let starData = $derived.by(() => {
		const srcId = $dataOptions.dataSourceId;
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
	let prevDataSourceId = $dataOptions.dataSourceId;
	$effect(() => {
		const id = $dataOptions.dataSourceId;
		if (id !== prevDataSourceId) {
			const label = DATA_SOURCES.find((s) => s.id === id)?.label ?? id;
			toast(`Data Source: ${label}`);
			prevDataSourceId = id;
			selectedPoint.set(null);
		}
	});

	// Configure and show solar system on star click
	$effect(() => {
		const sp = $selectedPoint;
		if (!sp) {
			solarSystem.visible = false;
			return;
		}

		const { starIndex, worldPosition } = sp;

		const d = untrack(() => starData);

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
	let helpModalVisible = $state(false);

	let prevScene = { ...$sceneOptions };
	let prevParticle = { ...$particleOptions };

	$effect(() => {
		const opts = $sceneOptions;
		if (opts.autoRotateEnabled !== prevScene.autoRotateEnabled)
			toast(`Auto Rotate: ${opts.autoRotateEnabled ? 'On' : 'Off'}`);
		if (opts.viewHelperEnabled !== prevScene.viewHelperEnabled)
			toast(`View Helper: ${opts.viewHelperEnabled ? 'On' : 'Off'}`);
		if (opts.blooming !== prevScene.blooming) toast(`Blooming: ${opts.blooming ? 'On' : 'Off'}`);
		if (opts.debugModeEnabled !== prevScene.debugModeEnabled)
			toast(`Debug Mode: ${opts.debugModeEnabled ? 'On' : 'Off'}`);
		prevScene = { ...opts };
	});

	$effect(() => {
		const opts = $particleOptions;
		if (opts.labelsEnabled !== prevParticle.labelsEnabled)
			toast(`Labels: ${opts.labelsEnabled ? 'On' : 'Off'}`);
		if (opts.octantHelperEnabled !== prevParticle.octantHelperEnabled)
			toast(`Octant Helper: ${opts.octantHelperEnabled ? 'On' : 'Off'}`);
		prevParticle = { ...opts };
	});

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
<HelpModal bind:visible={helpModalVisible} />
<SearchBar {starData} />
<StarDashboard {starData} />

<button
	class="fixed right-2 top-4 z-50 p-2 rounded-full bg-[#1a1a1f]/80 border border-[#333] text-white hover:bg-[#2a2a2f]/90 transition-colors"
	onclick={() => (helpModalVisible = !helpModalVisible)}
	aria-label="Help"
>
	<CircleQuestionMark size={20} />
</button>

<button
	class="fixed right-2 bottom-4 z-50 p-2 rounded-full bg-[#1a1a1f]/80 border border-[#333] text-white hover:bg-[#2a2a2f]/90 transition-colors"
	onclick={() => (optionModalVisible = !optionModalVisible)}
	aria-label="Options"
>
	<Settings size={20} />
</button>

<LoadingOverlay loading={!frustumCullerRef} />

<Scene stats={$sceneOptions.debugModeEnabled}>
	<HemisphereLight skyColor={0xffffff} groundColor={0x888888} intensity={3} />
	<Mesh mesh={star} postprocess />
	<Mesh mesh={solarSystem} postprocess />
	{#key $dataOptions.dataSourceId}
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
