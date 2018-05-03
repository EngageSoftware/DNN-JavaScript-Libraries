const path = require('path');
const gulp = require('gulp');
const glob = require('glob');
const zip = require('gulp-zip');
const mergeStream = require('merge-stream');

const dependencies = require('./package.json').dependencies;

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
			gulp.src(['LICENSE.htm', 'CHANGES.htm', '*.dnn'], {
				cwd: library.path,
			})
		)
			.pipe(zip(`${library.name}_${library.version}.zip`))
			.pipe(gulp.dest('./_InstallPackages/'))
	)
);

const libraryTaskNames = libraries.map(l => l.path);

gulp.task('default', libraryTaskNames);
