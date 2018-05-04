'use strict';

const path = require('path');
const gulp = require('gulp');
const glob = require('glob');
const ejs = require('gulp-ejs');
const zip = require('gulp-zip');
const mergeStream = require('merge-stream');
const { formatVersionFolder } = require('./utility');

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
