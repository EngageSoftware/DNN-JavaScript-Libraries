import lodash from 'lodash';
const { padStart } = lodash;
export { padStart };
export { formatPackageUpgrades } from './ui.mjs';
export { getLibraries, getUpgradeVersions } from './packages.mjs';
export { validatePackage } from './validate.mjs';

/**
 * Format a version number in the format used by DNN JS library folders
 *
 * @param {string} version - the version number
 * @returns {string} the version number in the correct format
 */
export function formatVersionFolder(version) {
	const versionFolderPadding = 2;

	return version
		.split('.')
		.map((n) => padStart(n, versionFolderPadding, '0'))
		.join('_');
}

/**
 * Compares two strings, case-insensitively, for use in Array.sort
 *
 * @param {string|undefined} a - One string value
 * @param {string|undefined} b - The other string value
 * @returns {-1|0|1} The comparison value (-1 if a is less than b, 1 if a is greater than b, 0 if they're equal)
 */
export function compareStrings(a, b) {
	const upperA = a ? a.toUpperCase() : a;
	const upperB = b ? b.toUpperCase() : b;
	if (upperA < upperB) {
		return -1;
	}

	if (upperA > upperB) {
		return 1;
	}

	return 0;
}
