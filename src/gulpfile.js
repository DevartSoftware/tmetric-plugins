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
var through = require('through2');
var zip = require('gulp-zip');

// =============================================================================
// Global variables
// =============================================================================

// Output folders for *.crx and *.xpi files
var src = process.cwd() + '/';
var dist = path.normalize(src + '/../dist/');

var config = {
    distDir: dist,
    keepDebug: false
};

if (argv.version) {
    config.version = argv.version;
}

if (argv.distDir != null) {
    config.distDir = argv.distDir + '/';
}

if (argv.keepDebug != null) {
    config.keepDebug = argv.keepDebug;
}

var distDir = config.distDir;
var chromeDir = distDir + 'chrome/';
var chromeUnpackedDir = chromeDir + 'unpacked/';
var firefoxDir = distDir + 'firefox/';
var firefoxUnpackedDir = firefoxDir + 'unpacked/';
var edgeDir = distDir + 'edge/';
var edgeUnpackedDir = edgeDir + 'Extension/';

console.log('Start build');
console.log(JSON.stringify(config, null, 2));

var files = {
    common: [
        'background/signalRConnection.js',
        'css/*.css',
        'in-page-scripts/integrations/*.js',
        'in-page-scripts/integrationService.js',
        'in-page-scripts/page.js',
        'in-page-scripts/version.js',
        'in-page-scripts/utils.js',
        'lib/**',
        'images/*.png',
        'popup/popup.html',
        'popup/popupController.js',
        'background/extensionBase.js',
        'background/simpleEvent.js',
        'manifest.json'
    ],
    chrome: [
        'background/chromeExtension.js',
    ],
    edge: [
        'background/edgeExtension.js'
    ],
    firefox: [
        'background/firefoxExtension.js'
    ]
};

// common operations

function replaceInFile(file, find, replace) {
    var text = fs.readFileSync(file) + '';
    if (text) {
        text = text.replace(find, replace);
        fs.writeFileSync(file, text);
    }
}

function stripDebugCommon(folder) {
    if (!config.keepDebug) {
        return gulp.src([folder + '**/*.js', '!' + folder + 'lib/**/*.js'], { base: folder })
            .pipe(stripDebug())
            .pipe(gulp.dest(folder));
    }
}

function modifyManifest(callbackFn) {

    return through.obj(function (vinylFile, encoding, callback) {

        var file = vinylFile.clone();

        if (file.isBuffer()) {

            var fileContent = file.contents.toString(encoding);

            var obj;
            try {
                obj = JSON.parse(fileContent);
            }
            catch (e) {
                return reject(new Error('Invalid JSON: ' + e.message));
            }

            var newManifest = callbackFn(obj);

            file.contents = new Buffer(JSON.stringify(newManifest, null, 4));

            callback(null, file);
        }
    });
}

// =============================================================================
// Common tasks (used for both extensions)
// =============================================================================

gulp.task('default', ['build']);
gulp.task('build', ['version', 'package:chrome', 'package:firefox', 'package:edge']);

gulp.task('version', (callback) => {
    if (config.version) {
        [
            src + 'manifest.json',
            src + 'package.json',
            src + 'in-page-scripts/version.ts',
            src + 'AppxManifest.xml'
        ].forEach(file => {
            var version = config.version;
            if (file.indexOf('AppxManifest.xml') > -1) {
                version += '.0';
            }

            replaceInFile(
                file,
                /(["']?version["']?: ["']|Version=")([\d\.]+)(["'])/,
                (match, left, oldVersion, right) => (left + version + right))
        });
    }
    callback();
});

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
    var signalr = gulp.src('node_modules/ms-signalr-client/jquery.signalr-2.2.1.min.js').pipe(rename('jquery.signalr.min.js')).pipe(gulp.dest(lib));
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
    'prepackage:chrome:strip'
]);

gulp.task('prepackage:chrome:copy', ['clean:dist', 'compile', 'lib'], function () {
    return copyFilesChrome(chromeUnpackedDir);
});

gulp.task('prepackage:chrome:strip', ['prepackage:chrome:copy'], function () {
    return stripDebugCommon(chromeUnpackedDir);
});

gulp.task('package:chrome', ['prepackage:chrome'], () => {
    return packageChrome(chromeUnpackedDir, chromeDir);
});

// =============================================================================
// Tasks for building Edge addon
// =============================================================================

function copyFilesEdge(destFolder) {
    return gulp.src(files.common.concat(files.edge), { base: src })
        .pipe(gulp.dest(destFolder));
}

function copyAppxManifest(rootDistFolder) {
    return gulp.src('AppxManifest.xml', { base: src }).pipe(gulp.dest(rootDistFolder));
}

function copyFilesEdgeBridges(destFolder) {
    return gulp.src([
        'edge-api-bridges/background.html',
        'edge-api-bridges/backgroundScriptsAPIBridge.js',
        'edge-api-bridges/contentScriptsAPIBridge.js'
    ], { base: src })
        .pipe(rename({ dirname: '' }))
        .pipe(gulp.dest(destFolder));
}

gulp.task('prepackage:edge', [
    'prepackage:edge:copy',
    'prepackage:edge:strip',
    'prepackage:edge:modifyManifest'
]);

gulp.task('prepackage:edge:copy', ['clean:dist', 'compile', 'lib'], function () {
    return mergeStream(copyFilesEdge(edgeUnpackedDir), copyFilesEdgeBridges(edgeUnpackedDir), copyAppxManifest(edgeDir));
});

gulp.task('prepackage:edge:strip', ['prepackage:edge:copy'], function () {
    return stripDebugCommon(edgeUnpackedDir);
});

gulp.task('prepackage:edge:modifyManifest', ['prepackage:edge:copy'], function () {

    return gulp.src(edgeUnpackedDir + '/manifest.json')
        .pipe(modifyManifest(manifest => {

            // Add -ms-preload property
            manifest["-ms-preload"] = {
                ["backgroundScript"]: "backgroundScriptsAPIBridge.js",
                ["contentScript"]: "contentScriptsAPIBridge.js"
            };

            // Add persistent property to background
            manifest['background']['persistent'] = true;

            // Replace chromeExtension.js to edgeExtension.js
            var scripts = manifest['background']['scripts'];
            var index = scripts.indexOf('background/chromeExtension.js');
            scripts.splice(index, 1, 'background/edgeExtension.js');

            return manifest;
        }))
        .pipe(gulp.dest(edgeUnpackedDir));
});

gulp.task('package:edge', ['prepackage:edge']);

// =============================================================================
// Tasks for building Firefox addon
// =============================================================================

function copyFilesFireFox(destFolder) {
    return gulp.src(files.common.concat(files.firefox), { base: src })
        .pipe(gulp.dest(destFolder));
}

gulp.task('prepackage:firefox', [
    'prepackage:firefox:copy',
    'prepackage:firefox:strip',
    'prepackage:firefox:modifyManifest'
]);

gulp.task('prepackage:firefox:copy', ['clean:dist', 'compile', 'lib'], function () {
    return copyFilesFireFox(firefoxUnpackedDir);
});

gulp.task('prepackage:firefox:strip', ['prepackage:firefox:copy'], function () {
    return stripDebugCommon(firefoxUnpackedDir);
});

gulp.task('prepackage:firefox:modifyManifest', ['prepackage:firefox:copy'], callback => {

    return gulp.src(firefoxUnpackedDir + '/manifest.json')
        .pipe(modifyManifest(manifest => {

            // Remove externally_connectable property
            delete manifest['externally_connectable'];

            // Replace chromeExtension.js to firefoxExtension.js
            var scripts = manifest['background']['scripts'];
            var index = scripts.indexOf('background/chromeExtension.js');
            scripts.splice(index, 1, 'background/firefoxExtension.js');

            return manifest;
        }))
        .pipe(gulp.dest(firefoxUnpackedDir));
});

gulp.task('package:firefox', ['prepackage:firefox'], () => {
    var manifest = jsonfile.readFileSync(firefoxUnpackedDir + 'manifest.json');
    gulp.src(firefoxUnpackedDir + '**/*')
        .pipe(zip(manifest.short_name.toLowerCase() + '-' + manifest.version + '.xpi'))
        .pipe(gulp.dest(firefoxDir));
});