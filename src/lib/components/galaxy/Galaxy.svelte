<script>
	import * as THREE from 'three';
	import { untrack, onDestroy } from 'svelte';
	import { Settings, CircleQuestionMark } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import {
		Scene,
		setDataOptions,
		getDataOptions,
		setParticleOptions,
		getParticleOptions,
		setSceneOptions,
		getSceneOptions,
		setSelectedPoint
	} from '$lib/components/providers/scene';
	import { Star } from '$lib/meshes/star';
	import { Planet } from '$lib/meshes/planet';
	import { SolarSystem } from '$lib/meshes/solar-system';
	import { Mesh, ParticleOctree, Particles } from '$lib/components/meshes';
	import { HemisphereLight } from '$lib/components/lights';
	import { InteractionManager } from '$lib/components/interaction';
	import { OptionModal } from '$lib/components/modals/option';
	import { HelpModal } from '$lib/components/modals/help';
	import { LoadingOverlay } from '$lib/components/loading';
	import { DebugPanel } from '$lib/components/debug';
	import { StarDashboard } from '$lib/components/dashboard';
	import { SearchBar } from '$lib/components/search-bar';
	import { palette, DATA_SOURCES } from '$lib/utils';

	// set* must be called before children mount so context is available
	setDataOptions();
	setParticleOptions();
	setSceneOptions();
	const sel = setSelectedPoint();
	const dataOpts = getDataOptions();
	const sceneOpts = getSceneOptions();
	const particleOpts = getParticleOptions();

	// Reactive data — re-generates only when dataSourceId changes
	let starData = $derived.by(() => {
		const srcId = dataOpts.dataSourceId;
		return (DATA_SOURCES.find((s) => s.id === srcId) ?? DATA_SOURCES[0]).generate(palette);
	});

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

	onDestroy(() => {
		// planetPool items removed via removePlanet() are absent from solarSystem.planets
		// and won't be disposed by solarSystem.dispose() (called by <Mesh onDestroy>)
		const managed = new Set(solarSystem.planets);
		for (const p of planetPool) {
			if (!managed.has(p)) p.dispose();
		}
	});

	// Reset selection when data source changes (avoids stale starIndex)
	let prevDataSourceId = dataOpts.dataSourceId;
	$effect(() => {
		const id = dataOpts.dataSourceId;
		if (id !== prevDataSourceId) {
			const label = DATA_SOURCES.find((s) => s.id === id)?.label ?? id;
			toast(`Data Source: ${label}`);
			prevDataSourceId = id;
			sel.selectedPoint = null;
		}
	});

	// Configure and show solar system on star click
	$effect(() => {
		const sp = sel.selectedPoint;
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

	let prevScene = { ...sceneOpts };
	let prevParticle = { ...particleOpts };

	$effect(() => {
		const opts = sceneOpts;
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
		const opts = particleOpts;
		if (opts.labelsEnabled !== prevParticle.labelsEnabled)
			toast(`Labels: ${opts.labelsEnabled ? 'On' : 'Off'}`);
		if (opts.octantHelperEnabled !== prevParticle.octantHelperEnabled)
			toast(`Octant Helper: ${opts.octantHelperEnabled ? 'On' : 'Off'}`);
		prevParticle = { ...opts };
	});

	const onKeyDown = (/** @type {KeyboardEvent} */ e) => {
		if (e.key === 'o' || e.key === 'O') optionModalVisible = !optionModalVisible;
	};
</script>

<svelte:window onkeydown={onKeyDown} />
<OptionModal bind:visible={optionModalVisible} />
<HelpModal bind:visible={helpModalVisible} />
<SearchBar {starData} />
<StarDashboard {starData} />

<button
	class="fixed right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[rgba(15,15,22,0.85)] text-white/60 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
	onclick={() => (helpModalVisible = !helpModalVisible)}
	aria-label="Help"
>
	<CircleQuestionMark size={16} />
</button>

<button
	class="fixed right-4 bottom-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[rgba(15,15,22,0.85)] text-white/60 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
	onclick={() => (optionModalVisible = !optionModalVisible)}
	aria-label="Options"
>
	<Settings size={16} />
</button>

<LoadingOverlay loading={!frustumCullerRef} />

<Scene stats={sceneOpts.debugModeEnabled}>
	<HemisphereLight skyColor={0xffffff} groundColor={0x888888} intensity={3} />
	<Mesh mesh={star} postprocess />
	<Mesh mesh={solarSystem} postprocess />
	{#key dataOpts.dataSourceId}
		<Particles
			positions={starData.positions}
			colors={starData.colors}
			groups={starData.groups}
		/>
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
	{#if sceneOpts.debugModeEnabled}
		<DebugPanel />
	{/if}
</Scene>
