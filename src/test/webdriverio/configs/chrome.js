var extend = require('util')._extend;

var baseConfig = require('../wdio.conf.js').config;

exports.config = extend(baseConfig, {
    capabilities: [{
        browserName: 'chrome',
        chromeOptions: {
            args: ['load-extension=' + process.cwd() + '/../dist/chrome/unpacked']
        }
    }]
});
