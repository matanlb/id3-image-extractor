import gulp from 'gulp';
import del from 'del';
import babel from 'gulp-babel';
import babelCompiler from 'babel-register';
import mocha from 'gulp-mocha';
import istanbul from 'gulp-istanbul';
import * as isparta from 'isparta'
import eslint from 'gulp-eslint';
import fs from 'fs';
import gitModified from 'gulp-gitmodified';
import runSequence from 'run-sequence';
import nodemon from 'gulp-nodemon';

const RequiredCoverage = 90; // Percent

/**
 * Clean the build generated output folder
 */
gulp.task('clean-babel', () => del(['dist/**', '!dist']));

/**
 * Clean the coverage generated output folder
 */
gulp.task('clean-coverage', () => del(['coverage/**', '!coverage']));

/**
 * Transpile source code using babel.
 * Cleans build output folders before.
 */
gulp.task('babel', ['clean-babel'], () => {
  return gulp.src('src/**/*.js')
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('dist'));
});

/**
 * Common lint process.
 * @param lintAll - should all files be linted or only changed files. default is true.
 * @param consoleOutput - should output be sent to console, or to a junit file. default is true.
 */
function lint(lintAll = true, consoleOutput = true) {
  let pipeline = gulp.src(['src/**/*.js', 'test/**/*.js'], { base: './' });

  if (!lintAll) pipeline = pipeline.pipe(gitModified(['added', 'modified', 'untracked']));

  pipeline = pipeline.pipe(eslint());

  let outputStream = [];
  if (!consoleOutput) outputStream = ['junit', fs.createWriteStream('lint-results.xml')];

  return pipeline.pipe(eslint.format(...outputStream))
    .pipe(eslint.failAfterError());
}

/**
 * Lint changed files only. output to console
 */
gulp.task('lint', () => lint(false, true));

/**
 * Lint all files, changed or not. output to console
 */
gulp.task('lint-all', () => lint(true, true));

/**
 * Lint all files, changed or not.
 * Outputs a junit file to the root of the project
 */
gulp.task('lint-ci', () => lint(true, false));

/**
 * Common run tests logic.
 * output reporter pending
 */
function runTests(reporter = 'spec') {
  return gulp.src('test/**/*.js', { read: false })
    .pipe(mocha({
      reporter,
      compilers: {
        js: babelCompiler
      }
    }))
    .on('error', err => process.exit(1))
    .pipe(istanbul.writeReports())
    .pipe(istanbul.enforceThresholds({ thresholds: { global: RequiredCoverage } }));
}

/**
 * Pre-test coverage setup
 */
gulp.task('pre-test', ['clean-coverage'], () =>
  gulp.src(['src/**/*.js'])
    .pipe(istanbul({
      instrumenter: isparta.Instrumenter,
      includeUntested: true,
    }))
    .pipe(istanbul.hookRequire())
);


/**
 * Run project tests & coverage
 * Local output to console
 */
gulp.task('test', ['pre-test'], () => runTests());

/**
 * Run project tests.
 * Output in JUNIT format to test-result.xml file in project root
 */
gulp.task('test-ci', ['pre-test'], () => runTests('mocha-junit-reporter'));

/**
 * Full build process.
 * Performs:
 *  - Lint all project files
 *  - Run test with a local output reporter
 *  - Transpile source code
 */
gulp.task('build', done => runSequence('lint-all', 'test', 'babel', done));

/**
 * Full CI build process.
 * Performs:
 *  - Lint all project files
 *  - Run test with the JUNIT output reporter
 *  - Transpile source code
 */
gulp.task('build-ci', done => runSequence('lint-ci', 'test-ci', 'babel', done));

/**
 * Start server with restart on file changes
 */
gulp.task('nodemon', ['babel'], () =>
  nodemon({
    script: 'dist/commander.js',
    ext: 'js',
    ignore: ['node_modules/**/*.js', 'dist/**/*.js', 'test/**/*.js'],
    tasks: ['babel'],
  })
);

/**
 * Starts the app with file watching
 * Calling nodemon after babeling
 */
gulp.task('run', done => runSequence('babel', 'nodemon', done));
