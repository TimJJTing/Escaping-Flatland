import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * @template T
 * @param {string} key
 * @param {T} initial
 * @returns {{ set: () => import('svelte/store').Writable<T>, get: () => import('svelte/store').Writable<T> }}
 */
function contextStore(key, initial) {
	return {
		set: () => { const s = writable(initial); setContext(key, s); return s; },
		get: () => getContext(key),
	};
}

// ---------------------------------------------------------------------------
// Three.js primitives  (initialized by Scene.svelte, read-only elsewhere)
// ---------------------------------------------------------------------------

export const { set: setScene, get: getScene } =
	contextStore('scene', /** @type {import('three').Scene|undefined} */ (undefined));

export const { set: setCamera, get: getCamera } =
	contextStore('camera', /** @type {import('three').PerspectiveCamera|undefined} */ (undefined));

export const { set: setRenderer, get: getRenderer } =
	contextStore('renderer', /** @type {import('three').WebGLRenderer|undefined} */ (undefined));

export const { set: setControls, get: getControls } =
	contextStore('controls', /** @type {import('three/addons/controls/OrbitControls.js').OrbitControls|undefined} */ (undefined));

export const { set: setMouse, get: getMouse } =
	contextStore('mouse', /** @type {import('three').Vector2|undefined} */ (undefined));

export const { set: setRaycaster, get: getRaycaster } =
	contextStore('raycaster', /** @type {import('three').Raycaster|undefined} */ (undefined));

export const { set: setPostprocessor, get: getPostprocessor } =
	contextStore('postprocessor', /** @type {import('$lib/utils/SelectiveBloom').SelectiveBloom|undefined} */ (undefined));

export const { set: setSceneReady, get: getSceneReady } =
	contextStore('sceneReady', false);

export const { set: setCamPos, get: getCamPos } =
	contextStore('camPos', { x: 0, y: 0, z: 0 });

export const { set: setRenderInfo, get: getRenderInfo } =
	contextStore('renderInfo', { frame: 0, calls: 0, triangles: 0, points: 0, lines: 0 });

// ---------------------------------------------------------------------------
// Function pipelines  (update / render / camera — fired each animation frame)
// ---------------------------------------------------------------------------

export function setFuncPipelines() {
	const updatePipeline = new Map();
	const renderPipeline = new Map();
	const cameraPipeline = new Map();

	const funcPipelines = writable({
		updatePipeline,
		registerUpdateFunc:   (key, func) => updatePipeline.set(key, func),
		deregisterUpdateFunc: (key)       => updatePipeline.delete(key),

		renderPipeline,
		registerRenderFunc:   (key, func) => renderPipeline.set(key, func),
		deregisterRenderFunc: (key)       => renderPipeline.delete(key),

		cameraPipeline,
		registerCameraFunc:   (key, func) => cameraPipeline.set(key, func),
		deregisterCameraFunc: (key)       => cameraPipeline.delete(key),
	});

	setContext('funcPipelines', funcPipelines);
	return funcPipelines;
}

export const getFuncPipelines = () => getContext('funcPipelines');

// ---------------------------------------------------------------------------
// Options  (namespace stores — one per consumer to prevent cross-reactivity)
// ---------------------------------------------------------------------------

/**
 * @typedef {{ dataSourceId: string }} DataOptions
 * @typedef {{ labelsEnabled: boolean, octantHelperEnabled: boolean }} ParticleOptions
 * @typedef {{ blooming: boolean, viewHelperEnabled: boolean, autoRotateEnabled: boolean, debugModeEnabled: boolean }} SceneOptions
 */

export const { set: setDataOptions, get: getDataOptions } =
	contextStore('dataOptions', /** @type {DataOptions} */ ({
		dataSourceId: 'random',
	}));

export const { set: setParticleOptions, get: getParticleOptions } =
	contextStore('particleOptions', /** @type {ParticleOptions} */ ({
		labelsEnabled:       true,
		octantHelperEnabled: false,
	}));

export const { set: setSceneOptions, get: getSceneOptions } =
	contextStore('sceneOptions', /** @type {SceneOptions} */ ({
		blooming:          true,
		viewHelperEnabled: true,
		autoRotateEnabled: true,
		debugModeEnabled:  false,
	}));

// ---------------------------------------------------------------------------
// Selection state
// ---------------------------------------------------------------------------

/**
 * @typedef {{ starIndex: number, worldPosition: import('three').Vector3 }} SelectedPoint
 */

export const { set: setSelectedPoint, get: getSelectedPoint } =
	contextStore('selectedPoint', /** @type {SelectedPoint|null} */ (null));
