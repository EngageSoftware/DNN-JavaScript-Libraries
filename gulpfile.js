'use strict';

const path = require('path');
const gulp = require('gulp');
const log = require('fancy-log');
const glob = require('glob');
const ejs = require('gulp-ejs');
const zip = require('gulp-zip');
const mergeStream = require('merge-stream');
const {
	formatVersionFolder,
	compareStrings,
	formatPackageUpgrades,
} = require('./utility');

const { dependencies } = require('./package.json');

const libraries = glob
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

libraries.forEach(library =>
	gulp.task(library.path, () =>
		mergeStream(
			gulp.src(library.manifest.files),
			gulp
				.src(library.manifest.resources || [])
				.pipe(zip('Resources.zip')),
			gulp
				.src(['LICENSE.htm', 'CHANGES.htm', '*.dnn'], {
					cwd: library.path,
				})
				.pipe(
					ejs(
						{
							version: library.version,
							versionFolder: formatVersionFolder(library.version),
						},
						{ delimiter: '~' }
					)
				)
		)
			.pipe(zip(`${library.name}_${library.version}.zip`))
			.pipe(gulp.dest('./_InstallPackages/'))
	)
);

const libraryTaskNames = libraries.map(l => l.path);

gulp.task('default', libraryTaskNames);

gulp.task('outdated', () => {
	const packageJson = require('package-json');
	const semver = require('semver');

	const allUpgradesPromises = Object.keys(dependencies).map(name => {
		const currentVersion = dependencies[name];

		const packageUpgrades = packageJson(name, { allVersions: true }).then(
			({ versions }) =>
				Object.keys(versions)
					.filter(version => semver.gt(version, currentVersion))
					.sort(semver.compare)
					.reduce(
						(upgrades, version) =>
							upgrades.set(
								semver.diff(version, currentVersion),
								version
							),
						new Map()
					)
		);

		return packageUpgrades.then(upgrades => ({
			name,
			version: currentVersion,
			upgrades,
		}));
	});

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
