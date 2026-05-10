# Replace BoxGeometry with GridBoxGeometry for octantHelper

## Context

The `octantHelper` in `FrustumCuller.ts` visualizes octree bounding boxes as debug overlays. It currently renders semi-transparent solid boxes using `InstancedMesh + BoxGeometry(1,1,1) + MeshBasicMaterial`. The user wants:
1. **Verification** of the 1×1×1 size claim — answered below.
2. **Replace** `BoxGeometry` with `GridBoxGeometry` (wireframe grid lines without diagonal artifacts) as described in the [three.js discourse thread](https://discourse.threejs.org/t/gridboxgeometry/1420).

### Verification: Is octantHelper really 1×1×1?

**The geometry is 1×1×1, but rendered instances are not.** The unit box is a template — each instance is scaled to its octant's actual world-space dimensions via `m.compose(p, q, s)` where `s = x.getDimensions(s)` = `octant.max - octant.min`. At max depth 5, octants are roughly `scene_size / 32` per axis. The 1×1×1 is correct and intentional.

### Why GridBoxGeometry requires a different approach

`GridBoxGeometry` produces **line-segment indices** for use with `LineSegments`, not `Mesh`. Three.js has no built-in `InstancedLineSegments`. Therefore `InstancedMesh` must be replaced.

**Chosen approach**: Pre-allocate a `Float32Array` sized for `maxOctantHelperCount` boxes. In each `cull()` call, transform the base unit-box line vertices per octant and write into this buffer. Update the `LineSegments` geometry's draw range and flag `needsUpdate`. This is a single draw call, avoids per-frame allocations, and the debug tool is only visible on demand.

---

## Alternatives considered

### Can we keep `InstancedMesh`?

`InstancedMesh` always issues `gl.TRIANGLES` draw calls — it cannot render lines without a custom shader. The two viable paths if staying on `InstancedMesh`:

**A) Fragment-shader wireframe (complex)**  
Keep `BoxGeometry(1,1,1) + InstancedMesh`. Use a custom `ShaderMaterial` that passes barycentric coordinates as a vertex attribute. The fragment shader discards interior pixels; the diagonal triangle edges are flagged as "interior" via a vertex attribute so they don't render. Visual result is identical to GridBoxGeometry wireframe. Requires ~30 lines of GLSL.

**B) EdgesGeometry (does NOT work)**  
`EdgesGeometry(new BoxGeometry(1,1,1))` extracts exactly the 12 box edges (90° dihedral angle) with no diagonals. BUT it produces line-segment indices, which `InstancedMesh` (triangles mode) cannot interpret correctly. This path is a dead end.

### Chosen approach: LineSegments with pre-allocated buffer

Replace `InstancedMesh` with a `LineSegments` object backed by a pre-allocated `Float32Array`. On each `cull()`, transform the base unit-box line vertices per octant and write into this buffer. This gives:
- A single GPU draw call per frame
- No per-frame allocations
- Clean wireframe without diagonals, using `GridBoxGeometry` as intended
- Simpler than option A — no custom GLSL needed

---

## Critical files

- `src/lib/utils/FrustumCuller.ts` — the only file to change

---

## Implementation steps

### 1. Add module-level helpers (above the `FrustumCuller` class)

Add a TypeScript `buildGridBoxGeometry(geometry: BoxGeometry): BufferGeometry` function (ported from the discourse thread) and a `buildGridBoxBaseVertices()` function that expands the grid-box indices into a flat, non-indexed `Float32Array` of vertex positions ready for `LineSegments`. Call both once to produce two module-level constants:

```typescript
const GRID_BOX_VERTS: Float32Array   // flat positions for one unit grid box
const VERTS_PER_BOX: number          // number of vertex positions (= index count)
```

`buildGridBoxGeometry` logic (TypeScript port of the forum code):
- Create a new `BufferGeometry`, share the position attribute from the input `BoxGeometry`
- Generate line-pair indices for all 6 faces using `segmentsX/Y/Z` from `geometry.parameters`
- `indexSide(x, y, shift)` inner helper: for each row/col, push horizontal then vertical line pairs, skip vertical when it would overflow the face; add final corner vertical if in-bounds

`buildGridBoxBaseVertices`:
- Call `buildGridBoxGeometry(new BoxGeometry(1,1,1))`
- Dereference each index into a flat `Float32Array` (non-indexed, ready for `LineSegments` draw without an index buffer)
- Dispose the temporary geometries

### 2. Update imports

Add: `LineSegments`, `LineBasicMaterial`, `BufferGeometry`, `BufferAttribute`  
Remove: `BoxGeometry` (no longer used after this change)

### 3. Update private fields

```typescript
private octantHelper: LineSegments;           // was InstancedMesh
private octantHelperPositions: Float32Array;  // new — pre-allocated vertex buffer
```

### 4. Update constructor (replace octantHelper initialization)

```typescript
this.octantHelperPositions = new Float32Array(this.maxOctantHelperCount * VERTS_PER_BOX * 3);
const geom = new BufferGeometry();
geom.setAttribute('position', new BufferAttribute(this.octantHelperPositions, 3));
geom.setDrawRange(0, 0);  // nothing visible until first cull
this.octantHelper = new LineSegments(
  geom,
  new LineBasicMaterial({ color: 0xccff00, transparent: true, opacity: 0.8 })
);
this.octantHelper.visible = false;
this.octantHelper.frustumCulled = false;
```

### 5. Update `cull()` — replace setMatrixAt block

Old:
```typescript
octantHelper.count = Math.min(this.maxOctantHelperCount, intersections.length);
// ...
octantHelper.setMatrixAt(i, m.compose(p, q, s));
// ...
octantHelper.instanceMatrix.needsUpdate = true;
```

New approach — write transformed vertices into the pre-allocated buffer:

```typescript
// Before the loop:
let boxCount = 0;
const positions = this.octantHelperPositions;

// Inside the loop, replace setMatrixAt with:
x.getCenter(p);
x.getDimensions(s);
m.compose(p, q, s);
// reuse `p` as temp vector (compose already consumed it)
const base = boxCount * VERTS_PER_BOX;
for (let v = 0; v < VERTS_PER_BOX; v++) {
  p.set(GRID_BOX_VERTS[v * 3], GRID_BOX_VERTS[v * 3 + 1], GRID_BOX_VERTS[v * 3 + 2]);
  p.applyMatrix4(m);
  const idx = (base + v) * 3;
  positions[idx]     = p.x;
  positions[idx + 1] = p.y;
  positions[idx + 2] = p.z;
}
boxCount++;

// After the loop, replace instanceMatrix.needsUpdate with:
octantHelper.geometry.setDrawRange(0, boxCount * VERTS_PER_BOX);
(octantHelper.geometry.getAttribute('position') as BufferAttribute).needsUpdate = true;
```

### 6. Update `getOctantHelper()` return type

```typescript
getOctantHelper(): Object3D {   // was Mesh
  return this.octantHelper;
}
```

`ParticleOctree.svelte` only uses `.visible`, `$scene.add()`, `$scene.remove()` — all defined on `Object3D`, so no changes needed there.

### 7. Update `dispose()`

Replace `this.octantHelper.dispose()` with:
```typescript
this.octantHelper.geometry.dispose();
(this.octantHelper.material as Material).dispose();
```

(`LineSegments` inherits from `Object3D` which has no `dispose()` method, unlike `InstancedMesh`.)

---

## Verification

1. Run the dev server and open the app
2. Enable "Octant Helper" in the Options modal
3. Confirm: octant boxes now render as wireframe grid outlines (lines only, no diagonal fill, no solid faces)
4. Confirm boxes correctly scale to octant sizes at various zoom levels
5. Toggle the helper off — boxes disappear; toggle back on — boxes reappear
6. TypeScript compilation: `npm run check` or equivalent should report no errors
