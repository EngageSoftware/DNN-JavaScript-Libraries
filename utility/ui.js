'use strict';

const versionColumnWidth = 12;

/**
 * Create a CLIUI column to display a version number
 * @private
 * @param {string} text - The header text
 * @returns {object} A CLIUI column
 */
function createVersionHeaderColumn(text) {
	return {
		text,
		align: 'right',
		border: true,
		width: versionColumnWidth,
	};
}

/**
 * Create a CLIUI column to display a version number
 * @private
 * @param {string|undefined} version - The version number, if one exists
 * @returns {object} A CLIUI column
 */
function createVersionColumn(version) {
	return {
		text: version || 'n/a',
		align: 'right',
		padding: [0, 1, 0, 0],
		width: versionColumnWidth,
	};
}

/**
 * Generates a table to be displayed via the CLI which lists the version
 * upgrades available for the packages
 *
 * @param {object[]} packages - The package name, current version, and a Map of
 * available upgrade versions
 * @returns {string} A CLI UI string
 */
function formatPackageUpgrades(packages) {
	const maxNameLength = packages.reduce(
		(max, { name }) => Math.max(max, name.length),
		0
	);
	const nameColumnWidth = 1 + maxNameLength + 1;

	const ui = require('cliui')();
	ui.div(
		{
			text: 'Name',
			align: 'left',
			border: true,
			width: nameColumnWidth,
		},
		createVersionHeaderColumn('Current'),
		createVersionHeaderColumn('Patch'),
		createVersionHeaderColumn('Minor'),
		createVersionHeaderColumn('Major')
	);

	packages.forEach(({ name, version, upgrades }) =>
		ui.div(
			{
				text: name,
				align: 'left',
				padding: [0, 0, 0, 1],
				width: nameColumnWidth,
			},
			createVersionColumn(version),
			createVersionColumn(upgrades.get('patch')),
			createVersionColumn(upgrades.get('minor')),
			createVersionColumn(upgrades.get('major'))
		)
	);

	return ui.toString();
}

module.exports = {
	formatPackageUpgrades,
};
