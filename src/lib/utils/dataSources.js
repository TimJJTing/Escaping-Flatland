import { generateData } from './generateData.js';

/**
 * @typedef {Object} StarData
 * @property {number[]} positions
 * @property {number[]} colors
 * @property {number[]} groups
 * @property {number[]} ids
 * @property {number[]} speeds
 * @property {number[]} diffRotationCAs
 * @property {number[]} diffRotationCBs
 * @property {number[]} diffRotationCCs
 * @property {number[]} planetCounts
 */

/**
 * @typedef {Object} DataSource
 * @property {string} id
 * @property {string} label
 * @property {function(number[][]): StarData} generate
 */

/** @type {DataSource[]} */
export const DATA_SOURCES = [
	{
		id: 'random',
		label: 'Random Galaxy',
		generate: (palette) => generateData(palette)
	}
];

export const DEFAULT_DATA_SOURCE_ID = 'random';
