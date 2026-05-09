import { Tween, Group, Easing } from '@tweenjs/tween.js';

export const tweenGroup = new Group();
import * as THREE from 'three';

/**
 * @param {import('three/addons/controls/OrbitControls.js').OrbitControls} controls
 * @param {THREE.Vector3} target
 * @param {number} duration
 */
export const setControlsTarget = (controls, target, duration = 2000) => {
	const changeControlsTarget = new Tween(controls.target, tweenGroup)
		.to({ x: target.x, y: target.y, z: target.z }, duration)
		.easing(Easing.Quadratic.InOut)
		.onUpdate(() => {
			controls.enabled = false;
		})
		.onComplete(() => {
			controls.enabled = true;
		});
	return changeControlsTarget;
};

/**
 * @param {THREE.Camera} camera
 * @param {import('three/addons/controls/OrbitControls.js').OrbitControls} controls
 * @param {THREE.Vector3} target
 * @param {number} duration
 * @param {number} distance
 * @param {boolean} faceOrigin
 */
export const setCameraPosition = (camera, controls, target, duration = 2000, distance = 4, faceOrigin = false) => {
	const _position = new THREE.Vector3();
	if (faceOrigin) {
		_position.copy(target);
	} else {
		_position.subVectors(camera.position, target);
	}
	if (_position.x === 0 && _position.y === 0 && _position.z === 0) _position.set(1, 1, 1);
	const position = _position.normalize().multiplyScalar(distance).add(target);
	const changeCamPosition = new Tween(camera.position, tweenGroup)
		.to({ x: position.x, y: position.y, z: position.z }, duration)
		.easing(Easing.Quadratic.InOut)
		.onUpdate(() => {
			controls.enabled = false;
		})
		.onComplete(() => {
			controls.enabled = true;
		});
	return changeCamPosition;
};

/**
 * Animate camera to focus on a new target.
 * @param {THREE.Camera} camera
 * @param {import('three/addons/controls/OrbitControls.js').OrbitControls} controls
 * @param {THREE.Vector3} target
 * @param {number|null|undefined} distance
 * @param {number} targetingDuration
 * @param {number} movingDuration
 * @param {boolean} chain
 * @param {boolean} faceOrigin
 * @param {boolean} clearPreviousTweens
 */
export const tweenCamera = (
	camera,
	controls,
	target,
	distance = 4,
	targetingDuration = 1000,
	movingDuration = 1000,
	chain = false,
	faceOrigin = false,
	clearPreviousTweens = true
) => {
	if (clearPreviousTweens) tweenGroup.removeAll();
	const tweenTarget = setControlsTarget(controls, target, targetingDuration);
	let tweenPosition;
	if (typeof distance === 'number') {
		tweenPosition = setCameraPosition(camera, controls, target, movingDuration, distance, faceOrigin);
	}
	if (tweenPosition && chain) {
		tweenTarget.chain(tweenPosition);
	} else if (tweenPosition) {
		tweenPosition.start();
	}
	tweenTarget.start();
};
