// @ts-nocheck
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export const addLabel = (scene) => {
	const outerDiv = document.createElement('div');
	const labelDiv = document.createElement('div');
	labelDiv.className = 'label fsc400 font-mono';
	labelDiv.style.transform = 'translateY(-20px)';
	outerDiv.appendChild(labelDiv);
	const labelObject = new CSS2DObject(outerDiv);
	labelObject.visible = false;
	scene.add(labelObject);
	return {object: labelObject, div: labelDiv};
};
