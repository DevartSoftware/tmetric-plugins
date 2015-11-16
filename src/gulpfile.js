var Promise = require('promise');
var concat = require('gulp-concat');            // Concatenates files.
var extend = require('gulp-extend');            // A gulp plugin to extend (merge) JSON contents.
var fs = require('fs');                         // Node.js File System module
var gulp = require('gulp');                     // The streaming build system.
var jsonfile = require('jsonfile');             // Easily read/write JSON files.
var merge = require('merge-stream');            // Create a stream that emits events from multiple other streams.
var path = require('path');                     // Node.js Path System module
var selenium = require('selenium-standalone');  // Installs a selenium-standalone command line to install and start a standalone selenium server
var webdriver = require('selenium-webdriver');  // Selenium is a browser automation library
var webdriverGulp = require('gulp-webdriver');  // Runs selenium tests with the WebdriverIO testrunner

gulp.task('default', ['build']);
gulp.task('build', ['package:chrome', 'package:firefox']);
gulp.task('build:test', ['package:chrome:test', 'package:firefox:test', 'profile:firefox:test']);

// =============================================================================
// Global variables
// =============================================================================

// Output folders for *.crx and *.xpi files
var src = process.cwd() + '/';
var dist = path.normalize(src + '/../dist/');
var distChrome = dist + 'chrome/';
var distChromeUnpacked = distChrome + 'unpacked/';
var distFirefox = dist + 'firefox/';
var distFirefoxUnpacked = distFirefox + 'unpacked/';
var test = src + 'test/';

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
    mkdirp.sync(distChromeUnpacked);

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

    jsonfile.writeFileSync(distChromeUnpacked + 'manifest.json', manifest, { spaces: 2 });

    return gulp.src(files).pipe(gulp.dest(distChromeUnpacked));
});

gulp.task('prepackage:chrome:images', ['clean'], function () {
    return merge(
      gulp.src(['images/icon.png']).pipe(gulp.dest(distChromeUnpacked + 'images')),
      gulp.src(['images/chrome/*.png']).pipe(gulp.dest(distChromeUnpacked + 'images/chrome')));
});

gulp.task('package:chrome', ['prepackage:chrome'], packageChrome);
gulp.task('package:chrome:test', ['prepackage:chrome', 'prepackage:chrome:test:constants', 'prepackage:chrome:test:shortcut'], packageChrome);

gulp.task('prepackage:chrome:test:constants', ['prepackage:chrome'], function () {
    return gulp.src(['test/constants.js']).pipe(gulp.dest(distChromeUnpacked));
});

gulp.task('prepackage:chrome:test:shortcut', ['prepackage:chrome'], function () {
    return gulp
        .src([distChromeUnpacked + 'manifest.json', './test/shortcut.chrome.manifest.json'])
        .pipe(extend('manifest.json', true, 2))
        .pipe(gulp.dest(distChromeUnpacked));
});

function packageChrome() {

    var crx = require('gulp-crx'); // Pack Chrome Extension in the pipeline.
    var manifest = jsonfile.readFileSync(distChromeUnpacked + 'manifest.json');

    // Specify the location (relative) of the already generated .pem file for the Chrome extension.
    var pemKey = src + 'chrome/debug-key.pem';

    return gulp.src(distChromeUnpacked)
      .pipe(crx({
          privateKey: fs.readFileSync(pemKey, 'utf8'),
          filename: manifest.name + '.crx'
      }))
      .pipe(gulp.dest(distChrome));
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
      .pipe(gulp.dest(distFirefoxUnpacked));
});

gulp.task('prepackage:firefox:test', ['compile', 'prepackage:firefox:main', 'prepackage:firefox:data'], function () {
    return gulp.src([
      'test/constants.js',
      'extension-base/ExtensionBase.js',
      'firefox/FirefoxExtension.js'])
      .pipe(concat('index.js'))
      .pipe(gulp.dest(distFirefoxUnpacked));
});

gulp.task('prepackage:firefox:main', ['clean'], function () {
    // We have to rename icon48.png to icon.png because of a bug in JPM
    // https://github.com/mozilla-jetpack/jpm/issues/197
    return gulp.src([
      'firefox/package.json',
      'images/icon.png'])
      .pipe(gulp.dest(distFirefoxUnpacked));
});

gulp.task('prepackage:firefox:data', ['compile'], function () {
    var rename = require('gulp-rename'); // Simple file renaming methods.
    var signalR = gulp.src('node_modules/ms-signalr-client/jquery.signalr*.min.js')
      .pipe(rename('jquery.signalr.min.js'))
      .pipe(gulp.dest(distFirefoxUnpacked + 'data'));

    var flatten = require('gulp-flatten');         // remove or replace relative path for files
    var data = gulp.src([
      'css/*.css',
      'images/firefox/*',
      'node_modules/jquery/dist/jquery.min.js',
      'extension-base/SignalRConnection.js',
      'in-page-scripts/**/*.js',
    ])
      .pipe(flatten())
      .pipe(gulp.dest(distFirefoxUnpacked + 'data'));

    return merge(signalR, data);
});

gulp.task('package:firefox', ['prepackage:firefox'], packageFirefox);
gulp.task('package:firefox:test', ['prepackage:firefox:test', 'prepackage:firefox:test:shortcut'], packageFirefox);

gulp.task('prepackage:firefox:test:shortcut', ['prepackage:firefox:test'], function () {
    var searchStr = 'return FirefoxExtension;';
    var replaceStr = fs.readFileSync(test + 'shortcut.firefox.index.js', 'utf8') + searchStr;
    return gulp
        .src([
            distFirefoxUnpacked + 'index.js',
            test + 'shortcut.firefox.index.js'
        ])
        .pipe(concat('index.js'))
        .pipe(gulp.dest(distFirefoxUnpacked));
});

function packageFirefox(callback) {
    process.chdir(distFirefoxUnpacked);
    var jpmXpi = require('jpm/lib/xpi'); // Packaging utility for Mozilla Jetpack Addons
    var addonManifest = require(distFirefoxUnpacked + 'package.json');
    var promise = jpmXpi(addonManifest, { xpiPath: distFirefox });
    promise.then(function () {
        process.chdir(src)
        callback();
    });
}

// prepare firefox encoded profile (with extension) to run test on
gulp.task('profile:firefox:test', ['package:firefox:test'], function () {

    var extensionFileName = fs.readdirSync(distFirefox).filter(function (filename) {
        return /\.xpi$/.test(filename);
    })[0];

    var firefox = require('selenium-webdriver/firefox');
    var profile = new firefox.Profile();

    profile.addExtension(distFirefox + extensionFileName);

    return profile.encode().then(function (encodedProfile) {
        fs.writeFileSync(test + 'webdriverio/profiles/firefox/profile', encodedProfile);
    });

});

// =============================================================================
// Tasks for running automated tests
// =============================================================================

gulp.task('test', ['build'], function () {
    return runTestsOnDev(false);
});

gulp.task('test:dev', ['build:test'], function () {
    return runTestsOnDev(true);
});

function runTestsOnDev(runsOnDevServer) {

    var options = getWdioOptions(runsOnDevServer);
    var configsPath = test + 'webdriverio/configs/';

    var configs = fs.readdirSync(configsPath).filter(function (file) {
        return /^.*\.js$/.test(file);
    });

    return new Promise(function (resolve, reject) {

        var testErrors = [];

        configs.reduce(function (promise, file, index) {
            return promise
                .then(function () {
                    return runTests(configsPath + file, options);
                })
                .then(function (result) {
                    if (result) {
                        testErrors.push(result);
                    }
                });
        }, Promise.resolve(true)).then(function () {
            if (testErrors.length) {
                reject(new Error('Tests error'));
            } else {
                resolve();
            }
        });

    });

}

function runTests(configPath, options) {

    return new Promise(function (resolve, reject) {

        selenium.start(function (startError, serverProcess) { // launch selenium server

            if (startError) {
                resolve(startError);
                return;
            }

            var streamError;

            gulp
                .src(configPath)
                .pipe(webdriverGulp(options))
                .on('error', function (error) {
                    streamError = error;
                })
                .on('finish', function () {
                    serverProcess.kill();
                    resolve(streamError);
                });

        });

    });

}

function getWdioOptions(runsOnDevServer) {
    // gulp-webdriver incorrectly locates WebdriverIO binary
    // we need to fix it
    var isWin = /^win/.test(process.platform);
    var options = { wdioBin: path.join(process.cwd(), 'node_modules', '.bin', isWin ? 'wdio.cmd' : 'wdio') };

    if (runsOnDevServer) {
        // substitute baseUrl option in wdio.conf.js with a trackerServiceUrl from /test/constants.js
        var constants = fs.readFileSync(test + 'constants.js', 'utf8');
        var regex = /var trackerServiceUrl = ['"]([^'"]+)['"]/m;
        var match = constants.match(regex);
        if (match) {
            options.baseUrl = match[1];
        }
    }
    return options;
}