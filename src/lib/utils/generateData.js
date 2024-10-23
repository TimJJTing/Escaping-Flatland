/**
 * Generate some random particles
 * @param {number[][]} palette color palette
 * @param {number} n number of random particles
 * @param {number} s spacing
 */
export const generateData = (palette, n = 500000, s = 10000) => {
	// coord
	const positions = [];
	const colors = [];
	const groups = [];
	const ids = [];
	let s2 = s / 2; // particles spread in the cube
	for (let i = 0; i < n; i++) {
		let group = Math.floor(Math.random() * palette.length);
		// positions
		positions.push(Math.random() * s - s2, Math.random() * s - s2, Math.random() * s - s2);
		groups.push(group);
		colors.push(palette[group][0] / 255, palette[group][1] / 255, palette[group][2] / 255);
		ids.push(i);
	}
	return { positions, colors, groups, ids };
};
