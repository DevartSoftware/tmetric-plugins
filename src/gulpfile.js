var argv = require('yargs').argv;
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

var config;

if (argv.test) {
    config = {
        distDir: dist + 'test/',
        stripDebug: false,
        constants: {
            issueDurationExtra: 3600000000
        }
    };
} else if (argv.debug) {
    config = {
        distDir: dist + 'debug/',
        stripDebug: false,
        constants: {}
    };
} else {
    config = {
        distDir: dist + 'release/',
        stripDebug: true,
        constants: {}
    };
}

if (argv.distDir != null) {
    config.distDir = argv.distDir + '/';
}

if (argv.stripDebug != null) {
    config.stripDebug = argv.stripDebug;
}

if (argv.serviceUrl != null) {
    config.constants.serviceUrl = argv.serviceUrl;
}

if (argv.issueDurationExtra != null) {
    config.constants.issueDurationExtra = argv.issueDurationExtra;
}

var distDir = config.distDir;
var chromeDir = distDir + 'chrome/';
var chromeUnpackedDir = chromeDir + 'unpacked/';
var firefoxDir = distDir + 'firefox/';
var firefoxUnpackedDir = firefoxDir + 'unpacked/';

console.log('Start build');
console.log(JSON.stringify(config, null, 2));

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
        index: [
            'background/constants.js',
            'background/extensionBase.js',
            'background/firefoxExtension.js'
        ],
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

gulp.task('clean:dist', () => {
    clean([distDir + '**']);
});

gulp.task('clean', ['clean:sources', 'clean:dist']);

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
    if (config.stripDebug) {
        return gulp.src(folder + '**/*.js', { base: folder })
            .pipe(stripDebug())
            .pipe(gulp.dest(folder));
    }
}

function setConstants(file, constants) {
    for (var name in constants) {
        var value = constants[name];
        if (value != undefined) {
            if (typeof value == 'number') {
                replaceInFile(file, new RegExp('var ' + name + ' = [^;]+;'), 'var ' + name + ' = ' + value + ';');
            } else {
                replaceInFile(file, new RegExp('var ' + name + ' = [\'"][^\'"]+[\'"];'), 'var ' + name + ' = "' + value + '";');
            }
        }
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

gulp.task('prepackage:chrome', [
    'prepackage:chrome:copy',
    'prepackage:chrome:strip',
    'prepackage:chrome:constants'
]);

gulp.task('prepackage:chrome:copy', ['clean:dist', 'compile', 'lib'], function () {
    return copyFilesChrome(chromeUnpackedDir);
});

gulp.task('prepackage:chrome:strip', ['prepackage:chrome:copy'], function () {
    return stripDebugCommon(chromeUnpackedDir);
});

gulp.task('prepackage:chrome:constants', ['prepackage:chrome:copy'], (callback) => {
    setConstants(chromeUnpackedDir + 'background/constants.js', config.constants);
    callback();
});

gulp.task('package:chrome', ['prepackage:chrome'], () => {
    return packageChrome(chromeUnpackedDir, chromeDir);
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

gulp.task('prepackage:firefox', [
    'prepackage:firefox:copy',
    'prepackage:firefox:index',
    'prepackage:firefox:strip',
    'prepackage:firefox:constants'
]);

gulp.task('prepackage:firefox:copy', ['clean:dist', 'compile', 'lib'], () => {
    return copyFilesFirefox(firefoxUnpackedDir);
});

gulp.task('prepackage:firefox:index', ['prepackage:firefox:copy'], () => {
    return makeIndexFirefox(files.firefox.index, firefoxUnpackedDir);
});

gulp.task('prepackage:firefox:strip', [
    'prepackage:firefox:strip:js',
    'prepackage:firefox:strip:html'
]);

gulp.task('prepackage:firefox:strip:js', ['prepackage:firefox:index'], () => {
    return stripDebugCommon(firefoxUnpackedDir);
});

gulp.task('prepackage:firefox:strip:html', ['prepackage:firefox:copy'], (callback) => {
    stripHtmlFirefox(firefoxUnpackedDir);
    callback();
});

gulp.task('prepackage:firefox:constants', ['prepackage:firefox:index'], (callback) => {
    setConstants(firefoxUnpackedDir + 'index.js', config.constants);
    callback();
});

gulp.task('package:firefox', ['prepackage:firefox'], (callback) => {
    packageFirefox(firefoxUnpackedDir, firefoxDir).then(() => {
        callback();
    });
});
