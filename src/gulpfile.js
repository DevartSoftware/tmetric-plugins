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
var dist = path.normalize(src + '/../dist/');
var distChrome = dist + 'chrome/';
var distChromeUnpacked = distChrome + 'unpacked/';
var distFirefox = dist + 'firefox/';
var distFirefoxUnpacked = distFirefox + 'unpacked/';
var test = src + 'test/';

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
gulp.task('build', ['package:chrome', 'package:firefox']);
gulp.task('build:test', ['package:chrome:test', 'package:firefox:test']);

gulp.task('clean', function () {
    return del.sync([
      dist + '**', // remove all children and the parent.
      './**/*.map',
      'background/*.js',
      'css/*.css',
      'in-page-scripts/**/*.js',
      'lib/*',
      'popup/*.js'
    ], { force: true });
});

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
    var tsc = require('gulp-tsc'); // TypeScript compiler for gulp.js
    var project = require('./tsconfig.json');
    project.compilerOptions.sourceMap = false;
    project.compilerOptions.tscPath = './node_modules/typescript/lib/tsc.js';
    return gulp.src(project.files)
      .pipe(tsc(project.compilerOptions))
      .pipe(gulp.dest(src));
});

gulp.task('compile:less', ['clean'], function () {
    return gulp.src('css/*.less').pipe(less()).pipe(gulp.dest(src + 'css/'));
});

// =============================================================================
// Tasks for building Chrome extension
// =============================================================================

gulp.task('prepackage:chrome', ['compile', 'lib'], function () {
    return gulp.src(files.common.concat(files.chrome), { base: src }).pipe(gulp.dest(distChromeUnpacked));
});

gulp.task('prepackage:chrome:strip', ['prepackage:chrome'], function () {
    return gulp.src(distChromeUnpacked + '**/*.js', { base: distChromeUnpacked }).pipe(stripDebug()).pipe(gulp.dest(distChromeUnpacked));
});

gulp.task('prepackage:chrome:test', ['prepackage:chrome'], function () {
    return gulp.src(src + 'test/constants.js').pipe(gulp.dest(distChromeUnpacked + 'background/'));
});

gulp.task('package:chrome', ['prepackage:chrome', 'prepackage:chrome:strip'], packageChrome);
gulp.task('package:chrome:test', ['prepackage:chrome:test'], packageChrome);

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

gulp.task('prepackage:firefox', ['compile', 'lib', 'prepackage:firefox:files'], function () {
    // Strip scripts from html for firefox
    // They inserted in FirefoxExtension.ts as content scripts to allow cross site requests
    var html = fs.readFileSync(src + 'popup/popup.html') + '';
    html = html.replace(/\s*<script[^>]+>.*<\/script>/g, '');
    fs.writeFileSync(distFirefoxUnpacked + 'data/popup/popup.html', html);
});

gulp.task('prepackage:firefox:files', ['compile', 'lib'], function () {
    var root = gulp.src(files.firefox.root).pipe(gulp.dest(distFirefoxUnpacked));
    var index = gulp.src(files.firefox.index.release).pipe(concat('index.js')).pipe(gulp.dest(distFirefoxUnpacked));
    var data = gulp.src(files.common.concat(files.firefox.data), { base: src }).pipe(gulp.dest(distFirefoxUnpacked + 'data/'));
    return mergeStream(root, index, data);
});

gulp.task('prepackage:firefox:strip', ['prepackage:firefox'], function () {
    return gulp.src(distFirefoxUnpacked + '**/*.js', { base: distFirefoxUnpacked }).pipe(stripDebug()).pipe(gulp.dest(distFirefoxUnpacked));
});

gulp.task('prepackage:firefox:test', ['prepackage:firefox'], function () {
    return gulp.src(files.firefox.index.test).pipe(concat('index.js')).pipe(gulp.dest(distFirefoxUnpacked));
});

gulp.task('package:firefox', ['prepackage:firefox', 'prepackage:firefox:strip'], packageFirefox);
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
