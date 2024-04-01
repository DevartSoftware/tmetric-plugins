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
    keepDebug: true,
    keepSources: false
};

if (argv.newversion) {
    config.version = argv.newversion;
}

if (argv.distDir) {
    config.distDir = argv.distDir + '/';
}

if (argv.keepDebug) {
    config.keepDebug = argv.keepDebug;
}

if (argv.keepSources) {
    config.keepSources = argv.keepSources;
}

// detect visual studio
if (process.env['VSAPPIDNAME']) {
    config.keepDebug = true;
    config.keepSources = true;
}

var distDir = config.distDir;
var chromeDir = distDir + 'chrome/';
var chromeUnpackedDir = chromeDir + 'unpacked/';
var firefoxDir = distDir + 'firefox/';
var firefoxUnpackedDir = firefoxDir + 'unpacked/';
var safariUnpackedDir = distDir + 'safari/';

console.log('Start build');
console.log(JSON.stringify(config, null, 2));

var files = {
    common: [
        'src/background/storage.js',
        'src/background/webToolDescriptions.js',
        'src/background/webToolManager.js',
        'src/background/ajaxClient.js',
        'src/background/oidcClient.js',
        'src/background/contentScriptsRegistrator.js',
        'src/background/serverConnection.js',
        'src/background/signalRHubProxy.js',
        'src/background/signalRConnection.js',
        'src/css/*.css',
        'src/in-page-scripts/integrations/*.js',
        'src/in-page-scripts/integrationService.js',
        'src/in-page-scripts/authorizationCode.js',
        'src/in-page-scripts/page.js',
        'src/in-page-scripts/init.js',
        'src/in-page-scripts/topmostPage.js',
        'src/in-page-scripts/version.js',
        'src/in-page-scripts/utils.js',
        'src/lib/**',
        'src/images/integrations/**',
        'src/images/*.*',
        'src/popup/popup.html',
        'src/popup/popupController.js',
        'src/popup/pagePopupController.js',
        'src/popup/popupActivator.js',
        'src/permissions/check.html',
        'src/permissions/check.js',
        'src/permissions/permissionManager.js',
        'src/permissions/permissions.html',
        'src/permissions/permissions.js',
        'src/settings/settings.html',
        'src/settings/settingsController.js',
        'src/background/backgroundBase.js',
        'src/background/extensionBase.js',
        'src/background/simpleEvent.js'

    ],
    chrome: [
        'src/manifest.json',
        'src/unified-ext.js',
        'src/chrome-background-bundle.js',
        'src/background/chromeExtension.js',
    ],
    firefox: [
        'src/unified-ext.js',
        'src/background/firefoxExtension.js'
    ],
    safari: [
        'src/unified-ext.js',
        'src/background/safariExtension.js',
        'src/safari/**'
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

    if (config.keepDebug) {
        return Promise.resolve();
    }

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

function modifyFile(transform) {
    return through.obj(function (file, encoding, callback) {

        file = file.clone();
        if (!file.isBuffer()) {
            return reject(new Error('Invalid file: ' + e.message));
        }

        let fileContent = file.contents.toString(encoding);
        fileContent = transform(fileContent);
        file.contents = Buffer.from(fileContent);
        callback(null, file);
    });
}

function modifyFileJSON(transform) {
    return modifyFile(text => JSON.stringify(transform(JSON.parse(text)), null, '  '));
}

// =============================================================================
// Common tasks (used for all extensions)
// =============================================================================

gulp.task('version', (callback) => {
    var version = config.version;
    if (version) {
        [
            'package.json',
            src + 'manifest.json',
            src + 'manifest-v2/manifest.json',
            src + 'in-page-scripts/version.ts'
        ].forEach(file => replaceInFile(
            file,
            /(["']?version["']?: ["'])([\d\.]+)(["'])/,
            (match, left, oldVersion, right) => (left + version + right)));

        // set app store version
        replaceInFile(
            src + 'safari/TMetric for Safari.xcodeproj/project.pbxproj',
            /(MARKETING_VERSION = )([\d\.]+)(;)/g,
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
        'src/**/*.map',
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
        .src('node_modules/@microsoft/signalr/dist/webworker/signalr.min.js')
        .pipe(modifyFile(text => text.replace(/\/\/\s*#\s*sourceMappingURL.+?\.map/, '')))
        .pipe(rename('signalr.min.js'))
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

    // Using typescript compiler for gulp.js
    var ts = require('gulp-typescript');

    // Gulp typescript compiler do not support source map options from tsconfig.json
    // Using gulp source map plugin
    var sourcemaps = require('gulp-sourcemaps');

    var project = ts.createProject('./src/tsconfig.json');
    var files = project.config.files.map(path => src + path);

    let task = gulp.src(files, { base: src });

    if (config.keepSources) {
        task = task.pipe(sourcemaps.init());
    }

    task = task.pipe(project());

    if (config.keepSources) {
        task = task.pipe(sourcemaps.write({ sourceRoot: '/', includeContent: true }))
    }

    task = task.pipe(gulp.dest(src));

    return task;
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

function copyFilesFirefox() {
    return gulp.src(files.common.concat(files.firefox), { base: src })
        .pipe(gulp.dest(firefoxUnpackedDir));
}

function copyManifestFirefox() {
    return gulp.src(['src/manifest-v2/manifest.json'])
        .pipe(gulp.dest(firefoxUnpackedDir));
}

function modifyManifestFirefox() {
    return gulp.src(firefoxUnpackedDir + '/manifest.json')
        .pipe(modifyFileJSON(json => ({applications: { gecko: { id: '@tmetric'} }, ...json})))
        .pipe(gulp.dest(firefoxUnpackedDir));
}

function stripDebugFirefox() {
    return stripDebugCommon(firefoxUnpackedDir);
}

gulp.task(
    'prepackage:firefox',
    gulp.series(copyFilesFirefox, copyManifestFirefox, stripDebugFirefox, modifyManifestFirefox));

function packageFirefox() {
    var manifest = jsonfile.readFileSync(firefoxUnpackedDir + 'manifest.json');
    return gulp.src(firefoxUnpackedDir + '**/*')
        .pipe(zip(manifest.short_name.toLowerCase() + '-' +manifest.version + '.xpi'))
        .pipe(gulp.dest(firefoxDir));
}

gulp.task('package:firefox', gulp.series('prepackage:firefox', packageFirefox));

// =============================================================================
// Tasks for building Safari extension
// =============================================================================

function copyFilesSafari() {
    return gulp.src(files.common.concat(files.safari), { base: src })
        .pipe(gulp.dest(safariUnpackedDir));
}

function stripDebugSafari() {
    return stripDebugCommon(safariUnpackedDir);
}

function copyManifestSafari() {
    return gulp.src(['src/manifest-v2/manifest.json'])
        .pipe(gulp.dest(safariUnpackedDir));
}

function modifyManifestSafari() {
    return gulp.src(safariUnpackedDir + '/manifest.json')
        .pipe(modifyFile(text => text.replace('/firefoxExtension.js', '/safariExtension.js')))
        .pipe(gulp.dest(safariUnpackedDir));
}

gulp.task(
    'package:safari',
    gulp.series(copyFilesSafari, copyManifestSafari, stripDebugSafari, modifyManifestSafari));

// =============================================================================
// Task for building addons
// =============================================================================

gulp.task('build', gulp.series(
    'clean', 'lib', 'compile', 'version',
    gulp.parallel('package:chrome', 'package:firefox', 'package:safari')
));

// =============================================================================
// Task for building safari addon
// =============================================================================

gulp.task('build:safari', gulp.series(
    'clean', 'compile', 'package:safari'
));

// =============================================================================
// Default Task
// =============================================================================

gulp.task('default', gulp.series('build'));