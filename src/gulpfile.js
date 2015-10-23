var concat = require('gulp-concat');           // Concatenates files.
var fs = require('fs');                        // Node.js File System module
var gulp = require('gulp');                    // The streaming build system.
var jsonfile = require('jsonfile');            // Easily read/write JSON files.
var merge = require('merge-stream');           // Create a stream that emits events from multiple other streams.
var path = require('path');                    // Node.js Path System module
var selenium = require('selenium-standalone'); // Installs a selenium-standalone command line to install and start a standalone selenium server
var typescript = require('typescript');        // TypeScript is a language for application scale JavaScript development
var webdriver = require('gulp-webdriver');     // Runs selenium tests with the WebdriverIO testrunner
var webdriverio = require('webdriverio');      // A nodejs bindings implementation for selenium 2.0/webdriver

gulp.task('default', ['build']);
gulp.task('build', ['package:chrome', 'package:firefox']);
gulp.task('build:test', ['package:chrome:test', 'package:firefox:test']);

// =============================================================================
// Global variables
// =============================================================================

// Output folders for *.crx and *.xpi files
var dist = '../dist/';
var distFirefox = dist + 'firefox/';
var dirCrx = dist + 'chrome/';
var unpackedCrx = dirCrx + 'unpacked/';

// =============================================================================
// Common tasks (used for both extensions)
// =============================================================================

gulp.task('clean', function () {
    var del = require('del'); // Delete files/folders using globs.
    return del.sync([
      dist + '**', // remove all children and the parent.
      './**/*.map',
      'chrome/*.js',
      'css/*.css',
      'extension-base/*.js',
      'firefox/*.js',
      'in-page-scripts/**/*.js'],
      { force: true });
});

gulp.task('compile', ['compile:ts', 'compile:less']);

gulp.task('compile:ts', ['clean'], function () {
    var mkdirp = require('mkdirp'); // Recursively mkdir, like `mkdir -p`
    mkdirp.sync(unpackedCrx);

    var tsc = require('gulp-tsc'); // TypeScript compiler for gulp.js
    var project = require('./tsconfig.json');
    project.compilerOptions.sourceMap = false;
    return gulp.src(project.files)
      .pipe(tsc(project.compilerOptions))
      .pipe(gulp.dest('./'));
});

gulp.task('compile:less', ['clean'], function () {
    var less = require('gulp-less'); // A LESS plugin for Gulp
    return gulp.src('css/*.less')
      .pipe(less())
      .pipe(gulp.dest('css'));
});

// =============================================================================
// Tasks for building Chrome extension
// =============================================================================

gulp.task('prepackage:chrome', ['prepackage:chrome:images', 'compile'], function () {
    var manifest = jsonfile.readFileSync('./manifest.json');
    var files = [];
    manifest.background.scripts = manifest.background.scripts.map(mapCallback);
    var content = manifest.content_scripts[0];
    content.js = content.js.map(mapCallback);
    content.css = content.css.map(mapCallback);

    function mapCallback(file, index, array) {
        files.push(file);
        return path.basename(file);
    }

    jsonfile.writeFileSync(unpackedCrx + 'manifest.json', manifest, { spaces: 2 });

    return gulp.src(files).pipe(gulp.dest(unpackedCrx));
});

gulp.task('prepackage:chrome:images', ['clean'], function () {
    return merge(
      gulp.src(['images/icon.png']).pipe(gulp.dest(unpackedCrx + 'images')),
      gulp.src(['images/chrome/*.png']).pipe(gulp.dest(unpackedCrx + 'images/chrome')));
});

gulp.task('package:chrome', ['prepackage:chrome'], packageChrome);
gulp.task('package:chrome:test', ['prepackage:chrome', 'test:constants:chrome'], packageChrome);

gulp.task('test:constants:chrome', ['prepackage:chrome'], function () {
    return gulp.src(['test/constants.js']).pipe(gulp.dest(unpackedCrx));
});

function packageChrome() {
    var crx = require('gulp-crx'); // Pack Chrome Extension in the pipeline.
    var manifest = jsonfile.readFileSync(unpackedCrx + 'manifest.json');

    // Specify the location (relative) of the already generated .pem file for the Chrome extension.
    var pemKey = 'chrome/debug-key.pem';

    return gulp.src(unpackedCrx)
      .pipe(crx({
          privateKey: fs.readFileSync(pemKey, 'utf8'),
          filename: manifest.name + '.crx'
      }))
      .pipe(gulp.dest(dirCrx));
}

// =============================================================================
// Tasks for building Firefox addon
// =============================================================================

gulp.task('prepackage:firefox', ['compile', 'prepackage:firefox:main', 'prepackage:firefox:data'], function () {
    return gulp.src([
      'extension-base/constants.js',
      'extension-base/ExtensionBase.js',
      'firefox/FirefoxExtension.js'])
      .pipe(concat('index.js'))
      .pipe(gulp.dest(distFirefox));
});

gulp.task('prepackage:firefox:test', ['compile', 'prepackage:firefox:main', 'prepackage:firefox:data'], function () {
    return gulp.src([
      'test/constants.js',
      'extension-base/ExtensionBase.js',
      'firefox/FirefoxExtension.js'])
      .pipe(concat('index.js'))
      .pipe(gulp.dest(distFirefox));
});

gulp.task('prepackage:firefox:main', ['clean'], function () {
    // We have to rename icon48.png to icon.png because of a bug in JPM
    // https://github.com/mozilla-jetpack/jpm/issues/197
    return gulp.src([
      'firefox/package.json',
      'images/icon.png'])
      .pipe(gulp.dest(distFirefox));
});

gulp.task('prepackage:firefox:data', ['compile'], function () {
    var rename = require('gulp-rename'); // Simple file renaming methods.
    var signalR = gulp.src('node_modules/ms-signalr-client/jquery.signalr*.min.js')
      .pipe(rename('jquery.signalr.min.js'))
      .pipe(gulp.dest(distFirefox + 'data'));

    var flatten = require('gulp-flatten');         // remove or replace relative path for files
    var data = gulp.src([
      'css/*.css',
      'images/firefox/*',
      'node_modules/jquery/dist/jquery.min.js',
      'extension-base/SignalRConnection.js',
      'in-page-scripts/**/*.js',
    ])
      .pipe(flatten())
      .pipe(gulp.dest(distFirefox + 'data'));

    return merge(signalR, data);
});

gulp.task('package:firefox', ['prepackage:firefox', 'package:chrome'], packageFirefox);
gulp.task('package:firefox:test', ['prepackage:firefox:test', 'package:chrome:test'], packageFirefox);

function packageFirefox(callback) {
    var currentDir = process.cwd();
    process.chdir(distFirefox);
    var jpmXpi = require('jpm/lib/xpi'); // Packaging utility for Mozilla Jetpack Addons
    var addonManifest = require('./firefox/package.json');
    var promise = jpmXpi(addonManifest);
    promise.then(function () {
        process.chdir(currentDir)
        callback();
    });
}

// =============================================================================
// Tasks for running automated tests
// =============================================================================

gulp.task('install:selenium', [], function (callback) {
    selenium.install({}, callback); // install selenium with default options
});

gulp.task('test', ['install:selenium', 'build'], function (taskCallback) {
    selenium.start({}, function (startError, serverProcess) { // launch selenium server
        if (startError) {
            return taskCallback(startError);
        }

        var streamError;
        gulp
          .src('./test/webdriverio/wdio.conf.js')
          .pipe(webdriver(getWdioOptions(false)))
          .on('error', function (error) {
              streamError = error;
          })
          .on('finish', function () {
              serverProcess.kill();
              taskCallback(streamError);
          });
    });
});

gulp.task('test:dev', ['install:selenium', 'build:test'], function (taskCallback) {
    selenium.start({}, function (startError, serverProcess) { // launch selenium server
        if (startError) {
            return taskCallback(startError);
        }

        var streamError;
        gulp
          .src('./test/webdriverio/wdio.conf.js')
          .pipe(webdriver(getWdioOptions(true)))
          .on('error', function (error) {
              streamError = error;
          })
          .on('finish', function () {
              serverProcess.kill();
              taskCallback(streamError);
          });
    });
});

function getWdioOptions(runsOnDevServer) {
    // gulp-webdriver incorrectly locates WebdriverIO binary
    // we need to fix it
    var isWin = /^win/.test(process.platform);
    var options = { wdioBin: path.join(process.cwd(), 'node_modules', '.bin', isWin ? 'wdio.cmd' : 'wdio') };

    if (runsOnDevServer) {
        // substitute baseUrl option in wdio.conf.js with a trackerServiceUrl from /test/constants.js
        var constants = fs.readFileSync(path.join(process.cwd(), '/test/constants.js'), 'utf8');
        var regex = /var trackerServiceUrl = ['"]([^'"]+)['"]/m;
        var match = constants.match(regex);
        if (match) {
            options.baseUrl = match[1];
        }
    }
    return options;
}