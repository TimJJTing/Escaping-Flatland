import { getContext, setContext } from 'svelte';

// ---------------------------------------------------------------------------
// Context keys
// ---------------------------------------------------------------------------

const SCENE_KEY         = Symbol('scene');
const DATA_OPTIONS_KEY  = Symbol('dataOptions');
const PARTICLE_KEY      = Symbol('particleOptions');
const SCENE_OPTIONS_KEY = Symbol('sceneOptions');
const SELECTION_KEY     = Symbol('selectedPoint');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * @typedef {{ starIndex: number, worldPosition: import('three').Vector3 }} SelectedPoint
 */

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------

class SceneContext {
	scene         = $state(/** @type {import('three').Scene|undefined} */ (undefined));
	camera        = $state(/** @type {import('three').PerspectiveCamera|undefined} */ (undefined));
	renderer      = $state(/** @type {import('three').WebGLRenderer|undefined} */ (undefined));
	controls      = $state(/** @type {import('three/addons/controls/OrbitControls.js').OrbitControls|undefined} */ (undefined));
	mouse         = $state(/** @type {import('three').Vector2|undefined} */ (undefined));
	raycaster     = $state(/** @type {import('three').Raycaster|undefined} */ (undefined));
	postprocessor = $state(/** @type {import('$lib/utils/SelectiveBloom').SelectiveBloom|undefined} */ (undefined));
	sceneReady    = $state(false);
	camPos        = $state({ x: 0, y: 0, z: 0 });
	renderInfo    = $state({ frame: 0, calls: 0, triangles: 0, points: 0, lines: 0 });

	updatePipeline = new Map();
	renderPipeline = new Map();
	cameraPipeline = new Map();

	/** @param {any} key @param {() => void} fn */
	registerUpdateFunc(key, fn)  { this.updatePipeline.set(key, fn); }
	/** @param {any} key */
	deregisterUpdateFunc(key)    { this.updatePipeline.delete(key); }
	/** @param {any} key @param {() => void} fn */
	registerRenderFunc(key, fn)  { this.renderPipeline.set(key, fn); }
	/** @param {any} key */
	deregisterRenderFunc(key)    { this.renderPipeline.delete(key); }
	/** @param {any} key @param {() => void} fn */
	registerCameraFunc(key, fn)  { this.cameraPipeline.set(key, fn); }
	/** @param {any} key */
	deregisterCameraFunc(key)    { this.cameraPipeline.delete(key); }
}

class DataOptions {
	dataSourceId = $state('random');
}

class ParticleOptions {
	labelsEnabled       = $state(true);
	octantHelperEnabled = $state(false);
}

class SceneOptions {
	blooming          = $state(true);
	viewHelperEnabled = $state(true);
	autoRotateEnabled = $state(true);
	debugModeEnabled  = $state(false);
}

class SelectionState {
	selectedPoint = $state(/** @type {SelectedPoint|null} */ (null));
}

// ---------------------------------------------------------------------------
// Scene context  (Three.js primitives + function pipelines)
// ---------------------------------------------------------------------------

/** @returns {SceneContext} */
export function setSceneContext() {
	const ctx = new SceneContext();
	setContext(SCENE_KEY, ctx);
	return ctx;
}

/** @returns {SceneContext} */
export function getSceneContext() {
	return getContext(SCENE_KEY);
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/** @returns {DataOptions} */
export function setDataOptions() {
	const ctx = new DataOptions();
	setContext(DATA_OPTIONS_KEY, ctx);
	return ctx;
}

/** @returns {DataOptions} */
export function getDataOptions() {
	return getContext(DATA_OPTIONS_KEY);
}

/** @returns {ParticleOptions} */
export function setParticleOptions() {
	const ctx = new ParticleOptions();
	setContext(PARTICLE_KEY, ctx);
	return ctx;
}

/** @returns {ParticleOptions} */
export function getParticleOptions() {
	return getContext(PARTICLE_KEY);
}

/** @returns {SceneOptions} */
export function setSceneOptions() {
	const ctx = new SceneOptions();
	setContext(SCENE_OPTIONS_KEY, ctx);
	return ctx;
}

/** @returns {SceneOptions} */
export function getSceneOptions() {
	return getContext(SCENE_OPTIONS_KEY);
}

// ---------------------------------------------------------------------------
// Selection state
// ---------------------------------------------------------------------------

/** @returns {SelectionState} */
export function setSelectedPoint() {
	const ctx = new SelectionState();
	setContext(SELECTION_KEY, ctx);
	return ctx;
}

/** @returns {SelectionState} */
export function getSelectedPoint() {
	return getContext(SELECTION_KEY);
}
