import * as THREE from 'three';
import { _Planet } from './_Planet';

export class Planet {
	/**
	 * Planet with LOD
	 * @param {number} radius radius of the sphere
	 * @param {number} au distance from planet to its sun
	 * @param {THREE.Vector3} rotationAxis self-rotation rotationAxis
	 * @param {number} rotationSpeed rotation speed
	 * @param {number} revolutionSpeed revolution speed
	 * @returns this
	 */
	constructor(
		radius = 1,
		au = 1,
		rotationAxis = new THREE.Vector3(0, 1, 0),
		rotationSpeed = 0.1,
		revolutionSpeed = 1
	) {
		this.radius = radius;
		this._radius = radius;
		this.rotationSpeed = rotationSpeed;
		this.rotationAxis = rotationAxis;
		this.au = au;
		this.revolutionSpeed = revolutionSpeed;
		this.needsUpdate = false;

		this.levels = [
			new _Planet(this.radius, 5, this.rotationSpeed, this.rotationAxis),
			new _Planet(this.radius, 2, 0, this.rotationAxis),
			new _Planet(this.radius, 0, 0, this.rotationAxis)
		];

		this.lod = this._createLOD();

		return this;
	}

	/**
	 * Create lods for Planet
	 * @returns {THREE.LOD} lod
	 */
	_createLOD() {
		const lod = new THREE.LOD();
		for (let i = 0; i < this.levels.length; i++) {
			lod.addLevel(this.levels[i].mesh, i * 800); //0
		}
		return lod;
	}

	/**
	 * @returns {THREE.Vector3}
	 */
	get position() {
		return this.lod.position;
	}
	/**
	 * @param {THREE.Vector3} p
	 */
	set position(p) {
		this.lod.position.copy(p);
	}

	/**
	 * @param {boolean} v
	 */
	set visible(v) {
		this.lod.visible = v;
	}
	/**
	 * @param {THREE.Vector3} p
	 */
	lookAt(p) {
		this.lod.lookAt(p);
	}
	/**
	 * Return the LOD Object3D
	 */
	getMesh() {
		return this.lod;
	}

	/**
	 * Reset the clock
	 */
	resetClock() {
		for (let i = 0; i < this.levels.length; i++) {
			this.levels[i].resetClock();
		}
	}

	update() {
		if (this.needsUpdate) {
			for (let i = 0, level; i < this.levels.length; i++) {
				level = this.levels[i];
				level.rotationAxis = this.rotationAxis;
				level.mesh.geometry.scale(
					this.radius / this._radius,
					this.radius / this._radius,
					this.radius / this._radius
				);
				level.needsUpdate = true;
				level.update();
			}
			this.needsUpdate = false;
		}
		this.levels[0].update();
	}

	/**
	 * Deletes this from scene
	 */
	dispose() {
		for (let i = 0; i < this.levels.length; i++) {
			this.levels[i].dispose();
		}
		this.lod.clear();
	}
}
