'use strict';

const path = require('path');
const glob = require('glob');
const semver = require('semver');
const packageJson = require('package-json');
const { dependencies } = require('../package.json');

/**
 * Gets the current list of DNN JS libraries in this repo
 *
 * @returns {object[]} An array of objects with path, manifest, name, and version
 */
function getLibraries() {
	return glob
		.sync('*/dnn-library.json')
		.map(manifestPath => ({
			path: path.dirname(manifestPath),
			manifest: require(path.resolve(manifestPath)),
		}))
		.map(library =>
			Object.assign(library, { name: path.basename(library.path) })
		)
		.map(library =>
			Object.assign(library, { version: dependencies[library.name] })
		);
}

/**
 * Gets the available upgrade versions for a library
 *
 * @param {object} library - A library object
 * @returns {Promise} A Promise which returns a Map with available version upgrades
 */
function getUpgradeVersions(library) {
	return packageJson(library.name, {
		allVersions: true,
	}).then(({ versions }) =>
		Object.keys(versions)
			.filter(version => semver.gt(version, library.version))
			.sort(semver.compare)
			.reduce(
				(upgrades, version) =>
					upgrades.set(
						semver.diff(version, library.version),
						version
					),
				new Map()
			)
	);
}

module.exports = {
	getLibraries,
	getUpgradeVersions,
};
