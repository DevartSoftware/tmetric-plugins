var argv = require('yargs').argv;
var fs = require('fs');                         // Node.js File System module
var path = require('path');                     // Node.js Path System module
var del = require('del');                       // Delete files/folders using globs.
var jsonfile = require('jsonfile');             // Easily read/write JSON files.
var mergeStream = require('merge-stream');      // Create a stream that emits events from multiple other streams.
var through = require('through2');
var gulp = require('gulp');                     // The streaming build system.
var concat = require('gulp-concat');            // Concatenates files.
var less = require('gulp-less');                // A LESS plugin for Gulp
var rename = require('gulp-rename');            // Simple file renaming methods.
var stripDebug = require('gulp-strip-debug');   // Strip console and debugger statements from JavaScript code.
var zip = require('gulp-zip');

// =============================================================================
// Global variables
// =============================================================================

// Output folders for *.crx and *.xpi files
var src = path.normalize(process.cwd() + '/src/');
var dist = path.normalize(process.cwd() + '/dist/');

var config = {
    distDir: dist,
    keepDebug: false
};

if (argv.version) {
    config.version = argv.version;
}

if (argv.distDir) {
    config.distDir = argv.distDir + '/';
}

if (argv.keepDebug) {
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
        'src/background/signalRConnection.js',
        'src/css/*.css',
        'src/in-page-scripts/integrations/*.js',
        'src/in-page-scripts/integrationService.js',
        'src/in-page-scripts/page.js',
        'src/in-page-scripts/init.js',
        'src/in-page-scripts/topmostPage.js',
        'src/in-page-scripts/version.js',
        'src/in-page-scripts/utils.js',
        'src/lib/**',
        'src/images/*.png',
        'src/popup/popup.html',
        'src/popup/popupController.js',
        'src/popup/pagePopupController.js',
        'src/popup/popupActivator.js',
        'src/settings/settings.html',
        'src/settings/settingsController.js',
        'src/background/extensionBase.js',
        'src/background/simpleEvent.js',
        'src/manifest.json'
    ],
    chrome: [
        'src/background/chromeExtension.js',
    ],
    edge: [
        'src/background/edgeExtension.js'
    ],
    firefox: [
        'src/background/firefoxExtension.js'
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
        return gulp.src([
                folder + '**/*.js',
                '!' + folder + 'lib/**/*.js',
                '!' + folder + '*APIBridge.js'
        ], {
            base: folder
        })
            .pipe(stripDebug())
            .pipe(gulp.dest(folder));
    }
}

function modifyJSON(transform) {

    return through.obj(function (jsonFile, encoding, callback) {

        var file = jsonFile.clone();
        if (!file.isBuffer()) {
            return reject(new Error('Invalid JSON: ' + e.message));
        }

        var fileContent = file.contents.toString(encoding);
        var obj;
        try {
            obj = JSON.parse(fileContent);
        }
        catch (e) {
            return reject(new Error('Invalid JSON: ' + e.message));
        }

        var newManifest = transform(obj);
        file.contents = new Buffer(JSON.stringify(newManifest, null, 4));
        callback(null, file);
    });
}

// =============================================================================
// Common tasks (used for all extensions)
// =============================================================================

gulp.task('version', (callback) => {
    var version = config.version;
    if (version) {
        [
            src + 'manifest.json',
            src + 'in-page-scripts/version.ts'
        ].forEach(file => replaceInFile(
            file,
            /(["']?version["']?: ["'])([\d\.]+)(["'])/,
            (match, left, oldVersion, right) => (left + version + right)));

        if (version.split('.').length < 4) {
            version += '.0';
        }
        replaceInFile(
            src + 'AppxManifest.xml',
            /(Version=")([\d\.]+)(")/,
            (match, left, oldVersion, right) => (left + version + right));
    }
    callback();
});

// clean

function clean (input) {
    return del(input, { force: true });
}

gulp.task('clean:sources', () => {
    return clean([
        './**/*.map',
        'src/background/*.js',
        'src/css/*.css',
        'src/in-page-scripts/**/*.js',
        'src/lib/*',
        'src/popup/*.js',
        'src/settings/*.js'
    ]);
});

gulp.task('clean:dist', () => {
    return clean([distDir + '**']);
});


gulp.task('clean', gulp.parallel('clean:sources', 'clean:dist'));

// lib

gulp.task('lib', () => {
    var lib = src + 'lib/';
    var jquery = gulp
        .src('node_modules/jquery/dist/jquery.min.js')
        .pipe(gulp.dest(lib));
    var signalr = gulp
        .src('node_modules/ms-signalr-client/jquery.signalR-2.2.1.min.js')
        .pipe(rename('jquery.signalr.min.js'))
        .pipe(gulp.dest(lib));
    var select2 = gulp
        .src([
            'node_modules/select2/dist/js/select2.full.min.js',
            'node_modules/select2/dist/css/select2.min.css'
        ])
        .pipe(gulp.dest(lib + 'select2/'));
    return mergeStream(jquery, signalr, select2);
});

// compile

gulp.task('compile:ts', () => {
    var ts = require('gulp-typescript'); // TypeScript compiler for gulp.js
    var project = ts.createProject('./src/tsconfig.json');
    var files = project.config.files.map(path => src + path);
    return gulp.src(files, { base: src }).pipe(project()).pipe(gulp.dest(src));
});

gulp.task('compile:less', () => {
    return gulp.src('src/css/*.less').pipe(less()).pipe(gulp.dest(src + 'css/'));
});

gulp.task('compile', gulp.parallel('compile:ts', 'compile:less'));

// =============================================================================
// Tasks for building Chrome extension
// =============================================================================

function copyFilesChrome() {
    return gulp.src(files.common.concat(files.chrome), { base: src })
        .pipe(gulp.dest(chromeUnpackedDir));
}

function stripDebugChrome() {
    return stripDebugCommon(chromeUnpackedDir);
}

gulp.task('prepackage:chrome', gulp.series(copyFilesChrome, stripDebugChrome));

function packageChrome() {
    var manifest = jsonfile.readFileSync(chromeUnpackedDir + 'manifest.json');
    return gulp.src(chromeUnpackedDir + '**/*')
      .pipe(zip(manifest.short_name.toLowerCase() + '-' + manifest.version + '.zip'))
      .pipe(gulp.dest(chromeDir));
}

gulp.task('package:chrome', gulp.series('prepackage:chrome', packageChrome));

// =============================================================================
// Tasks for building Firefox addon
// =============================================================================

function copyFilesFireFox() {
    return gulp.src(files.common.concat(files.firefox), { base: src })
        .pipe(gulp.dest(firefoxUnpackedDir));
}

function stripDebugFirefox() {
    return stripDebugCommon(firefoxUnpackedDir);
}

function modifyManifestFirefox() {
    return gulp.src(firefoxUnpackedDir + '/manifest.json')
        .pipe(modifyJSON(manifest => {

            // Replace chromeExtension.js to firefoxExtension.js
            var scripts = manifest['background']['scripts'];
            var index = scripts.indexOf('background/chromeExtension.js');
            scripts[index]= 'background/firefoxExtension.js';

            // Set addon ID (TE-283)
            manifest['applications'] = {
                gecko: { id: '@tmetric' }
            };
            return manifest;
        }))
        .pipe(gulp.dest(firefoxUnpackedDir));
}

gulp.task('prepackage:firefox', gulp.series(copyFilesFireFox, stripDebugFirefox, modifyManifestFirefox));

function packageFirefox() {
    var manifest = jsonfile.readFileSync(firefoxUnpackedDir + 'manifest.json');
    return gulp.src(firefoxUnpackedDir + '**/*')
        .pipe(zip(manifest.short_name.toLowerCase() + '-' +manifest.version + '.xpi'))
        .pipe(gulp.dest(firefoxDir));
}

gulp.task('package:firefox', gulp.series('prepackage:firefox', packageFirefox));

// =============================================================================
// Tasks for building Edge addon
// =============================================================================

function copyFilesEdge() {
    return gulp.src(files.common.concat(files.edge), { base: src })
        .pipe(gulp.dest(edgeUnpackedDir));
}

function copyAppxManifest() {
    return gulp.src('src/AppxManifest.xml', { base: src }).pipe(gulp.dest(edgeDir));
}

function copyFilesEdgeBridges() {
    return gulp.src([
        'src/edge-api-bridges/backgroundScriptsAPIBridge.js',
        'src/edge-api-bridges/contentScriptsAPIBridge.js'
    ], { base: src })
    .pipe(rename({ dirname: '' }))
    .pipe(gulp.dest(edgeUnpackedDir));
}

function stripDebugEdge() {
    return stripDebugCommon(edgeUnpackedDir);
}

function modifyManifestEdge() {
    return gulp.src(edgeUnpackedDir + '/manifest.json')
        .pipe(modifyJSON(manifest => {

            // Add -ms-preload property
            manifest["-ms-preload"] = {
                ["backgroundScript"]: "backgroundScriptsAPIBridge.js",
                ["contentScript"]: "contentScriptsAPIBridge.js"
            };

            // Add persistent property to background
            manifest['background']['persistent'] = true;

            manifest['options_page'] = 'settings/settings.html';

            delete manifest['options_ui'];

            // Replace chromeExtension.js to edgeExtension.js
            var scripts = manifest['background']['scripts'];
            var index = scripts.indexOf('background/chromeExtension.js');
            scripts[index] = 'background/edgeExtension.js';

            // Show action button by default
            manifest.browser_specific_settings = {
                edge: {
                    browser_action_next_to_addressbar: true
                }
            }

            return manifest;
        }))
        .pipe(gulp.dest(edgeUnpackedDir));
}

gulp.task('prepackage:edge', gulp.series(
    gulp.parallel(copyFilesEdge, copyFilesEdgeBridges, copyAppxManifest),
    stripDebugEdge,
    modifyManifestEdge
));

gulp.task('package:edge', gulp.series('prepackage:edge'));

// =============================================================================
// Task for building addons
// =============================================================================

gulp.task('build', gulp.series(
    'clean', 'lib', 'compile', 'version',
    gulp.parallel('package:chrome', 'package:firefox', 'package:edge')
));

// =============================================================================
// Default Task
// =============================================================================

gulp.task('default', gulp.series('build'));
