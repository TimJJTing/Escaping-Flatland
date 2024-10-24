<script>
	import * as THREE from 'three';
	import { Scene } from '$lib/components/providers/scene';
	import { Particles } from '$lib/meshes/particles';
	// import { Planet } from '$lib/meshes/planet';
	import { Star } from '$lib/meshes/star';
	import { Mesh, ParticleOctree } from '$lib/components/meshes';
	import { HemisphereLight } from '$lib/components/lights';
	import { generateData, palette } from '$lib/utils';
	const { positions, colors, groups, ids } = generateData(palette);
	let particles = new Particles(positions, colors, groups);
	let star = new Star(new THREE.Vector3(1, 1, 1), 1);
</script>

<Scene stats>
	<HemisphereLight skyColor={0xffffff} groundColor={0x888888} intensity={3} />
	<Mesh mesh={particles} />
	<Mesh mesh={star} postprocess />
	<ParticleOctree groupColors={palette} {positions} {groups} {ids} postprocess />
</Scene>
