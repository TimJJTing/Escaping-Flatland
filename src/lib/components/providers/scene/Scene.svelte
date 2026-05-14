<script module>
	export const RAYCAST_LAYER = 1;
	export const BLOOM_LAYER = 2;
	export const COLLAPSE_SCALE = 0.0001;
</script>

<script>

	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import Stats from 'three/addons/libs/stats.module.js';
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { SelectiveBloom } from '$lib/utils';
	import { browser } from '$app/environment';
	import {
		setScene,
		setCamera,
		setControls,
		setRenderer,
		setFuncPipelines,
		setSceneReady,
		setMouse,
		setRaycaster,
		setPostprocessor,
		getSceneOptions,
		setCamPos,
		setRenderInfo
	} from './context';

	
	/**
	 * @typedef {Object} Props
	 * @property {boolean} [stats]
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { stats = false, children } = $props();

	/**
	 * @type {HTMLDivElement}
	 */
	let container = $state();

	/**
	 * @type {Stats|undefined}
	 */
	let statsElement;

	/**
	 * @type {boolean}
	 */
	let mouseInteraction = true;
	/**
	 * @type {null|string}
	 */
	let mouseTarget = null;

	const dispatch = createEventDispatcher();
	let scene = setScene();
	let sceneReady = setSceneReady();
	let renderer = setRenderer();
	let camera = setCamera();
	let mouse = setMouse();
	let raycaster = setRaycaster();
	let postprocessor = setPostprocessor();
	let controls = setControls();
	let funcPipelines = setFuncPipelines();
	let sceneOptions = getSceneOptions();
	let camPos = setCamPos();
	let renderInfo = setRenderInfo();

	// event listeners
	const onWindowResize = () => {
		const width = window.innerWidth;
		const height = window.innerHeight;

		if ($camera) {
			$camera.aspect = width / height;
			$camera.updateProjectionMatrix();
		}

		// frustumCuller.getCameraHelper().update();

		if ($renderer) {
			$renderer.setSize(width, height);
		}

		if ($postprocessor) {
			$postprocessor.setSize(width, height);
		}
	};

	const onOrbitCtrlStart = () => {
		mouseInteraction = false;
		dispatch('orbitCtrlStart');
	};
	const onOrbitCtrlEnd = () => {
		mouseInteraction = true;
		dispatch('orbitCtrlEnd');
	};
	const onOrbitCtrlChange = (event) => {
		// execute render functions
		$funcPipelines.cameraPipeline?.forEach((cameraFunc) => {
			cameraFunc();
		});
		if ($camera) {
			$camPos = { x: $camera.position.x, y: $camera.position.y, z: $camera.position.z };
		}
		dispatch('orbitCtrlChange');
	};
	const onMouseClick = async (event) => {
		event.preventDefault();
		// use the target get from onMouseMove listener
		// if (mouseInteraction && mouseTarget !== null) {
		//     await urlSearchParams.set('star', mouseTarget, $page);
		// }
		dispatch('click');
	};
	const onMouseMove = (event) => {
		event.preventDefault();
		if ($mouse && mouseInteraction) {
			$mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			$mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
		}
	};

	const useStats = (enable, container) => {
		if (container && enable && !statsElement) {
			statsElement = new Stats();
			container.appendChild(statsElement.dom);
			statsElement.dom.classList.add('stats');
		} else if (container && !enable && statsElement) {
			container.removeChild(statsElement.dom);
			statsElement = undefined;
		}
	};

	$effect(() => {
		useStats(stats, container);
	});

	onMount(() => {
		if (browser) {
			const init = () => {
				// add scene
				$scene = new THREE.Scene();
				$scene.fog = new THREE.FogExp2(0x121215, 0.00004);
				$scene.background = new THREE.Color(0x121215);

				$raycaster = new THREE.Raycaster();
				$raycaster.far = 1200;
				$raycaster.layers.set(RAYCAST_LAYER);
				$mouse = new THREE.Vector2(1, 1);

				// add camera
				$camera = new THREE.PerspectiveCamera(
					55,
					window.innerWidth / window.innerHeight,
					0.1,
					48000
				);

				// @ts-ignore
				$camera.position.set(100000, 100000, 100000);
				$camera.lookAt(0, 0, 0);

				// add renderers
				$renderer = new THREE.WebGLRenderer();
				$renderer.setSize(window.innerWidth, window.innerHeight);
				// @ts-ignore
				$renderer.info.autoReset = false;
				$renderer.toneMapping = THREE.ACESFilmicToneMapping;
				$renderer.toneMappingExposure = 0.2;
				container.appendChild($renderer.domElement);

				$postprocessor = new SelectiveBloom($renderer, $scene, $camera, BLOOM_LAYER);

				$controls = new OrbitControls($camera, $renderer.domElement);
				$controls.autoRotate = false;
				$controls.autoRotateSpeed = 0.5;
				$controls.minDistance = 3;
				$controls.maxDistance = 24000;
				$controls.update();
				$controls.saveState();

				window.addEventListener('resize', onWindowResize);
				$controls.addEventListener('change', onOrbitCtrlChange);
				$controls.addEventListener('start', onOrbitCtrlStart);
				$controls.addEventListener('end', onOrbitCtrlEnd);
				container.addEventListener('click', onMouseClick);
				container.addEventListener('mousemove', onMouseMove);

				$sceneReady = true;
				dispatch('ready');
			};

			const render = () => {
				if ($postprocessor && $sceneOptions.blooming) {
					$postprocessor.render();
				} else {
					$renderer?.render($scene, $camera);
				}

				// execute render functions
				$funcPipelines.renderPipeline?.forEach((renderFunc) => {
					renderFunc();
				});

				if (stats && $renderer) $renderInfo = { ...$renderer.info.render };

				if ($renderer) {
					// $renderer.toneMappingExposure = $toneMappingExposure;
					// @ts-ignore
					$renderer.info.reset();
				}
			};

			const animate = () => {
				requestAnimationFrame(animate);

				if ($controls) {
					$controls.update();
				}

				// execute update functions
				$funcPipelines.updatePipeline?.forEach((updateFunc) => {
					updateFunc();
				});

				if (stats && statsElement) {
					statsElement.update();
				}

				render();
			};

			init();
			animate();
		} else {
			throw Error('Three.js only runs in a browser environment.');
		}
	});
	onDestroy(() => {
		if (browser) {
			window.removeEventListener('resize', onWindowResize);
			if (container) {
				container.removeEventListener('click', onMouseClick);
				container.removeEventListener('mousemove', onMouseMove);
			}
			if ($controls) {
				$controls.removeEventListener('change', onOrbitCtrlChange);
				$controls.removeEventListener('start', onOrbitCtrlStart);
				$controls.removeEventListener('end', onOrbitCtrlEnd);
				$controls.dispose();
			}
			if ($postprocessor) $postprocessor.dispose();
			if ($renderer) {
				$renderer.dispose();
				$renderer.domElement.remove();
			}
		}
	});
</script>

<div id="container" bind:this={container}>
	{#if $sceneReady}
		{@render children?.()}
	{/if}
</div>

<style lang="scss">
	:global(.stats) {
		left: unset !important;
		right: 0 !important;
	}
</style>
