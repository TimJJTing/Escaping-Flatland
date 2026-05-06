<script>
	import { run } from 'svelte/legacy';
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import * as THREE from 'three';
	import * as TWEEN from '@tweenjs/tween.js';
	import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
	import { ViewHelper } from '$lib/meshes/view-helper';
	import { tweenCamera } from '$lib/utils/tweenCamera';
	import { addLabel } from '$lib/utils/addLabel';
	import {
		getScene,
		getCamera,
		getControls,
		getRenderer,
		getMouse,
		getFuncPipelines,
		getOptions
	} from '$lib/components/providers/scene';

	/**
	 * @typedef {Object} Props
	 * @property {import('$lib/utils/FrustumCuller').FrustumCuller|undefined} frustumCullerRef
	 */
	/** @type {Props} */
	let { frustumCullerRef } = $props();

	let scene = getScene();
	let camera = getCamera();
	let controls = getControls();
	let renderer = getRenderer();
	let mouse = getMouse();
	let funcPipelines = getFuncPipelines();
	let options = getOptions();

	/** @type {CSS2DRenderer|undefined} */
	let labelRenderer;
	/** @type {{ object: import('three/addons/renderers/CSS2DRenderer.js').CSS2DObject, div: HTMLElement }|undefined} */
	let hoverLabel;
	/** @type {ViewHelper|undefined} */
	let viewHelper;

	const interactionRaycaster = new THREE.Raycaster();

	const renderId = {};
	const updateId = {};

	const onWindowResize = () => {
		if (labelRenderer) labelRenderer.setSize(window.innerWidth, window.innerHeight);
		if (viewHelper) viewHelper.update();
	};

	/** @return {THREE.Mesh[]} */
	const getTargetMeshes = () => {
		if (!frustumCullerRef) return [];
		return [
			frustumCullerRef.getHDMesh(),
			frustumCullerRef.getSDMesh(),
			frustumCullerRef.getLDMesh()
		];
	};

	const handleClick = () => {
		const cam = $camera;
		const ctrl = $controls;
		const m = $mouse;
		if (!cam || !ctrl || !m || !frustumCullerRef) return;
		interactionRaycaster.setFromCamera(m, cam);
		const intersects = interactionRaycaster.intersectObjects(getTargetMeshes());
		if (intersects.length > 0) {
			tweenCamera(cam, ctrl, intersects[0].point, 20);
		}
	};

	run(() => {
		const enabled = $options.viewHelperEnabled;
		const cam = $camera;
		const rend = $renderer;
		const ctrl = $controls;
		if (!cam || !rend) return;
		if (enabled && !viewHelper) {
			viewHelper = new ViewHelper(cam, rend, 'bottom-left');
			if (ctrl) viewHelper.setControls(ctrl);
		} else if (!enabled && viewHelper) {
			viewHelper.dispose();
			viewHelper = undefined;
		}
	});

	run(() => {
		if ($controls) $controls.autoRotate = $options.autoRotateEnabled;
	});

	onMount(() => {
		const rend = get(renderer);
		const cam = get(camera);
		const scn = get(scene);
		const ctrl = get(controls);
		if (!rend || !cam || !scn) return;

		labelRenderer = new CSS2DRenderer();
		labelRenderer.setSize(window.innerWidth, window.innerHeight);
		labelRenderer.domElement.style.position = 'absolute';
		labelRenderer.domElement.style.top = '0px';
		labelRenderer.domElement.style.pointerEvents = 'none';
		rend.domElement.parentElement?.appendChild(labelRenderer.domElement);

		hoverLabel = addLabel(scn);

		if ($options.viewHelperEnabled) {
			viewHelper = new ViewHelper(cam, rend, 'bottom-left');
			if (ctrl) viewHelper.setControls(ctrl);
		}

		$funcPipelines.registerUpdateFunc(updateId, () => {
			TWEEN.update();

			const m = get(mouse);
			const c = get(camera);
			if (!m || !c || !hoverLabel || !frustumCullerRef) return;

			interactionRaycaster.setFromCamera(m, c);
			const intersects = interactionRaycaster.intersectObjects(getTargetMeshes());

			if (intersects.length > 0) {
				const hit = intersects[0];
				const instanceId = hit.instanceId ?? 0;
				// only HD mesh has label text; SD/LD show instanceId as fallback
				const label =
					hit.object === frustumCullerRef.getHDMesh()
						? frustumCullerRef.getLabelText(instanceId)
						: String(instanceId);
				hoverLabel.div.textContent = label;
				hoverLabel.object.position.copy(hit.point);
				hoverLabel.object.visible = true;
				if (rend.domElement) rend.domElement.style.cursor = 'pointer';
			} else {
				hoverLabel.object.visible = false;
				if (rend.domElement) rend.domElement.style.cursor = 'default';
			}
		});

		$funcPipelines.registerRenderFunc(renderId, () => {
			const scn2 = get(scene);
			const cam2 = get(camera);
			if (labelRenderer && scn2 && cam2) labelRenderer.render(scn2, cam2);
			if (viewHelper) viewHelper.render();
		});

		rend.domElement.addEventListener('click', handleClick);
		window.addEventListener('resize', onWindowResize);
	});

	onDestroy(() => {
		$funcPipelines.deregisterUpdateFunc(updateId);
		$funcPipelines.deregisterRenderFunc(renderId);
		const rend = get(renderer);
		rend?.domElement.removeEventListener('click', handleClick);
		window.removeEventListener('resize', onWindowResize);
		if (labelRenderer) {
			labelRenderer.domElement.remove();
		}
		if (viewHelper) viewHelper.dispose();
	});
</script>
