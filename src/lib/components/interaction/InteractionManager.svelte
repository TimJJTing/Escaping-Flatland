<script>

	import { onMount, onDestroy, untrack } from 'svelte';
	import * as THREE from 'three';
	import { tweenGroup } from '$lib/utils/tweenCamera';
	import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
	import { ViewHelper } from '$lib/meshes/view-helper';
	import { tweenCamera } from '$lib/utils/tweenCamera';
	import { addLabel } from '$lib/utils/addLabel';
	import {
		getSceneContext,
		getSceneOptions,
		getSelectedPoint
	} from '$lib/components/providers/scene';

	/**
	 * @typedef {Object} Props
	 * @property {import('$lib/utils/FrustumCuller').FrustumCuller|undefined} frustumCullerRef
	 */
	/** @type {Props} */
	let { frustumCullerRef } = $props();

	const ctx = getSceneContext();
	const sceneOpts = getSceneOptions();
	const sel = getSelectedPoint();

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
		const cam = ctx.camera;
		const ctrl = ctx.controls;
		const m = ctx.mouse;
		if (!cam || !ctrl || !m || !frustumCullerRef) return;
		interactionRaycaster.setFromCamera(m, cam);
		const intersects = interactionRaycaster.intersectObjects(getTargetMeshes());
		if (intersects.length > 0) {
			const hit = intersects[0];
			const instanceId = hit.instanceId ?? 0;
			const idStr = frustumCullerRef.getIdAt(hit.object, instanceId);
			if (idStr !== undefined && sel) {
				const starIndex = Number(idStr);
				// do not update selectedPoint if it is the same id
				if (starIndex === sel.selectedPoint?.starIndex) return;

				const mat = new THREE.Matrix4();
				/** @type {import('three').InstancedMesh} */ (hit.object).getMatrixAt(instanceId, mat);
				const worldPosition = new THREE.Vector3().setFromMatrixPosition(mat);
				sel.selectedPoint = { starIndex, worldPosition };
			}
		}
	};

	$effect(() => {
		const enabled = sceneOpts.viewHelperEnabled;
		const cam = ctx.camera;
		const rend = ctx.renderer;
		const ctrl = ctx.controls;
		if (!cam || !rend) return;
		if (enabled && !viewHelper) {
			viewHelper = new ViewHelper(cam, rend, 'bottom-left');
			if (ctrl) viewHelper.setControls(ctrl);
		} else if (!enabled && viewHelper) {
			viewHelper.dispose();
			viewHelper = undefined;
		}
	});

	let hadSelection = false;
	$effect(() => {
		const sp = sel.selectedPoint;
		const cam = untrack(() => ctx.camera);
		const ctrl = untrack(() => ctx.controls);
		if (!cam || !ctrl) return;
		if (sp) {
			hadSelection = true;
			tweenCamera(cam, ctrl, sp.worldPosition, 20);
		} else if (hadSelection) {
			hadSelection = false;
			tweenCamera(cam, ctrl, new THREE.Vector3(0, 0, 0), 15);
		}
	});

	$effect(() => {
		const ctrl = ctx.controls;
		if (!ctrl) return;
		ctrl.autoRotate = sceneOpts.autoRotateEnabled;

		const disable = () => {
			if (!sceneOpts.autoRotateEnabled) return;
			sceneOpts.autoRotateEnabled = false;
		};
		ctrl.addEventListener('start', disable);
		return () => ctrl.removeEventListener('start', disable);
	});

	onMount(() => {
		const rend = ctx.renderer;
		const cam = ctx.camera;
		const scn = ctx.scene;
		const ctrl = ctx.controls;
		if (!rend || !cam || !scn || !ctrl) return;

		labelRenderer = new CSS2DRenderer();
		labelRenderer.setSize(window.innerWidth, window.innerHeight);
		labelRenderer.domElement.style.position = 'absolute';
		labelRenderer.domElement.style.top = '0px';
		labelRenderer.domElement.style.pointerEvents = 'none';
		rend.domElement.parentElement?.appendChild(labelRenderer.domElement);

		hoverLabel = addLabel(scn);

		if (sceneOpts.viewHelperEnabled) {
			viewHelper = new ViewHelper(cam, rend, 'bottom-left');
			if (ctrl) viewHelper.setControls(ctrl);
		}

		ctx.registerUpdateFunc(updateId, () => {
			tweenGroup.update();

			const m = ctx.mouse;
			const c = ctx.camera;
			if (!m || !c || !hoverLabel || !frustumCullerRef) return;

			interactionRaycaster.setFromCamera(m, c);
			const intersects = interactionRaycaster.intersectObjects(getTargetMeshes());

			if (intersects.length > 0) {
				const hit = intersects[0];
				const instanceId = hit.instanceId ?? 0;
				const label = frustumCullerRef.getIdAt(hit.object, instanceId) ?? String(instanceId);
				hoverLabel.div.textContent = label;
				hoverLabel.object.position.copy(hit.point);
				hoverLabel.object.visible = true;
				if (rend.domElement) rend.domElement.style.cursor = 'pointer';
			} else {
				hoverLabel.object.visible = false;
				if (rend.domElement) rend.domElement.style.cursor = 'default';
			}
		});

		ctx.registerRenderFunc(renderId, () => {
			const scn2 = ctx.scene;
			const cam2 = ctx.camera;
			if (labelRenderer && scn2 && cam2) labelRenderer.render(scn2, cam2);
			if (viewHelper) viewHelper.render();
		});

		rend.domElement.addEventListener('click', handleClick);
		window.addEventListener('resize', onWindowResize);

		// tween camera zoom-in when everything is mounted/loaded
		tweenCamera(cam, ctrl, new THREE.Vector3(0), 15, 1000, 2000);
	});

	onDestroy(() => {
		ctx.deregisterUpdateFunc(updateId);
		ctx.deregisterRenderFunc(renderId);
		const rend = ctx.renderer;
		rend?.domElement.removeEventListener('click', handleClick);
		window.removeEventListener('resize', onWindowResize);
		if (hoverLabel) {
			const scn = ctx.scene;
			scn?.remove(hoverLabel.object);
		}
		if (labelRenderer) {
			labelRenderer.domElement.remove();
		}
		if (viewHelper) viewHelper.dispose();
	});
</script>
