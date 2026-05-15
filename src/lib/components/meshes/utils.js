/**
 * add mesh to postprocess
 * @param {boolean} enable
 * @param {import("$lib/utils/SelectiveBloom").SelectiveBloom | null | undefined} postprocessor
 * @param {import('three').Mesh|undefined} mesh
 */
export const usePostProcessor = (enable, postprocessor, mesh) => {
	if (postprocessor && mesh) {
		if (enable) {
			postprocessor.add(mesh);
		} else {
			postprocessor.remove(mesh);
		}
	}
};
