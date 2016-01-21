var del = require('del');                       // Delete files/folders using globs.
var concat = require('gulp-concat');            // Concatenates files.
var extend = require('gulp-extend');            // A gulp plugin to extend (merge) JSON contents.
var fs = require('fs');                         // Node.js File System module
var gulp = require('gulp');                     // The streaming build system.
var jsonfile = require('jsonfile');             // Easily read/write JSON files.
var less = require('gulp-less');                // A LESS plugin for Gulp
var mergeStream = require('merge-stream');      // Create a stream that emits events from multiple other streams.
var path = require('path');                     // Node.js Path System module
var rename = require('gulp-rename');            // Simple file renaming methods.
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
    return del.sync([
      dist + '**', // remove all children and the parent.
      './**/*.map',
      'background/*.js',
      'css/*.css',
      'in-page-scripts/**/*.js',
      'lib/*',
      'popup/*.js',
      'popup/*.css'
    ], { force: true });
});

function gulpcopy(paths, dest) {
    return gulp.src(paths).pipe(gulp.dest(dest));
}

gulp.task('lib', ['clean'], function () {
    var lib = src + 'lib/';
    var jquery = gulp.src('node_modules/jquery/dist/jquery.min.js').pipe(gulp.dest(lib));
    var signalr = gulp.src('node_modules/ms-signalr-client/jquery.signalr-2.2.0.min.js').pipe(rename('jquery.signalr.min.js')).pipe(gulp.dest(lib));
    var select2 = gulp.src([
            'node_modules/select2/dist/js/select2.full.min.js',
            'node_modules/select2/dist/css/select2.min.css'
    ]).pipe(gulp.dest(lib + 'select2/'));
    return mergeStream(jquery, signalr, select2);
});

gulp.task('compile', ['compile:ts', 'compile:less']);

gulp.task('compile:ts', ['clean'], function () {
    var mkdirp = require('mkdirp'); // Recursively mkdir, like `mkdir -p`
    mkdirp.sync(distChromeUnpacked);

    var tsc = require('gulp-tsc'); // TypeScript compiler for gulp.js
    var project = require('./tsconfig.json');
    project.compilerOptions.sourceMap = false;
    project.compilerOptions.tscPath = './node_modules/typescript/lib/tsc.js';
    return gulp.src(project.files)
      .pipe(tsc(project.compilerOptions))
      .pipe(gulp.dest(src));
});

gulp.task('compile:less', ['clean'], function () {
    return gulp.src([
        'css/*.less',
        'popup/*.less'
    ], { base: src })
    .pipe(less())
    .pipe(gulp.dest(src));
});

// =============================================================================
// Tasks for building Chrome extension
// =============================================================================

gulp.task('prepackage:chrome', ['compile', 'lib', 'prepackage:chrome:images', 'prepackage:chrome:popup'], function () {
    var manifest = jsonfile.readFileSync('./manifest.json');
    var files = ['manifest.json'];
    files = files.concat(manifest.background.scripts);
    manifest.content_scripts.forEach(function (content) {
        files = files.concat(content.js).concat(content.css);
    });
    return gulp.src(files, {base: src}).pipe(gulp.dest(distChromeUnpacked));
});

gulp.task('prepackage:chrome:images', ['clean'], function () {
    return mergeStream(
      gulp.src(['images/icon.png']).pipe(gulp.dest(distChromeUnpacked + 'images')),
      gulp.src(['images/chrome/*.png']).pipe(gulp.dest(distChromeUnpacked + 'images/chrome')));
});

gulp.task('prepackage:chrome:popup', ['clean', 'compile'], function () {
    return gulp.src([
        'popup/popup.html',
        'popup/popup.css',
        'popup/popupBase.js',
        'popup/chromePopup.js'
    ]).pipe(gulp.dest(distChromeUnpacked + 'popup/'));
});

gulp.task('package:chrome', ['prepackage:chrome'], packageChrome);
gulp.task('package:chrome:test', ['prepackage:chrome', 'prepackage:chrome:test:constants', 'prepackage:chrome:test:shortcut'], packageChrome);

gulp.task('prepackage:chrome:test:constants', ['prepackage:chrome'], function (done) {
    return gulp.src([test + 'constants.js']).pipe(gulp.dest(distChromeUnpacked + 'background/'));
});

gulp.task('prepackage:chrome:test:shortcut', ['prepackage:chrome'], function () {
    return gulp
        .src([distChromeUnpacked + 'manifest.json', './test/shortcut.chrome.manifest.json'])
        .pipe(extend('manifest.json', true, 2))
        .pipe(gulp.dest(distChromeUnpacked));
});

function packageChrome() {
    var zip = require('gulp-zip'); // ZIP compress files.
    var manifest = jsonfile.readFileSync(distChromeUnpacked + 'manifest.json');

    return gulp.src(distChromeUnpacked + '**/*')
      .pipe(zip(manifest.short_name.toLowerCase() + '-' + manifest.version + '.zip'))
      .pipe(gulp.dest(distChrome));
}

// =============================================================================
// Tasks for building Firefox addon
// =============================================================================

gulp.task('prepackage:firefox', ['compile', 'lib', 'prepackage:firefox:images', 'prepackage:firefox:index']);

gulp.task('prepackage:firefox:images', ['clean'], function () {
    return gulp.src(['images/firefox/*.png']).pipe(gulp.dest(distFirefoxUnpacked + 'data/images/firefox/'));
});

gulp.task('prepackage:firefox:index', ['prepackage:firefox:main', 'prepackage:firefox:data', 'prepackage:firefox:popup'], function () {
    return gulp.src([
        src + 'background/constants.js',
        src + 'background/extensionBase.js',
        src + 'background/firefoxExtension.js'
    ])
    .pipe(concat('index.js'))
    .pipe(gulp.dest(distFirefoxUnpacked));
});

gulp.task('prepackage:firefox:main', ['compile'], function () {
    // We have to rename icon48.png to icon.png because of a bug in JPM
    // https://github.com/mozilla-jetpack/jpm/issues/197
    return gulp.src([
      'firefox/package.json',
      'images/icon.png'
    ])
    .pipe(gulp.dest(distFirefoxUnpacked));
});

gulp.task('prepackage:firefox:data', ['compile'], function () {
    return gulp.src([
        'css/*.css',
        'images/firefox/*',
        'lib/**/*',
        'background/signalRConnection.js',
        'in-page-scripts/**/*.js'
    ], {base: src})
    .pipe(gulp.dest(distFirefoxUnpacked + 'data'));
});

gulp.task('prepackage:firefox:popup', ['compile', 'prepackage:firefox:popup:copy', 'prepackage:firefox:popup:html']);
gulp.task('prepackage:firefox:popup:copy', ['compile'], function () {
    return gulp.src([
        'popup/popup.html',
        'popup/popup.css',
        'popup/popupBase.js',
        'popup/firefoxPopup.js'
    ])
    .pipe(gulp.dest(distFirefoxUnpacked + 'data/popup/'));
});
gulp.task('prepackage:firefox:popup:html', ['compile', 'prepackage:firefox:popup:copy'], function () {
    // Strip scripts from html for firefox
    // They inserted in FirefoxExtension.ts as content scripts to allow cross site requests
    var html = fs.readFileSync(distFirefoxUnpacked + 'data/popup/popup.html') + '';
    html = html.replace(/\s*<script[^>]+>.*<\/script>/g, '');
    fs.writeFileSync(distFirefoxUnpacked + 'data/popup/popup.html', html);
});

gulp.task('prepackage:firefox:test', ['prepackage:firefox', 'prepackage:firefox:test:index', 'prepackage:firefox:test:shortcut']);
gulp.task('prepackage:firefox:test:index', ['prepackage:firefox'], function () {
    return gulp.src([
        src + 'test/constants.js',
        src + 'background/extensionBase.js',
        src + 'background/firefoxExtension.js'
    ])
    .pipe(concat('index.js'))
    .pipe(gulp.dest(distFirefoxUnpacked));
});
gulp.task('prepackage:firefox:test:shortcut', ['prepackage:firefox:test:index'], function () {
    return gulp.src([
        distFirefoxUnpacked + 'index.js',
        test + 'shortcut.firefox.index.js'
    ])
    .pipe(concat('index.js'))
    .pipe(gulp.dest(distFirefoxUnpacked));
});

gulp.task('package:firefox', ['prepackage:firefox'], packageFirefox);
gulp.task('package:firefox:test', ['prepackage:firefox:test'], packageFirefox);

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
                    // result is a resolved result of promise returned by runTests
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
                // error is an Error object from selenium.start
                resolve(startError);
                return;
            }

            var streamError;

            gulp
                .src(configPath)
                .pipe(webdriverGulp(options))
                .on('error', function (error) {
                    // Parameter 'error' is an Error object from webdriverGulp
                    // what indicates about test fail.
                    // Actual test results handled by reporter given in wdio.conf.js
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