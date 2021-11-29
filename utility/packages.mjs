import path from 'path';
import glob from 'glob';
import semver from 'semver';
import log from 'fancy-log';
import chalk from 'chalk';
import packageJson from 'package-json';
import { readFile } from 'fs/promises';
import { readFileSync } from 'fs';

const { dependencies } = JSON.parse(
	await readFile(new URL('../package.json', import.meta.url))
);

const validLibraryNames = new Set(Object.keys(dependencies));

/**
 * Gets the name of the npm package from a path to a library
 *
 * @private
 * @param {string} libraryPath - The path to the library directory
 * @returns {string} The name of the library on the npm registry
 */
function resolveLibraryName(libraryPath) {
	const name = path.basename(libraryPath);
	if (validLibraryNames.has(name)) {
		return name;
	}

	for (const libraryName of validLibraryNames) {
		if (libraryName.endsWith(`/${name}`)) {
			return libraryName;
		}
	}

	log.warn(chalk`Unable to find npm package name for {yellow ${name}}`);

	return null;
}

/**
 * Gets the current list of DNN JS libraries in this repo
 *
 * @returns {object[]} An array of objects with path, manifest, name, and version
 */
export function getLibraries() {
	return glob
		.sync('*/dnn-library.json')
		.map((manifestPath) => ({
			path: path.dirname(manifestPath),
			manifest: JSON.parse(readFileSync(path.resolve(manifestPath))),
		}))
		.map((library) =>
			Object.assign(library, { name: resolveLibraryName(library.path) })
		)
		.map((library) =>
			Object.assign(library, { version: dependencies[library.name] })
		);
}

/**
 * Gets the available upgrade versions for a library
 *
 * @param {object} library - A library object
 * @returns {Promise} A Promise which returns a Map with available version upgrades
 */
export function getUpgradeVersions(library) {
	return packageJson(library.name, {
		allVersions: true,
	}).then(({ versions }) =>
		Object.keys(versions)
			.filter((version) => semver.gt(version, library.version))
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
