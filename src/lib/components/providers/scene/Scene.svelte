<script module>
	export const RAYCAST_LAYER = 1;
	export const BLOOM_LAYER = 2;
	export const COLLAPSE_SCALE = 0.0001;
</script>

<script>
	import * as THREE from 'three';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
	import Stats from 'three/addons/libs/stats.module.js';
	import { onMount, onDestroy } from 'svelte';
	import { SelectiveBloom } from '$lib/utils';
	import { browser } from '$app/environment';
	import { setSceneContext, getSceneOptions } from './context.svelte.js';


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

	const ctx = setSceneContext();
	const sceneOpts = getSceneOptions();

	// event listeners
	const onWindowResize = () => {
		const width = window.innerWidth;
		const height = window.innerHeight;

		if (ctx.camera) {
			ctx.camera.aspect = width / height;
			ctx.camera.updateProjectionMatrix();
		}

		if (ctx.renderer) {
			ctx.renderer.setSize(width, height);
		}

		if (ctx.postprocessor) {
			ctx.postprocessor.setSize(width, height);
		}
	};

	const onOrbitCtrlStart = () => {
		mouseInteraction = false;
	};
	const onOrbitCtrlEnd = () => {
		mouseInteraction = true;
	};
	const onOrbitCtrlChange = (event) => {
		ctx.cameraPipeline?.forEach((cameraFunc) => {
			cameraFunc();
		});
		if (ctx.camera) {
			ctx.camPos = { x: ctx.camera.position.x, y: ctx.camera.position.y, z: ctx.camera.position.z };
		}
	};
	const onMouseClick = async (event) => {
		event.preventDefault();
	};
	const onMouseMove = (event) => {
		event.preventDefault();
		if (ctx.mouse && mouseInteraction) {
			ctx.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			ctx.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
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
				ctx.scene = new THREE.Scene();
				ctx.scene.fog = new THREE.FogExp2(0x121215, 0.00004);
				ctx.scene.background = new THREE.Color(0x121215);

				ctx.raycaster = new THREE.Raycaster();
				ctx.raycaster.far = 1200;
				ctx.raycaster.layers.set(RAYCAST_LAYER);
				ctx.mouse = new THREE.Vector2(1, 1);

				// add camera
				ctx.camera = new THREE.PerspectiveCamera(
					55,
					window.innerWidth / window.innerHeight,
					0.1,
					48000
				);

				// @ts-ignore
				ctx.camera.position.set(100000, 100000, 100000);
				ctx.camera.lookAt(0, 0, 0);

				// add renderers
				ctx.renderer = new THREE.WebGLRenderer();
				ctx.renderer.setSize(window.innerWidth, window.innerHeight);
				// @ts-ignore
				ctx.renderer.info.autoReset = false;
				ctx.renderer.toneMapping = THREE.ACESFilmicToneMapping;
				ctx.renderer.toneMappingExposure = 0.2;
				container.appendChild(ctx.renderer.domElement);

				ctx.postprocessor = new SelectiveBloom(ctx.renderer, ctx.scene, ctx.camera, BLOOM_LAYER);

				ctx.controls = new OrbitControls(ctx.camera, ctx.renderer.domElement);
				ctx.controls.autoRotate = false;
				ctx.controls.autoRotateSpeed = 0.5;
				ctx.controls.minDistance = 3;
				ctx.controls.maxDistance = 24000;
				ctx.controls.update();
				ctx.controls.saveState();

				window.addEventListener('resize', onWindowResize);
				ctx.controls.addEventListener('change', onOrbitCtrlChange);
				ctx.controls.addEventListener('start', onOrbitCtrlStart);
				ctx.controls.addEventListener('end', onOrbitCtrlEnd);
				container.addEventListener('click', onMouseClick);
				container.addEventListener('mousemove', onMouseMove);

				ctx.sceneReady = true;
			};

			const render = () => {
				if (ctx.postprocessor && sceneOpts.blooming) {
					ctx.postprocessor.render();
				} else {
					ctx.renderer?.render(ctx.scene, ctx.camera);
				}

				// execute render functions
				ctx.renderPipeline?.forEach((renderFunc) => {
					renderFunc();
				});

				if (stats && ctx.renderer) ctx.renderInfo = { ...ctx.renderer.info.render };

				if (ctx.renderer) {
					// @ts-ignore
					ctx.renderer.info.reset();
				}
			};

			const animate = () => {
				requestAnimationFrame(animate);

				if (ctx.controls) {
					ctx.controls.update();
				}

				// execute update functions
				ctx.updatePipeline?.forEach((updateFunc) => {
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
			throw new Error('Three.js only runs in a browser environment.');
		}
	});
	onDestroy(() => {
		if (browser) {
			window.removeEventListener('resize', onWindowResize);
			if (container) {
				container.removeEventListener('click', onMouseClick);
				container.removeEventListener('mousemove', onMouseMove);
			}
			if (ctx.controls) {
				ctx.controls.removeEventListener('change', onOrbitCtrlChange);
				ctx.controls.removeEventListener('start', onOrbitCtrlStart);
				ctx.controls.removeEventListener('end', onOrbitCtrlEnd);
				ctx.controls.dispose();
			}
			if (ctx.postprocessor) ctx.postprocessor.dispose();
			if (ctx.renderer) {
				ctx.renderer.dispose();
				ctx.renderer.domElement.remove();
			}
		}
	});
</script>

<div id="container" bind:this={container}>
	{#if ctx.sceneReady}
		{@render children?.()}
	{/if}
</div>

<style lang="scss">
	:global(.stats) {
		left: unset !important;
		right: 0 !important;
	}
</style>
