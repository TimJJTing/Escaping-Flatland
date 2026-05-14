import {
	BoxGeometry,
	PerspectiveCamera,
	CameraHelper,
	Frustum,
	InstancedMesh,
	Material,
	Matrix4,
	Mesh,
	Quaternion,
	Sphere,
	Vector3,
	Object3D,
	Color,
	IcosahedronGeometry,
	MeshBasicMaterial,
	MeshPhongMaterial
} from 'three';
import { InstancedLabelSprites } from '$lib/meshes/instanced-label-sprites';
import type { Octree, PointOctant } from 'sparse-octree';

// Module-scope scratch objects shared across all cull() calls to avoid per-frame GC pressure.
const frustum = new Frustum();
const m = new Matrix4();
const s = new Vector3();
const p = new Vector3();
const q = new Quaternion();
const tempObj = new Object3D();
const tempColor = new Color();
// Fixed bounding sphere covering the full scene. The raycaster uses this for its early-exit
// sphere test before checking individual instances. Per-frame computeBoundingSphere() would
// iterate all instance matrices every frame — this avoids that entirely.
// frustumCulled=false means three.js never uses this sphere for visibility, only the raycaster does.
const STAR_BOUNDS = new Sphere(new Vector3(), 50000);

/**
 * A frustum-based octree culling helper.
 */

export class FrustumCuller {
	/**
	 * An octree.
	 */

	private octree: Octree;

	/**
	 * A camera.
	 */

	private cullCamera: PerspectiveCamera;
	// Persistent clone of cullCamera with a shorter far plane, used only to extract the frustum.
	// Allocated once in the constructor; updateCamera() copies properties in-place each frame
	// instead of cloning, which would allocate a full PerspectiveCamera + matrices every frame.
	private _frustumCamera: PerspectiveCamera;

	/**
	 * A camera helper.
	 */

	private cameraHelper: CameraHelper;

	/**
	 * A mesh that represents intersecting high definition meshes
	 */

	private hdMesh: InstancedMesh;

	/**
	 * A mesh that represents intersecting standard definition meshes
	 */

	private sdMesh: InstancedMesh;

	/**
	 * A mesh that represents intersecting low definition meshes
	 */

	private ldMesh: InstancedMesh;

	/**
	 * maximum mesh count for the high detailed instanced mesh
	 */

	private maxHDMeshCount: number;

	/**
	 * maximum mesh count for the detailed instanced mesh
	 */

	private maxSDMeshCount: number;

	/**
	 * maximum mesh count for the instanced mesh
	 */

	private maxLDMeshCount: number;

	/**
	 * maximum octant helper count
	 */

	private maxOctantHelperCount: number;

	/**
	 * maximum distance for high detailed meshes and labels
	 */

	private maxHdDistance: number;

	/**
	 * maximum distance squared for high detailed meshes and labels
	 */

	private maxHdDistanceSq: number;
	/**
	 * maximum distance for detailed meshes and labels
	 */

	private maxSdDistance: number;

	/**
	 * maximum distance squared for detailed meshes and labels
	 */

	private maxSdDistanceSq: number;

	/**
	 * A mesh that represents intersecting octants.
	 */

	private octantHelper: InstancedMesh;

	/**
	 * A mesh that represents label sprites.
	 */

	private labelSprites: InstancedLabelSprites;

	private hdIds: string[] = [];
	private sdIds: string[] = [];
	private ldIds: string[] = [];

	/**
	 * Indicates whether the frustum culling is active.
	 */

	enabled: boolean;

	/**
	 * The measured processing time.
	 */

	time: string;

	/**
	 * The far plane of the frustum culler
	 */
	frustumFar: number;

	/**
	 * Constructs a new octree culler.
	 *
	 * @param octree - An octree.
	 */

	constructor(octree: Octree, camera: PerspectiveCamera, maxMeshCount: number, frustumFar: number) {
		this.octree = octree;
		this.cullCamera = camera;
		this._frustumCamera = camera.clone() as PerspectiveCamera;
		this._frustumCamera.far = frustumFar;

		this.maxHDMeshCount = 128;
		this.maxSDMeshCount = 128;
		this.maxLDMeshCount = maxMeshCount - this.maxHDMeshCount - this.maxSDMeshCount;
		this.frustumFar = frustumFar;
		this.cameraHelper = new CameraHelper(this.cullCamera);
		this.maxOctantHelperCount = 2500;

		this.maxHdDistance = 150;
		this.maxHdDistanceSq = this.maxHdDistance * this.maxHdDistance;
		this.maxSdDistance = 300;
		this.maxSdDistanceSq = this.maxSdDistance * this.maxSdDistance;

		this.labelSprites = new InstancedLabelSprites(camera);

		this.octantHelper = new InstancedMesh(
			new BoxGeometry(1, 1, 1),
			new MeshBasicMaterial({
				transparent: true,
				color: 0xccff00,
				opacity: 0.2,
				wireframe: true
			}),
			this.maxOctantHelperCount
		);
		this.octantHelper.visible = false;
		this.octantHelper.frustumCulled = false;
		this.hdMesh = new InstancedMesh(
			new IcosahedronGeometry(1, 2),
			new MeshPhongMaterial({
				// transparent: true,
				color: 0xffffff
				// opacity: 0.75
			}),
			this.maxHDMeshCount
		);
		this.sdMesh = new InstancedMesh(
			new IcosahedronGeometry(1, 1),
			new MeshPhongMaterial({
				// transparent: true,
				color: 0xffffff
				// opacity: 0.75
			}),
			this.maxSDMeshCount
		);
		this.ldMesh = new InstancedMesh(
			new IcosahedronGeometry(1, 0),
			new MeshBasicMaterial({
				// transparent: true,
				color: 0xffffff
				// opacity: 0.75
			}),
			this.maxLDMeshCount
		);
		// Manual per-point frustum culling happens in cull(); rely on that instead of
		// three.js's mesh-level cull, which would test against a bounding sphere that
		// lags one frame behind instance updates and can spuriously hide whole meshes.
		this.hdMesh.castShadow = false;
		this.hdMesh.receiveShadow = false;
		this.hdMesh.frustumCulled = false;
		this.hdMesh.visible = true;
		this.sdMesh.castShadow = false;
		this.sdMesh.receiveShadow = false;
		this.sdMesh.frustumCulled = false;
		this.sdMesh.visible = true;
		this.ldMesh.castShadow = false;
		this.ldMesh.receiveShadow = false;
		this.ldMesh.frustumCulled = false;
		this.ldMesh.visible = true;
		// Assign the fixed bounding sphere once so the raycaster can do its early-exit test
		// without us recomputing it every frame. See STAR_BOUNDS comment above.
		this.hdMesh.boundingSphere = STAR_BOUNDS;
		this.sdMesh.boundingSphere = STAR_BOUNDS;
		this.ldMesh.boundingSphere = STAR_BOUNDS;
		this.labelSprites.mesh.boundingSphere = STAR_BOUNDS;

		this.enabled = true;
		this.time = '';
		// this.cull();
	}

	/**
	 * Returns a mesh that represents intersecting hd meshes.
	 *
	 * @return The mesh.
	 */

	getHDMesh(): Mesh {
		return this.hdMesh;
	}
	/**
	 * Returns a mesh that represents intersecting sd meshes.
	 *
	 * @return The mesh.
	 */

	getSDMesh(): Mesh {
		return this.sdMesh;
	}

	/**
	 * Returns a mesh that represents intersecting ld meshes.
	 *
	 * @return The mesh.
	 */

	getLDMesh(): Mesh {
		return this.ldMesh;
	}

	/**
	 * Returns a octant helper that represents intersecting octants.
	 *
	 * @return The mesh.
	 */

	getOctantHelper(): Mesh {
		return this.octantHelper;
	}

	/**
	 * Returns the camera helper.
	 *
	 * @return The camera helper.
	 */

	getCameraHelper(): CameraHelper {
		return this.cameraHelper;
	}

	/**
	 * Returns labels
	 *
	 * @return labels
	 */

	getLabels(): Mesh {
		return this.labelSprites.mesh;
	}

	/**
	 * Returns the underlying data index for an instance of the given mesh.
	 */
	getIdAt(mesh: Object3D, instanceId: number): string | undefined {
		if (mesh === this.hdMesh) return this.hdIds[instanceId];
		if (mesh === this.sdMesh) return this.sdIds[instanceId];
		if (mesh === this.ldMesh) return this.ldIds[instanceId];
		return undefined;
	}

	/**
	 * Updates the cull camera.
	 */

	private updateCamera(): void {
		// Copy current camera state into _frustumCamera without allocating.
		// far is intentionally not copied — _frustumCamera keeps its fixed frustumFar
		// so the culling frustum is shorter than the render camera's far plane.
		this._frustumCamera.fov = this.cullCamera.fov;
		this._frustumCamera.aspect = this.cullCamera.aspect;
		this._frustumCamera.near = this.cullCamera.near;
		this._frustumCamera.position.copy(this.cullCamera.position);
		this._frustumCamera.quaternion.copy(this.cullCamera.quaternion);
		this._frustumCamera.updateProjectionMatrix();
		this._frustumCamera.updateMatrixWorld(true);
		frustum.setFromProjectionMatrix(
			m.multiplyMatrices(this._frustumCamera.projectionMatrix, this._frustumCamera.matrixWorldInverse)
		);
	}

	/**
	 * Culls the octree.
	 */

	cull(groupColors?: number[][], focusGroup?: number, filterArray?: number[]): void {
		const hdMesh = this.hdMesh;
		const sdMesh = this.sdMesh;
		const ldMesh = this.ldMesh;
		const sprites = this.labelSprites;
		const maxHDMeshCount = this.maxHDMeshCount;
		const maxSDMeshCount = this.maxSDMeshCount;
		const maxLDMeshCount = this.maxLDMeshCount;
		const octantHelper = this.octantHelper;

		if (this.enabled) {
			this.updateCamera();
			const t0 = performance.now();

			// cull the octree to get the intersections and sort them by squared distance to assure that meshes are iterated in the order of ascending distance
			// we can do this because usually we do not have too many octants
			const intersections = this.octree.cull(frustum);
			intersections.sort((a, b) => {
				const x = a as PointOctant<Object3D>;
				const y = b as PointOctant<Object3D>;
				return (
					x.distanceToSquared(this.cullCamera.position) -
					y.distanceToSquared(this.cullCamera.position)
				);
			});
			this.time = (performance.now() - t0).toFixed(2) + ' ms';
			// Clear stale labels from previous frame
			sprites.clearLabels();
			let hdpts = 0;
			let sdpts = 0;
			let ldpts = 0;
			octantHelper.count = Math.min(this.maxOctantHelperCount, intersections.length);
			if (intersections.length > 0) {
				for (let i = 0, l = intersections.length; i < l; ++i) {
					const x = intersections[i] as PointOctant<Object3D>;

					// if the intersected octant contains points
					if (x.data?.points?.length) {
						// update octant helper
						x.getCenter(p);
						x.getDimensions(s);
						octantHelper.setMatrixAt(i, m.compose(p, q, s));

						// if the octant is within the distance, it might contains HD/SD meshes
						const octantContainsHDMesh =
							x.distanceToSquared(this.cullCamera.position) < this.maxHdDistanceSq;
						const octantContainsSDMesh =
							x.distanceToSquared(this.cullCamera.position) < this.maxSdDistanceSq;
						// iterate through points in the octant
						for (let pidx = 0; pidx < x.data.points.length; pidx++) {
							if (ldpts >= maxLDMeshCount) break;

							// check if the point is not filtered out
							//@ts-ignore
							let visible = focusGroup === undefined || focusGroup === x.data.data[pidx].group;
							if (filterArray) {
								//@ts-ignore
								visible = visible && filterArray[x.data.data[pidx].index] === 1;
							}

							// check again is the point is visible and in the frustum
							if (visible && frustum.containsPoint(x.data.points[pidx])) {
								tempObj.position.set(
									x.data.points[pidx].x,
									x.data.points[pidx].y,
									x.data.points[pidx].z
								);
								tempObj.updateMatrix();
								//@ts-ignore
								let [r, g, b] = groupColors ? groupColors[x.data.data[pidx].group] : [255, 255, 255];
								tempColor.setRGB(r / 255, g / 255, b / 255);

								//@ts-ignore
								const dataId = String(x.data.data[pidx].index);
								// if it is within the hd distance and not exceeding the max count
								if (
									octantContainsHDMesh &&
									hdpts < maxHDMeshCount &&
									x.data.points[pidx].distanceToSquared(this.cullCamera.position) <
										this.maxHdDistanceSq
								) {
									hdMesh.setMatrixAt(hdpts, tempObj.matrix);
									hdMesh.setColorAt(hdpts, tempColor);
									// add label
									sprites.mesh.setMatrixAt(hdpts, tempObj.matrix);
									sprites.setLabelAt(hdpts, dataId);
									this.hdIds[hdpts] = dataId;
									hdpts++;
								} else if (
									octantContainsSDMesh &&
									sdpts < maxSDMeshCount &&
									x.data.points[pidx].distanceToSquared(this.cullCamera.position) <
										this.maxSdDistanceSq
								) {
									sdMesh.setMatrixAt(sdpts, tempObj.matrix);
									sdMesh.setColorAt(sdpts, tempColor);
									this.sdIds[sdpts] = dataId;
									sdpts++;
								} else {
									ldMesh.setMatrixAt(ldpts, tempObj.matrix);
									ldMesh.setColorAt(ldpts, tempColor);
									this.ldIds[ldpts] = dataId;
									ldpts++;
								}
							}
						}
					}
					if (ldpts >= maxLDMeshCount) break;
				}
				octantHelper.instanceMatrix.needsUpdate = true;
			}
			hdMesh.count = hdpts;
			sdMesh.count = sdpts;
			ldMesh.count = ldpts;
			hdMesh.instanceMatrix.needsUpdate = true;
			sdMesh.instanceMatrix.needsUpdate = true;
			ldMesh.instanceMatrix.needsUpdate = true;

			sprites.mesh.count = hdpts;
			sprites.mesh.instanceMatrix.needsUpdate = true;

			// sprites.needsUpdate = true;
			sprites.update();
			if (hdMesh.instanceColor) hdMesh.instanceColor.needsUpdate = true;
			if (sdMesh.instanceColor) sdMesh.instanceColor.needsUpdate = true;
			if (ldMesh.instanceColor) ldMesh.instanceColor.needsUpdate = true;
			// Trim id arrays to the active instance count so getIdAt() can't return a stale
			// id from a previous frame that had more visible instances.
			this.hdIds.length = hdpts;
			this.sdIds.length = sdpts;
			this.ldIds.length = ldpts;
		}
	}
	/**
	 * Deletes this frustum culler.
	 */

	dispose(): void {
		const hdGeometry = this.hdMesh.geometry;
		const hdMaterial = this.hdMesh.material as Material;
		this.hdMesh.dispose();
		hdGeometry.dispose();
		hdMaterial.dispose();
		const sdGeometry = this.sdMesh.geometry;
		const sdMaterial = this.sdMesh.material as Material;
		this.sdMesh.dispose();
		sdGeometry.dispose();
		sdMaterial.dispose();
		const ldGeometry = this.ldMesh.geometry;
		const ldMaterial = this.ldMesh.material as Material;
		this.ldMesh.dispose();
		ldGeometry.dispose();
		ldMaterial.dispose();

		this.octantHelper.dispose();
		this.labelSprites.dispose();
	}
}
