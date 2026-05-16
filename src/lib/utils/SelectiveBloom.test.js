import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';

// Minimal stubs — avoids WebGL requirement
vi.mock('three/addons/postprocessing/EffectComposer.js', () => ({
	EffectComposer: vi.fn().mockImplementation(function () {
		this.renderToScreen = false;
		this.addPass = vi.fn();
		this.render = vi.fn();
		this.setSize = vi.fn();
		this.dispose = vi.fn();
		this.renderTarget2 = { texture: null };
	})
}));
vi.mock('three/addons/postprocessing/RenderPass.js', () => ({ RenderPass: vi.fn() }));
vi.mock('three/addons/postprocessing/ShaderPass.js', () => ({
	ShaderPass: vi.fn().mockImplementation(function () {
		this.needsSwap = false;
		this.material = { dispose: vi.fn() };
	})
}));
vi.mock('three/addons/postprocessing/UnrealBloomPass.js', () => ({
	UnrealBloomPass: vi.fn().mockImplementation(function () {
		this.threshold = 0.1;
		this.strength = 0.8;
		this.radius = 0.5;
		this.dispose = vi.fn();
	})
}));
vi.mock('three/addons/postprocessing/OutputPass.js', () => ({ OutputPass: vi.fn() }));

const { SelectiveBloom } = await import('./SelectiveBloom.js');

function makeRenderer() {
	return { setSize: vi.fn(), toneMapping: 0, toneMappingExposure: 1 };
}

function makeScene() {
	const s = new THREE.Scene();
	return s;
}

function makeCamera() {
	return new THREE.PerspectiveCamera();
}

function makeMesh(onBloomLayer = false) {
	const m = new THREE.Mesh(
		new THREE.BufferGeometry(),
		new THREE.MeshBasicMaterial({ color: 0xff0000 })
	);
	if (onBloomLayer) m.layers.enable(1);
	return m;
}

describe('SelectiveBloom._buildCache', () => {
	it('populates _nonBloomMeshes with non-bloom meshes', () => {
		const scene = makeScene();
		const nonBloom = makeMesh(false);
		const bloom = makeMesh(true);
		scene.add(nonBloom);
		scene.add(bloom);

		const sb = new SelectiveBloom(makeRenderer(), scene, makeCamera(), 1);
		// @ts-ignore - _buildCache is private
		sb._buildCache();

		// @ts-ignore - _nonBloomMeshes is private
		expect(sb._nonBloomMeshes).toContain(nonBloom);
		// @ts-ignore - _nonBloomMeshes is private
		expect(sb._nonBloomMeshes).not.toContain(bloom);
		// @ts-ignore - _cacheValid is private
		expect(sb._cacheValid).toBe(true);
	});

	it('sets _cacheValid to false after invalidateCache()', () => {
		const sb = new SelectiveBloom(makeRenderer(), makeScene(), makeCamera(), 1);
		// @ts-ignore - _cacheValid is private
		sb._cacheValid = true;
		// @ts-ignore - invalidateCache is private
		sb.invalidateCache();
		// @ts-ignore - _cacheValid is private
		expect(sb._cacheValid).toBe(false);
	});
});

describe('SelectiveBloom.add incremental cache update', () => {
	it('removes mesh from _nonBloomMeshes when add() is called', () => {
		const scene = makeScene();
		const mesh = makeMesh(false);
		scene.add(mesh);

		const sb = new SelectiveBloom(makeRenderer(), scene, makeCamera(), 1);
		// @ts-ignore
		sb._buildCache();
		// @ts-ignore
		expect(sb._nonBloomMeshes).toContain(mesh);

		sb.add(mesh);
		// @ts-ignore
		expect(sb._nonBloomMeshes).not.toContain(mesh);
	});

	it('does not corrupt cache when add() is called on mesh not in cache', () => {
		const scene = makeScene();
		const mesh = makeMesh(false);
		// mesh not in scene, not in cache
		const sb = new SelectiveBloom(makeRenderer(), scene, makeCamera(), 1);
		// @ts-ignore
		sb._buildCache();
		expect(() => sb.add(mesh)).not.toThrow();
	});
});

describe('SelectiveBloom.remove incremental cache update', () => {
	it('adds mesh back to _nonBloomMeshes when remove() is called on a bloom mesh', () => {
		const scene = makeScene();
		const mesh = makeMesh(true); // starts on bloom layer
		scene.add(mesh);

		const sb = new SelectiveBloom(makeRenderer(), scene, makeCamera(), 1);
		// @ts-ignore
		sb._buildCache();
		// @ts-ignore
		expect(sb._nonBloomMeshes).not.toContain(mesh);

		sb.remove(mesh);
		// @ts-ignore
		expect(sb._nonBloomMeshes).toContain(mesh);
	});

	it('does not add duplicates when remove() called twice', () => {
		const scene = makeScene();
		const mesh = makeMesh(true);
		scene.add(mesh);

		const sb = new SelectiveBloom(makeRenderer(), scene, makeCamera(), 1);
		// @ts-ignore
		sb._buildCache();
		sb.remove(mesh);
		sb.remove(mesh); // second call — should not duplicate
		// @ts-ignore
		const count = sb._nonBloomMeshes.filter((m) => m === mesh).length;
		expect(count).toBe(1);
	});

	it('adds points-like objects to _nonBloomPoints not _nonBloomMeshes', () => {
		const scene = makeScene();
		const pts = new THREE.Points(
			new THREE.BufferGeometry(),
			new THREE.PointsMaterial()
		);
		pts.layers.enable(1);
		scene.add(pts);

		const sb = new SelectiveBloom(makeRenderer(), scene, makeCamera(), 1);
		// @ts-ignore
		sb._buildCache();
		sb.remove(pts);
		// @ts-ignore
		expect(sb._nonBloomPoints).toContain(pts);
		// @ts-ignore
		expect(sb._nonBloomMeshes).not.toContain(pts);
	});
});

describe('SelectiveBloom.render() material handling', () => {
	it('darkens non-bloom meshes during bloom pass then restores', () => {
		const scene = makeScene();
		const nonBloom = makeMesh(false);
		const originalMat = nonBloom.material;
		scene.add(nonBloom);

		const sb = new SelectiveBloom(makeRenderer(), scene, makeCamera(), 1);
		// Spy: capture material state during bloomComposer.render
		let matDuringBloom;
		sb.bloomComposer.render = vi.fn(() => {
			matDuringBloom = nonBloom.material;
		});
		sb.finalComposer.render = vi.fn();

		sb.render();

		expect(matDuringBloom).toBe(sb._darkMaterial); // darkened during bloom
		expect(nonBloom.material).toBe(originalMat);   // restored after
	});

	it('hides visible points during bloom pass then restores visibility', () => {
		const scene = makeScene();
		const pts = new THREE.Points(
			new THREE.BufferGeometry(),
			new THREE.PointsMaterial()
		);
		pts.visible = true;
		scene.add(pts);

		const sb = new SelectiveBloom(makeRenderer(), scene, makeCamera(), 1);
		let visibleDuringBloom;
		sb.bloomComposer.render = vi.fn(() => {
			visibleDuringBloom = pts.visible;
		});
		sb.finalComposer.render = vi.fn();

		sb.render();

		expect(visibleDuringBloom).toBe(false); // hidden during bloom
		expect(pts.visible).toBe(true);          // restored after
	});

	it('does not hide already-hidden points objects', () => {
		const scene = makeScene();
		const pts = new THREE.Points(
			new THREE.BufferGeometry(),
			new THREE.PointsMaterial()
		);
		pts.visible = false; // already hidden
		scene.add(pts);

		const sb = new SelectiveBloom(makeRenderer(), scene, makeCamera(), 1);
		sb.bloomComposer.render = vi.fn();
		sb.finalComposer.render = vi.fn();

		sb.render();

		// Should NOT be in _hiddenObjects — restoring it would incorrectly make it visible
		// @ts-ignore
		expect(sb._hiddenObjects).not.toContain(pts);
		expect(pts.visible).toBe(false);
	});

	it('skips objects with null material (stale cache guard)', () => {
		const scene = makeScene();
		const mesh = makeMesh(false);
		scene.add(mesh);

		const sb = new SelectiveBloom(makeRenderer(), scene, makeCamera(), 1);
		// @ts-ignore
		sb._buildCache(); // populate cache

		// Simulate stale cache: material removed externally
		// @ts-ignore
		mesh.material = null;

		sb.bloomComposer.render = vi.fn();
		sb.finalComposer.render = vi.fn();

		expect(() => sb.render()).not.toThrow();
	});

	it('handles multi-material mesh (array material)', () => {
		const scene = makeScene();
		const mesh = new THREE.Mesh(new THREE.BufferGeometry(), [
			new THREE.MeshBasicMaterial({ color: 0xff0000 }),
			new THREE.MeshBasicMaterial({ color: 0x00ff00 })
		]);
		const originalMats = mesh.material;
		scene.add(mesh);

		const sb = new SelectiveBloom(makeRenderer(), scene, makeCamera(), 1);
		sb.bloomComposer.render = vi.fn();
		sb.finalComposer.render = vi.fn();

		sb.render();

		expect(mesh.material).toBe(originalMats); // array reference restored intact
	});

	it('triggers _buildCache lazily on first render when cache invalid', () => {
		const scene = makeScene();
		const mesh = makeMesh(false);
		scene.add(mesh);

		const sb = new SelectiveBloom(makeRenderer(), scene, makeCamera(), 1);
		sb.bloomComposer.render = vi.fn();
		sb.finalComposer.render = vi.fn();
		// @ts-ignore
		expect(sb._cacheValid).toBe(false);

		sb.render();

		// @ts-ignore
		expect(sb._cacheValid).toBe(true);
		// @ts-ignore
		expect(sb._nonBloomMeshes).toContain(mesh);
	});
});
