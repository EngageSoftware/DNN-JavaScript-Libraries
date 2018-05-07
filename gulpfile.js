'use strict';

const gulp = require('gulp');
const log = require('fancy-log');
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
			log.warn(`All ${allUpgrades.length} packages up-to-date`);

			return;
		}

		log.info(`
${formatPackageUpgrades(validUpgrades)}`);
	});
});
