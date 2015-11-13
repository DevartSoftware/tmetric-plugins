var fs = require('fs');
var extend = require('util')._extend;

var baseConfig = require('../wdio.conf.js').config;

// see gulp task 'profile:firefox:test'
var firefoxProfile = fs.readFileSync('./test/webdriverio/profiles/firefox/profile', 'utf8');

exports.config = extend(baseConfig, {
    capabilities: [{
        browserName: 'firefox',
        firefox_profile: firefoxProfile
    }]
});
