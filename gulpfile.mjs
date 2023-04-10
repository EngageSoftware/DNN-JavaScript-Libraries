import gulp from 'gulp';
import log from 'fancy-log';
import chalk from 'chalk';
import { deleteAsync } from 'del';
import ejs from 'gulp-ejs';
import zip from 'gulp-zip';
import path from 'path';
import { glob } from 'glob';
import mergeStream from 'merge-stream';
import spawn from 'cross-spawn';
import {
	formatVersionFolder,
	compareStrings,
	formatPackageUpgrades,
	getLibraries,
	getUpgradeVersions,
	validatePackage,
} from './utility/index.mjs';

const libraries = getLibraries();

/**
 * A Gulp task which deletes the _InstallPackages folder
 *
 * @returns {Promise} A Promise which resolves when the folder is deleted
 */
function clean() {
	return deleteAsync('./_InstallPackages/');
}

/**
 * Creates a Gulp task function to package the given library
 *
 * @param {Library} library - A library object
 * @returns {Task} A Gulp task function
 */
function makePackageTask(library) {
	const packageFn = () => {
		const resourceZipStream =
			library.manifest.resources && library.manifest.resources.length
				? gulp
						.src(library.manifest.resources)
						.pipe(zip('Resources.zip'))
				: null;

		const templateData = {
			version: library.version,
			versionFolder: formatVersionFolder(library.version),
		};
		const filesStream = gulp
			.src(['LICENSE.htm', 'CHANGES.htm', '*.dnn'], {
				cwd: library.path,
			})
			.pipe(ejs(templateData, { delimiter: '~' }))
			.pipe(gulp.src(library.manifest.files));

		const packageStream = resourceZipStream
			? mergeStream(filesStream, resourceZipStream)
			: filesStream;

		return packageStream
			.pipe(zip(`${library.name}_${library.version}.zip`))
			.pipe(gulp.dest('./_InstallPackages/'));
	};

	packageFn.displayName = `Generate ${library.name}_${library.version}.zip`;

	return packageFn;
}

/**
 * A Gulp task which validates the packages
 *
 * @returns {Promise} A Promise which resolves when done
 */
async function validatePackages() {
	let invalidCount = 0;
	const zipFiles = await glob('./_InstallPackages/**/*.zip');
	for (const zipFile of zipFiles) {
		const fileName = path.basename(zipFile);
		const validationResult = await validatePackage(zipFile);
		if (validationResult.length > 0) {
			invalidCount++;
			log.error(`${fileName} was invalid:`);
			validationResult.forEach((msg) => log.error(msg));
		}
	}

	if (invalidCount > 0) {
		throw new Error(`${invalidCount} invalid package(s)`);
	}
}

const defaultTask = gulp.series(
	clean,
	gulp.parallel(...libraries.map(makePackageTask)),
	validatePackages
);

/**
 * A Gulp task to output a table of outdated libraries
 *
 * @returns {Promise} A promise which resolves when the outdated table is complete
 */
function outdated() {
	const allUpgradesPromises = libraries.map((library) =>
		getUpgradeVersions(library).then((upgrades) =>
			Object.assign(library, { upgrades })
		)
	);

	return Promise.all(allUpgradesPromises).then((allUpgrades) => {
		const validUpgrades = allUpgrades
			.filter(({ upgrades }) => upgrades.size > 0)
			.sort(({ name: a }, { name: b }) => compareStrings(a, b));

		if (validUpgrades.length === 0) {
			log.warn(
				`All ${chalk.yellow(allUpgrades.length)} packages up-to-date`
			);

			return;
		}

		log.info(`
${formatPackageUpgrades(validUpgrades)}`);
	});
}

/**
 * Creates a Gulp task function to upgrade libraries
 *
 * @param {string} upgradeType - patch, minor, or major
 * @returns {Task} A Gulp task function
 */
function makeUpgradeTask(upgradeType) {
	const upgradeFn = () => {
		const allUpgradesPromises = libraries.map((library) =>
			getUpgradeVersions(library).then((upgrades) =>
				Object.assign(library, { upgrades })
			)
		);

		return Promise.all(allUpgradesPromises).then((allUpgrades) => {
			const validUpgrades = allUpgrades.filter(({ upgrades }) =>
				upgrades.get(upgradeType)
			);

			if (validUpgrades.length === 0) {
				log.warn(`No ${upgradeType} upgrades to process`);

				return;
			}

			const upgradeWarnings = validUpgrades.map(
				({ name, version, upgrades, manifest }) => {
					const newVersion = upgrades.get(upgradeType);
					log(
						`Upgrading ${chalk.magenta(name)} from ${chalk.yellow(
							version
						)} to ${chalk.yellow(newVersion)}`
					);

					spawn.sync(
						'yarn',
						[
							'upgrade',
							'--exact',
							'--non-interactive',
							`${name}@${newVersion}`,
						],
						{
							stdio: 'inherit',
						}
					);
					spawn.sync(
						'git',
						[
							'commit',
							'--all',
							'--message',
							`Upgrade ${name} to ${newVersion} (from ${version})`,
						],
						{ stdio: 'inherit' }
					);
					spawn.sync(
						'git',
						[
							'tag',
							'--sign',
							'--message',
							`Automatic ${upgradeType} upgrade of ${name} to ${newVersion} (from ${version})`,
							`${name}_${newVersion}`,
						],
						{ stdio: 'inherit' }
					);

					const fileGlobs = manifest.files.concat(
						manifest.resources || []
					);
					const hasExtraFiles = fileGlobs.some(
						(f) => f[0] !== '!' && !f.startsWith('node_modules')
					);

					return hasExtraFiles ? name : null;
				}
			);

			upgradeWarnings
				.filter((libraryName) => libraryName !== null)
				.forEach((libraryName) =>
					log.warn(
						`The library ${chalk.magenta(
							libraryName
						)} has some resources that do not come from ${chalk.gray(
							'node_modules'
						)}, please verify that the upgrade was complete`
					)
				);
		});
	};

	upgradeFn.displayName = `Apply ${upgradeType} upgrades`;

	return upgradeFn;
}

const upgradePatch = makeUpgradeTask('patch');
const upgradeMinor = makeUpgradeTask('minor');
const upgradeMajor = makeUpgradeTask('major');
const upgrade = gulp.series(upgradePatch, upgradeMinor, upgradeMajor);

export default defaultTask;
export { outdated, upgradePatch, upgradeMinor, upgradeMajor, upgrade };
