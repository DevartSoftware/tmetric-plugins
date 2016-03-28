var del = require('del');                       // Delete files/folders using globs.
var concat = require('gulp-concat');            // Concatenates files.
var fs = require('fs');                         // Node.js File System module
var gulp = require('gulp');                     // The streaming build system.
var jsonfile = require('jsonfile');             // Easily read/write JSON files.
var less = require('gulp-less');                // A LESS plugin for Gulp
var mergeStream = require('merge-stream');      // Create a stream that emits events from multiple other streams.
var path = require('path');                     // Node.js Path System module
var rename = require('gulp-rename');            // Simple file renaming methods.
var stripDebug = require('gulp-strip-debug');   // Strip console and debugger statements from JavaScript code.

// =============================================================================
// Global variables
// =============================================================================

// Output folders for *.crx and *.xpi files
var src = process.cwd() + '/';
var test = src + 'test/';

var dist = path.normalize(src + '/../dist/');
var distRelease = dist + 'release/';
var distTest = dist + 'test/';

var distReleaseChrome = distRelease + 'chrome/';
var distReleaseChromeUnpacked = distReleaseChrome + 'unpacked/';
var distReleaseFirefox = distRelease + 'firefox/';
var distReleaseFirefoxUnpacked = distReleaseFirefox + 'unpacked/';

var distTestChrome = distTest + 'chrome/';
var distTestChromeUnpacked = distTestChrome + 'unpacked/';
var distTestFirefox = distTest + 'firefox/';
var distTestFirefoxUnpacked = distTestFirefox + 'unpacked/';

var files = {
    common: [
        'background/signalRConnection.js',
        'css/*.css',
        'in-page-scripts/integrations/*.js',
        'in-page-scripts/integrationService.js',
        'in-page-scripts/page.js',
        'in-page-scripts/utils.js',
        'lib/**',
        'images/*.png',
        'popup/popup.html',
        'popup/popupBase.js'
    ],
    chrome: [
        'background/chromeExtension.js',
        'background/constants.js',
        'background/extensionBase.js',
        'background/shamPort.js',
        'images/chrome/*',
        'popup/chromePopup.js',
        'manifest.json'
    ],
    firefox: {
        root: [
            'firefox/package.json',
            'images/icon.png'
        ],
        index: {
            release: [
                'background/constants.js',
                'background/extensionBase.js',
                'background/firefoxExtension.js'
            ],
            test: [
                'test/constants.js',
                'background/extensionBase.js',
                'background/firefoxExtension.js'
            ]
        },
        data: [
            'images/firefox/*',
            'in-page-scripts/pageTalk.js',
            'popup/firefoxPopup.js'
        ]
    }
};

// =============================================================================
// Common tasks (used for both extensions)
// =============================================================================

gulp.task('default', ['build']);
gulp.task('build', ['package:chrome:release', 'package:firefox:release']);
gulp.task('build:test', ['package:chrome:test', 'package:firefox:test']);

// clean

function clean(input) {
    return del.sync(input, { force: true });
}

gulp.task('clean:sources', () => {
    clean([
        './**/*.map',
        'background/*.js',
        'css/*.css',
        'in-page-scripts/**/*.js',
        'lib/*',
        'popup/*.js'
    ]);
});
gulp.task('clean:release', ['clean:sources'], () => { clean([distRelease + '**']); });
gulp.task('clean:test', ['clean:sources'], () => { clean([distTest + '**']); });
gulp.task('clean', ['clean:sources'], () => { clean([dist + '**']); });

// lib

gulp.task('lib', ['clean:sources'], function () {
    var lib = src + 'lib/';
    var jquery = gulp.src('node_modules/jquery/dist/jquery.min.js').pipe(gulp.dest(lib));
    var signalr = gulp.src('node_modules/ms-signalr-client/jquery.signalr-2.2.0.min.js').pipe(rename('jquery.signalr.min.js')).pipe(gulp.dest(lib));
    var select2 = gulp.src([
            'node_modules/select2/dist/js/select2.full.min.js',
            'node_modules/select2/dist/css/select2.min.css'
    ]).pipe(gulp.dest(lib + 'select2/'));
    return mergeStream(jquery, signalr, select2);
});

// compile

gulp.task('compile', ['compile:ts', 'compile:less']);

gulp.task('compile:ts', ['clean:sources'], function () {
    var tsc = require('gulp-tsc'); // TypeScript compiler for gulp.js
    var project = require('./tsconfig.json');
    project.compilerOptions.sourceMap = false;
    project.compilerOptions.tscPath = './node_modules/typescript/lib/tsc.js';
    return gulp.src(project.files)
      .pipe(tsc(project.compilerOptions))
      .pipe(gulp.dest(src));
});

gulp.task('compile:less', ['clean:sources'], function () {
    return gulp.src('css/*.less').pipe(less()).pipe(gulp.dest(src + 'css/'));
});

// common operations

function replaceInFile(file, find, replace) {
    var text = fs.readFileSync(file) + '';
    if (text) {
        text = text.replace(find, replace);
        fs.writeFileSync(file, text);
    }
}

function stripDebugCommon(folder) {
    return gulp.src(folder + '**/*.js', { base: folder })
        .pipe(stripDebug())
        .pipe(gulp.dest(folder));
}

function setTestServerUrl(file) {
    var testServer = process.env.TestServerUrl;
    if (testServer) {
        replaceInFile(file, /var trackerServiceUrl = ['"]([^'"]+)['"];/, 'var trackerServiceUrl ="' + testServer + '";');
    }
}

// =============================================================================
// Tasks for building Chrome extension
// =============================================================================

function copyFilesChrome(destFolder) {
    return gulp.src(files.common.concat(files.chrome), { base: src })
        .pipe(gulp.dest(destFolder));
}

function packageChrome(unpackedFolder, destFolder) {
    var zip = require('gulp-zip'); // ZIP compress files.
    var manifest = jsonfile.readFileSync(unpackedFolder + 'manifest.json');
    return gulp.src(unpackedFolder + '**/*')
      .pipe(zip(manifest.short_name.toLowerCase() + '-' + manifest.version + '.zip'))
      .pipe(gulp.dest(destFolder));
}

// release

gulp.task('prepackage:chrome:release', [
    'prepackage:chrome:release:copy',
    'prepackage:chrome:release:strip'
]);

gulp.task('prepackage:chrome:release:copy', ['clean:release', 'compile', 'lib'], function () {
    return copyFilesChrome(distReleaseChromeUnpacked);
});

gulp.task('prepackage:chrome:release:strip', ['prepackage:chrome:release:copy'], function () {
    return stripDebugCommon(distReleaseChromeUnpacked);
});

gulp.task('package:chrome:release', ['prepackage:chrome:release'], () => {
    return packageChrome(distReleaseChromeUnpacked, distReleaseChrome);
});

// test

gulp.task('prepackage:chrome:test', [
    'prepackage:chrome:test:copy',
    'prepackage:chrome:test:setup'
]);

gulp.task('prepackage:chrome:test:copy', ['clean:test', 'compile', 'lib'], function () {
    return copyFilesChrome(distTestChromeUnpacked);
});

gulp.task('prepackage:chrome:test:setup', ['prepackage:chrome:test:copy'], (callback) => {
    setTestServerUrl(distTestChromeUnpacked + 'background/constants.js');
    callback();
});

gulp.task('package:chrome:test', ['prepackage:chrome:test'], () => {
    return packageChrome(distTestChromeUnpacked, distTestChrome);
});

// =============================================================================
// Tasks for building Firefox addon
// =============================================================================

function copyFilesFirefox(destFolder) {
    var root = gulp.src(files.firefox.root).pipe(gulp.dest(destFolder));
    var data = gulp.src(files.common.concat(files.firefox.data), { base: src }).pipe(gulp.dest(destFolder + 'data/'));
    return mergeStream(root, data);
}

function makeIndexFirefox(files, destFolder) {
    return gulp.src(files)
        .pipe(concat('index.js'))
        .pipe(gulp.dest(destFolder));
}

function stripHtmlFirefox(destFolder) {
    // Strip scripts from html for firefox
    // They are placed in FirefoxExtension.ts as content scripts to allow cross site requests
    var srcHtml = src + 'popup/popup.html';
    var destHtml = destFolder + 'data/popup/popup.html';
    fs.writeFileSync(destHtml, fs.readFileSync(srcHtml));
    replaceInFile(destHtml, /\s*<script[^>]+>.*<\/script>/g, '');
}

function packageFirefox(unpackedFolder, destFolder) {
    // packaging for firefox should be run synchronously
    process.chdir(unpackedFolder);
    var jpmXpi = require('jpm/lib/xpi'); // Packaging utility for Mozilla Jetpack Addons
    var addonManifest = require(unpackedFolder + 'package.json');
    var promise = jpmXpi(addonManifest, { xpiPath: destFolder });
    promise.then(function () {
        process.chdir(src);
    });
    return promise;
}

// release

gulp.task('prepackage:firefox:release', [
    'prepackage:firefox:release:copy',
    'prepackage:firefox:release:index',
    'prepackage:firefox:release:strip'
]);

gulp.task('prepackage:firefox:release:copy', ['clean:release', 'compile', 'lib'], () => {
    return copyFilesFirefox(distReleaseFirefoxUnpacked);
});

gulp.task('prepackage:firefox:release:index', ['prepackage:firefox:release:copy'], () => {
    return makeIndexFirefox(files.firefox.index.release, distReleaseFirefoxUnpacked);
});

gulp.task('prepackage:firefox:release:strip', [
    'prepackage:firefox:release:strip:js',
    'prepackage:firefox:release:strip:html'
]);

gulp.task('prepackage:firefox:release:strip:js', ['prepackage:firefox:release:index'], () => {
    return stripDebugCommon(distReleaseFirefoxUnpacked);
});

gulp.task('prepackage:firefox:release:strip:html', ['prepackage:firefox:release:copy'], (callback) => {
    stripHtmlFirefox(distReleaseFirefoxUnpacked);
    callback();
});

gulp.task('package:firefox:release', ['prepackage:firefox:release'], (callback) => {
    packageFirefox(distReleaseFirefoxUnpacked, distReleaseFirefox).then(() => {
        callback();
    });
});

// test

gulp.task('prepackage:firefox:test', [
    'prepackage:firefox:test:copy',
    'prepackage:firefox:test:index',
    'prepackage:firefox:test:strip',
    'prepackage:firefox:test:setup'
]);

gulp.task('prepackage:firefox:test:copy', ['clean:test', 'compile', 'lib'], () => {
    return copyFilesFirefox(distTestFirefoxUnpacked);
});

gulp.task('prepackage:firefox:test:index', ['prepackage:firefox:test:copy'], () => {
    return makeIndexFirefox(files.firefox.index.test, distTestFirefoxUnpacked);
});

gulp.task('prepackage:firefox:test:strip', [
    'prepackage:firefox:test:strip:js',
    'prepackage:firefox:test:strip:html'
]);

gulp.task('prepackage:firefox:test:strip:js', ['prepackage:firefox:test:index'], () => {
    return stripDebugCommon(distTestFirefoxUnpacked);
});

gulp.task('prepackage:firefox:test:strip:html', ['prepackage:firefox:test:copy'], (callback) => {
    stripHtmlFirefox(distTestFirefoxUnpacked);
    callback();
});

gulp.task('prepackage:firefox:test:setup', ['prepackage:firefox:test:strip'], (callback) => {
    setTestServerUrl(distTestFirefoxUnpacked + 'index.js');
    callback();
});

gulp.task('package:firefox:test', ['prepackage:firefox:test'], (callback) => {
    packageFirefox(distTestFirefoxUnpacked, distTestFirefox).then(() => {
        callback();
    });
});
