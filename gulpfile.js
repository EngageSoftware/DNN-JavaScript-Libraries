'use strict';

const gulp = require('gulp');
const log = require('fancy-log');
const chalk = require('chalk');
const ejs = require('gulp-ejs');
const zip = require('gulp-zip');
const mergeStream = require('merge-stream');
const {
	formatVersionFolder,
	compareStrings,
	formatPackageUpgrades,
	getLibraries,
	getUpgradeVersions,
} = require('./utility');

const libraries = getLibraries();

libraries.forEach(library =>
	gulp.task(library.path, () => {
		const mainFileStream = gulp.src(library.manifest.files);
		const resourceZipStream = gulp
			.src(library.manifest.resources || [])
			.pipe(zip('Resources.zip'));

		const templateData = {
			version: library.version,
			versionFolder: formatVersionFolder(library.version),
		};
		const packageFilesStream = gulp
			.src(['LICENSE.htm', 'CHANGES.htm', '*.dnn'], {
				cwd: library.path,
			})
			.pipe(ejs(templateData, { delimiter: '~' }));

		return mergeStream(
			mainFileStream,
			resourceZipStream,
			packageFilesStream
		)
			.pipe(zip(`${library.name}_${library.version}.zip`))
			.pipe(gulp.dest('./_InstallPackages/'));
	})
);

const libraryTaskNames = libraries.map(library => library.path);

gulp.task('default', libraryTaskNames);

gulp.task('outdated', () => {
	const allUpgradesPromises = libraries.map(library =>
		getUpgradeVersions(library).then(upgrades =>
			Object.assign(library, { upgrades })
		)
	);

	return Promise.all(allUpgradesPromises).then(allUpgrades => {
		const validUpgrades = allUpgrades
			.filter(({ upgrades }) => upgrades.size > 0)
			.sort(({ name: a }, { name: b }) => compareStrings(a, b));

		if (validUpgrades.length === 0) {
			log.warn(
				chalk`All {yellow ${allUpgrades.length}} packages up-to-date`
			);

			return;
		}

		log.info(`
${formatPackageUpgrades(validUpgrades)}`);
	});
});

['patch', 'minor', 'major'].forEach(upgradeType =>
	gulp.task(`upgrade-${upgradeType}`, () => {
		const allUpgradesPromises = libraries.map(library =>
			getUpgradeVersions(library).then(upgrades =>
				Object.assign(library, { upgrades })
			)
		);

		return Promise.all(allUpgradesPromises).then(allUpgrades => {
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
						chalk`Upgrading {magenta ${name}} from {yellow ${version}} to {yellow ${newVersion}}`
					);

					const spawn = require('cross-spawn');
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

					if (
						manifest.files
							.concat(manifest.resources || [])
							.some(f => !f.startsWith('node_modules'))
					) {
						return name;
					}
				}
			);

			upgradeWarnings.forEach(libraryName =>
				log.warn(
					chalk`The library {magenta ${libraryName}} has some resources that do not come from {gray node_modules}, please verify that the upgrade was complete`
				)
			);
		});
	})
);
