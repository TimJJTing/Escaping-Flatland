// @ts-nocheck
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
// Post-effects
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
// import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const defaultParams = {
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
	 * @param {Integer} bloomScene the blooming layer
	 * @returns this
	 */
	constructor(renderer, scene, camera, bloomScene = 1) {
		this._darkMaterial = new THREE.MeshBasicMaterial({
			color: 0x000000
		});
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
		// this._outlinePass = this._createOutlinePass();
		this.finalComposer = this._createFinalComposer();

		// this._selectObjects = [];

		return this;
	}

	_createBloomPass() {
		const bloomPass = new UnrealBloomPass(
			new THREE.Vector2(window.innerWidth, window.innerHeight),
			defaultParams.strength,
			defaultParams.radius,
			defaultParams.threshold
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

	// _createOutlinePass() {
	// 	const outlinePass = new OutlinePass(
	// 		new THREE.Vector2(window.innerWidth, window.innerHeight),
	// 		this._scene,
	// 		this._camera
	// 	);
	// 	outlinePass.edgeStrength = 3.0;
	// 	outlinePass.edgeGlow = 0.0;
	// 	outlinePass.edgeThickness = 1.0;
	// 	outlinePass.visibleEdgeColor.set('#ffffff');

	// 	return outlinePass;
	// }

	_createFinalComposer() {
		let finalComposer = new EffectComposer(this._renderer);
		finalComposer.addPass(this._renderScene);

		// mix pass
		finalComposer.addPass(this._mixPass);

		// outline pass
		// finalComposer.addPass(this._outlinePass);

		// output pass
		const outputPass = new OutputPass();
		finalComposer.addPass(outputPass);
		return finalComposer;
	}

	// /**
	//  * Add new object to this post effect
	//  * @param {THREE.Object3D} obj
	//  */
	// addOutline(obj) {
	// 	this._selectedObjects = [];
	// 	this._selectedObjects.push(obj);
	// 	this._outlinePass.selectedObjects = this._selectedObjects;
	// }

	// /**
	//  * Remove objects from this post effect
	//  */
	// removeOutline() {
	// 	this._selectedObjects = [];
	// 	this._outlinePass.selectedObjects = this._selectedObjects;
	// }

	/**
	 * Add new object to this post effect
	 * @param {THREE.Object3D} obj
	 */
	add(obj) {
		obj.traverse((o) => {
			if ((o.isMesh || o.isPoints) && o.material) {
				o.layers.enable(this.bloomScene);
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
	render() {
		const originalBackground = this._scene.background;
		const nonBloomedMaterials = {};
		this._scene.background = new THREE.Color(0x000000);

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
		const hiddenObjects = (this._hiddenObjects = []);
		this._scene.traverse((obj) => {
			if ((obj.isMesh || obj.isPoints) && obj.material && !this.bloomLayer.test(obj.layers)) {
				if (obj.isInstancedLabelSprites || obj.isPoints) {
					if (obj.visible) {
						hiddenObjects.push(obj);
						obj.visible = false;
					}
				} else {
					// Store original material
					nonBloomedMaterials[obj.uuid] = obj.material;
					obj.material = this._darkMaterial;
				}
			}
		});

		this._scene.background.set(0x000000);
		// render scene for the first time
		this.bloomComposer.render();

		this._scene.background.set(originalBackground);

		// Restore original materials:
		// traverse objects and restore non-bloomed's materials or unhide them.
		// note we don't use traverseVisible here, otherwise it's possible that LOD objects' material won't get restored
		for (let i = 0; i < hiddenObjects.length; i++) {
			hiddenObjects[i].visible = true;
		}
		this._scene.traverse((obj) => {
			if (obj.isMesh && nonBloomedMaterials[obj.uuid]) {
				obj.material = nonBloomedMaterials[obj.uuid];
			}
		});

		// final render
		this.finalComposer.render();
	}

	setSize(width, height) {
		this.bloomComposer.setSize(width, height);
		this.finalComposer.setSize(width, height);
	}
}
