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
    keepDebug: false,
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
var safariAppFolderName = 'TMetric for Safari';
var safariAppExtensionFolderName = 'TMetric for Safari Extension';
var safariDir = distDir + 'safari/';
var safariExtensionDir = safariDir + safariAppExtensionFolderName + '/';

console.log('Start build');
console.log(JSON.stringify(config, null, 2));

var files = {
    common: [
        'src/background/webToolDescriptions.js',
        'src/background/webToolManager.js',
        'src/background/contentScriptsPolyfill.js',
        'src/background/contentScriptsRegistrator.js',
        'src/background/serverConnection.js',
        'src/background/signalRHubProxy.js',
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
        'src/images/**',
        'src/popup/popup.html',
        'src/popup/popupController.js',
        'src/popup/pagePopupController.js',
        'src/popup/popupActivator.js',
        'src/permissions/permissionManager.js',
        'src/permissions/permissions.html',
        'src/permissions/permissions.js',
        'src/permissions/permissionsCheck.html',
        'src/permissions/permissionsCheck.js',
        'src/settings/settings.html',
        'src/settings/settingsController.js',
        'src/background/backgroundBase.js',
        'src/background/extensionBase.js',
        'src/background/simpleEvent.js',
        'src/manifest.json'
    ],
    chrome: [
        'src/background/chromeExtension.js',
    ],
    firefox: [
        'src/background/firefoxExtension.js'
    ],
    safari: [
        'src/safari/**',
        '!src/safari/**/*.ts',
        '!src/safari/**/*.map',
        '!src/safari/build/**',
        '!src/safari/**/xcuserdata/**'
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
        replaceInFile(
            src + 'safari/TMetric for Safari.xcodeproj/project.pbxproj',
            /((?:CURRENT_PROJECT|MARKETING)_VERSION = )([\d\.]+)(;)/g,
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
        'src/settings/*.js',
        'src/safari/**/*.js',
        'src/safari/**/*.css'
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
        .src('node_modules/@aspnet/signalr/dist/browser/signalr.min.js')
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

            delete manifest['options_ui']['open_in_tab'];

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
// Tasks for building Safari App Extension xcode project
// =============================================================================

var safariSrcDir = src + 'safari/';
var safariAppSrcDir = safariSrcDir + safariAppFolderName + '/';
var safariAppExtensionSrcDir = safariSrcDir + safariAppExtensionFolderName + '/';

function bundleScriptsSafari() {

    var scriptFileName = 'script.js';
    var scriptFile = safariAppExtensionSrcDir + scriptFileName;

    var manifestFile = src + 'manifest.json';
    var manifest = jsonfile.readFileSync(manifestFile);
    var contentScripts = manifest.content_scripts;


    function loadFilesContent(filePaths) {
        return filePaths.map(filePath => {
            try {
                let srcFilePath = path.normalize(src + filePath);
                return `// ${filePath}\n\n${fs.readFileSync(srcFilePath)}`;
            }
            catch (err) {
                console.log(`Not found file ${filePath} in folder ${src}.`);
            }
        }).join('\n\n');
    }

    return gulp.src([scriptFile])
        .pipe(through.obj((file, encoding, callback) => {

            let extensionContent = '';

            // add script file content

            extensionContent += `${file.contents.toString(encoding)}`;

            // add common scripts

            extensionContent += '\n\n' + loadFilesContent([
                "in-page-scripts/utils.js",
                "in-page-scripts/integrationService.js",
                "in-page-scripts/page.js"
            ]);

            // add integrations scripts

            contentScripts.forEach(info => {

                let integrations = info.js.filter(filePath => /\/integrations\//.test(filePath));
                if (!integrations.length) {
                    return;
                }

                extensionContent += `\n\nif (shouldIncludeScripts(${JSON.stringify(info, null, 4)})) {\n${loadFilesContent(integrations)}\n}`;
            });

            // add init script

            extensionContent += '\n\n' + loadFilesContent([ "in-page-scripts/init.js" ]);

            // combine file content

            var combinedContent = '';
            combinedContent += `\n\nfunction initTMetricExtension () {\n\n${extensionContent}\n\n}`;
            combinedContent += `\n\nif (document.readyState == "loading") {\n\tdocument.addEventListener("DOMContentLoaded", initTMetricExtension);\n} else {\n\tinitTMetricExtension();\n}`;

            // replace file content

            file.contents = Buffer.from(combinedContent, encoding);

            callback(null, file);

        }))
        .pipe(concat(scriptFileName))
        .pipe(gulp.dest(safariAppExtensionSrcDir))
}

function bundleStylesSafari() {

    var styleFileName = 'styles.css';
    var styleFile = safariAppExtensionSrcDir + styleFileName;

    return gulp.src([ 'src/css/timer-link.css' ], { base: src })
        .pipe(concat(styleFileName))
        .pipe(gulp.dest(safariAppExtensionSrcDir))
}

function copyFilesSafari() {
    return gulp.src(files.safari, { base: safariSrcDir })
        .pipe(gulp.dest(safariDir));
}

function stripDebugSafari() {
    return stripDebugCommon(safariExtensionDir);
}

gulp.task('prepackage:safari', gulp.series(
    bundleScriptsSafari,
    bundleStylesSafari,
    copyFilesSafari,
    stripDebugSafari
));

gulp.task('package:safari', gulp.series('prepackage:safari'));

// =============================================================================
// Task for building addons
// =============================================================================

gulp.task('build', gulp.series(
    'clean', 'lib', 'compile', 'version',
    gulp.parallel('package:chrome', 'package:firefox')
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
