// @ts-nocheck
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
// Post-effects
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const DEFAULT_PARAMS = {
	threshold: 0.1,
	strength: 0.8,
	radius: 0.5
};

const vertexShader = `
varying vec2 vUv;
void main() {

    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const fragmentShader = `
uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;

uniform float bloomIntensity;

varying vec2 vUv;

void main() {
    vec4 baseColor = texture2D(baseTexture, vUv);
    vec4 bloomColor = texture2D(bloomTexture, vUv);
    
    // Use a more controlled blend
    gl_FragColor = baseColor + bloomColor * bloomIntensity;
}
`;

export class SelectiveBloom {
	/**
	 * Add blooming post effect
	 * @param {*} renderer renderer
	 * @param {*} scene scene
	 * @param {*} camera camera
	 * @param {number} bloomScene the blooming layer
	 * @returns this
	 */
	constructor(renderer, scene, camera, bloomScene = 1) {
		this._darkMaterial = new THREE.MeshBasicMaterial({
			color: 0x000000
		});
		this._backgroundColor = new THREE.Color(0x000000);
		this._renderer = renderer;
		this._scene = scene;
		this._camera = camera;

		this.bloomScene = bloomScene;
		this.bloomLayer = new THREE.Layers();
		this.bloomLayer.set(this.bloomScene);

		this._renderScene = new RenderPass(scene, camera);
		this._bloomPass = this._createBloomPass();
		this.bloomComposer = this._createBloomComposer();
		this._mixPass = this._createMixPass();
		this.finalComposer = this._createFinalComposer();

		// Pre-allocated per-frame state — avoids GC churn each render call
		this._nonBloomedObjs = [];
		this._nonBloomedMats = [];
		this._hiddenObjects = [];

		// Cached flat lists of non-bloom scene objects
		this._nonBloomMeshes = [];
		this._nonBloomPoints = [];
		this._cacheValid = false;

		return this;
	}

	_createBloomPass() {
		const bloomPass = new UnrealBloomPass(
			new THREE.Vector2(window.innerWidth, window.innerHeight),
			DEFAULT_PARAMS.strength,
			DEFAULT_PARAMS.radius,
			DEFAULT_PARAMS.threshold
		);
		return bloomPass;
	}

	_createBloomComposer() {
		let bloomComposer = new EffectComposer(this._renderer);
		bloomComposer.renderToScreen = false;
		bloomComposer.addPass(this._renderScene);
		bloomComposer.addPass(this._bloomPass);
		return bloomComposer;
	}

	_createMixPass() {
		const mixPass = new ShaderPass(
			new THREE.ShaderMaterial({
				uniforms: {
					baseTexture: { value: null },
					bloomTexture: { value: this.bloomComposer.renderTarget2.texture },
					bloomIntensity: { value: 1.0 } // Adjust this value to control bloom intensity
				},
				vertexShader,
				fragmentShader,
				defines: {}
			}),
			'baseTexture'
		);
		mixPass.needsSwap = true;
		return mixPass;
	}

	_createFinalComposer() {
		let finalComposer = new EffectComposer(this._renderer);
		finalComposer.addPass(this._renderScene);

		finalComposer.addPass(this._mixPass);

		// output pass
		const outputPass = new OutputPass();
		finalComposer.addPass(outputPass);
		return finalComposer;
	}

	_buildCache() {
		this._nonBloomMeshes.length = 0;
		this._nonBloomPoints.length = 0;
		this._scene.traverse((obj) => {
			if (!(obj.isMesh || obj.isPoints) || !obj.material) return;
			if (this.bloomLayer.test(obj.layers)) return;
			if (obj.isInstancedLabelSprites || obj.isPoints) {
				this._nonBloomPoints.push(obj);
			} else {
				this._nonBloomMeshes.push(obj);
			}
		});
		this._cacheValid = true;
	}

	/**
	 * Call after adding or removing objects directly from the scene (outside of
	 * SelectiveBloom.add / SelectiveBloom.remove) to force a cache rebuild on
	 * the next render.
	 */
	invalidateCache() {
		this._cacheValid = false;
	}

	/**
	 * Add new object to this post effect
	 * @param {THREE.Object3D} obj
	 */
	add(obj) {
		obj.traverse((o) => {
			if ((o.isMesh || o.isPoints) && o.material) {
				o.layers.enable(this.bloomScene);
				if (this._cacheValid) {
					const mi = this._nonBloomMeshes.indexOf(o);
					if (mi !== -1) this._nonBloomMeshes.splice(mi, 1);
					const pi = this._nonBloomPoints.indexOf(o);
					if (pi !== -1) this._nonBloomPoints.splice(pi, 1);
				}
			}
		});
	}

	/**
	 * Remove object from this post effect
	 * @param {THREE.Object3D} obj
	 */
	remove(obj) {
		obj.traverse((o) => {
			if ((o.isMesh || o.isPoints) && o.material) {
				o.layers.disable(this.bloomScene);
				if (this._cacheValid) {
					if (o.isInstancedLabelSprites || o.isPoints) {
						if (!this._nonBloomPoints.includes(o)) this._nonBloomPoints.push(o);
					} else if (o.isMesh) {
						if (!this._nonBloomMeshes.includes(o)) this._nonBloomMeshes.push(o);
					}
				}
			}
		});
	}

	/**
	 * Set Pass params
	 * @param {{threshold: number, strength: number, radius: number}} params
	 */
	setPassParams(params) {
		if (typeof params.threshold === 'number') this._bloomPass.threshold = params.threshold;
		if (typeof params.strength === 'number') this._bloomPass.strength = params.strength;
		if (typeof params.radius === 'number') this._bloomPass.radius = params.radius;
	}

	/**
	 * Get current Pass params
	 * @returns {{threshold: number, strength: number, radius: number}}
	 */
	getPassParams() {
		return {
			threshold: this._bloomPass.threshold,
			strength: this._bloomPass.strength,
			radius: this._bloomPass.radius
		};
	}

	/**
	 * Use this render function to activate the effect
	 */
	// Darken non-bloomed objects:
	// traverse objects and replace non-bloomed's materials or hide them completely.
	// note: use traverse (not traverseVisible) so all LOD level children get covered.
	// THREE.LOD.update(camera) runs inside bloomComposer.render() and can swap the
	// active level — if we only darken the currently-visible level, a newly-active
	// level still has its bright material and leaks into the bloom extract, causing
	// far objects to blink on LOD transitions.
	// note: non-bloom THREE.Points get hidden, not darkened. Assigning the
	// MeshBasicMaterial _darkMaterial to a Points object makes three.js draw it as
	// 1-pixel dots that still write depth. With many points (e.g. a 500k-particle
	// background), individual dots screen-align with bloom-layer objects as the
	// camera moves and depth-occlude them in bloomComposer only — but not in
	// finalComposer, where the original PointsMaterial is transparent (depthWrite
	// off). The bloom contribution then toggles per frame, blinking far stars.
	render() {
		if (!this._cacheValid) this._buildCache();

		const originalBackground = this._scene.background;
		this._scene.background = this._backgroundColor;

		// Clear per-frame arrays — reuse allocations, no new objects
		this._nonBloomedObjs.length = 0;
		this._nonBloomedMats.length = 0;
		this._hiddenObjects.length = 0;

		// Darken non-bloom meshes. Guard obj.material: stale cache entries may
		// reference objects whose material was set to null externally.
		for (let i = 0; i < this._nonBloomMeshes.length; i++) {
			const obj = this._nonBloomMeshes[i];
			if (!obj.material) continue;
			this._nonBloomedObjs.push(obj);
			this._nonBloomedMats.push(obj.material);
			obj.material = this._darkMaterial;
		}

		// Hide non-bloom points/sprites. Only track visible ones — restoring an
		// already-hidden object would incorrectly make it visible.
		for (let i = 0; i < this._nonBloomPoints.length; i++) {
			const obj = this._nonBloomPoints[i];
			if (obj.visible) {
				this._hiddenObjects.push(obj);
				obj.visible = false;
			}
		}

		this.bloomComposer.render();

		this._scene.background = originalBackground;

		// Restore visibility — direct array iteration, no traverse
		for (let i = 0; i < this._hiddenObjects.length; i++) {
			this._hiddenObjects[i].visible = true;
		}

		// Restore materials — parallel arrays avoid second scene.traverse()
		for (let i = 0; i < this._nonBloomedObjs.length; i++) {
			this._nonBloomedObjs[i].material = this._nonBloomedMats[i];
		}

		this.finalComposer.render();
	}

	setSize(width, height) {
		this.bloomComposer.setSize(width, height);
		this.finalComposer.setSize(width, height);
	}

	dispose() {
		this._darkMaterial.dispose();
		this._bloomPass.dispose();
		this._mixPass.material.dispose();
		this.bloomComposer.dispose();
		this.finalComposer.dispose();
	}
}
