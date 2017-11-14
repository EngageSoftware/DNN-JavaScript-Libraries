const path = require("path");
const gulp = require("gulp");
const glob = require("glob");
const zip = require("gulp-zip");
const mergeStream = require("merge-stream");

const matches = glob.sync("*/dnn-library.json");
gulp.task(
  "default",
  matches
    .map(m => ({ manifestPath: m, manifest: require(path.resolve(m)) }))
    .map(({ manifestPath, manifest }) => ({
      manifestPath,
      task: gulp.task(manifestPath, () =>
        mergeStream(
          gulp.src(manifest.files),
          gulp.src(manifest.resources || []).pipe(zip("Resources.zip"))
        )
          .add(
            gulp.src(["LICENSE.htm", "CHANGES.htm", "*.dnn"], {
              cwd: path.dirname(manifestPath)
            })
          )
          .pipe(zip(path.basename(path.dirname(manifestPath)) + ".zip"))
          .pipe(gulp.dest("./_InstallPackages/"))
      )
    }))
    .reduce((taskNames, { manifestPath }) => taskNames.concat(manifestPath), [])
);
