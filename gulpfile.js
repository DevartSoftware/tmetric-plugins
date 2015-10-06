var gulp = require('gulp');                    // The streaming build system.
var flatten = require('gulp-flatten');         // remove or replace relative path for files
var typescript = require('typescript');        // TypeScript is a language for application scale JavaScript development
var tsc = require('gulp-tsc');                 // TypeScript compiler for gulp.js
var del = require('del');                      // Delete files/folders using globs.
var merge = require('merge-stream');           // Create a stream that emits events from multiple other streams.
var jpmXpi = require('jpm/lib/xpi');           // Packaging utility for  Mozilla Jetpack Addons
var selenium = require('selenium-standalone'); // Installs a selenium-standalone command line to install and start a standalone selenium server
var webdriverio = require('webdriverio');      // A nodejs bindings implementation for selenium 2.0/webdriver
var webdriver = require('gulp-webdriver');     // Runs selenium tests with the WebdriverIO testrunner

gulp.task('build', ['compile', 'pre-package', 'package']);
gulp.task('compile', ['clean', 'compile:chrome', 'compile:firefox']);
gulp.task('pre-package', ['pre-package:chrome', 'pre-package:firefox']);
gulp.task('package', ['package:chrome', 'package:firefox']);

// Output folders for *.crx and *.xpi files
var outDir = 'dist/';
var outDirFirefox = outDir + 'firefox/';
var outDirChrome = outDir + 'chrome/';

// Specify the location (relative) of the already generated .pem file for the Chrome extension. 
var pemKey = 'chrome/debug-key.pem';

var compilerOptions = {
  "target": "ES5",
  "module": "commonjs",
  "sourceMap": false,
  "removeComments": true,
  "noEmitOnError": true
};

gulp.task('compile:chrome', ['clean'], function () {
  return gulp.src([
    'interfaces/*.d.ts',
    'typings/tsd.d.ts',
    'extension-base/*.ts',
    'chrome/*.ts',
    'in-page-scripts/**/*.ts'])
    .pipe(tsc(compilerOptions))
    .pipe(gulp.dest(outDirChrome));
});

gulp.task('pre-package:chrome', ['compile:chrome'], function () {
  // Gulp maintains directory structure only for globs.
  // See discussion here https://github.com/gulpjs/gulp/issues/151
  return gulp.src([
    'manifest.json',
    '**/node_modules/jquery/dist/jquery.min.js',
    '**/node_modules/ms-signalr-client/jquery.signalr*.min.js',
    '**/css/*',
    '**/images/*.png',
    '**/images/chrome/*.png'
  ])
    .pipe(gulp.dest(outDirChrome));
});

var chromeManifest = require('./manifest.json');

gulp.task('package:chrome', ['pre-package:chrome'], function () {
  var crx = require('gulp-crx'); // Pack Chrome Extension in the pipeline.
  var fs = require('fs');        // Node.js File System module
  return gulp.src(outDirChrome)
    .pipe(crx({
      privateKey: fs.readFileSync(pemKey, 'utf8'),
      filename: chromeManifest.name + '.crx'
    }))
    .pipe(gulp.dest(outDirChrome));
});

gulp.task('compile:firefox', ['clean'], function () {
  var order = require('gulp-order');   // Allows you to reorder a stream of files
  var concat = require('gulp-concat'); // Concatenates files.
  var core = gulp.src([
    'interfaces/*.d.ts',
    'extension-base/ExtensionBase.ts',
    'firefox/FirefoxExtension.ts'])
    .pipe(tsc(compilerOptions))
    .pipe(order([
      'ExtensionBase.js',
      'FirefoxExtension.js']))
    .pipe(concat('index.js'))
    .pipe(gulp.dest(outDirFirefox));

  var data = gulp.src([
    'interfaces/*.d.ts',
    'typings/tsd.d.ts',
    'extension-base/SignalRConnection.ts',
    'in-page-scripts/**/*.ts'])
    .pipe(tsc(compilerOptions))
    .pipe(flatten())
    .pipe(gulp.dest(outDirFirefox + 'data'));

  return merge(core, data);
});

gulp.task('pre-package:firefox', ['compile:firefox'], function () {
  var rename = require('gulp-rename'); // Simple file renaming methods.
  var signalR = gulp.src('node_modules/ms-signalr-client/jquery.signalr*.min.js')
    .pipe(rename('jquery.signalr.min.js'))
    .pipe(gulp.dest(outDirFirefox + 'data'));

  var dataFiles = gulp.src([
    'node_modules/jquery/dist/jquery.min.js',
    'css/*',
    'images/*',
    'images/firefox/*'
  ])
    .pipe(flatten())
    .pipe(gulp.dest(outDirFirefox + 'data'));

  // We have to rename icon48.png to icon.png because of a bug in JPM
  // https://github.com/mozilla-jetpack/jpm/issues/197
  var rootFiles = gulp.src(['firefox/package.json', 'images/icon.png'])
    .pipe(gulp.dest(outDirFirefox));

  return merge(signalR, dataFiles).add(rootFiles);
});

var firefoxManifest = require('./firefox/package.json');

gulp.task('package:firefox', ['pre-package:firefox'], function (callback) {
  var currentDir = process.cwd();
  process.chdir(outDirFirefox);
  var promise = jpmXpi(firefoxManifest);
  promise.then(function () {
    process.chdir(currentDir)
    callback();
  });
});

gulp.task('clean', function () {
  return del([
    outDir + '**', // remove all children and the parent.
    'extension-base/*.js',
    'chrome/*.js',
    'firefox/*.js',
    './**/*.map'
  ]);
});

gulp.task('install:selenium', [], function (callback) {
  selenium.install({}, callback); // install selenium with default options
});

gulp.task('test', ['install:selenium'], function (taskCallback) {
  selenium.start({}, function (startError, serverProcess) { // launch selenium server
    if (startError) {
      return taskCallback(startError);
    }
     
    // gulp-webdriver incorrectly locates WebdriverIO binary
    // we need to fix it
    var path = require('path');
    var isWin = /^win/.test(process.platform);
    var options = { wdioBin: path.join(process.cwd(), 'node_modules', '.bin', isWin ? 'wdio.cmd' : 'wdio') };

    var streamError;
    gulp
      .src('./test/webdriverio/wdio.conf.js')
      .pipe(webdriver(options))
      .on('error', function (error) {
        streamError = error;
      })
      .on('finish', function () {
        serverProcess.kill();
        taskCallback(streamError);
      });
  });
});
