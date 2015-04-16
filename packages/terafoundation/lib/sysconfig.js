'use strict';

var fs = require('fs');
var os = require('os');
var _ = require('lodash');
var cluster = require('cluster');

var configFile;

if (fs.existsSync('/app/config/config.js')) {
    configFile = '/app/config/config.js';
}

if (! configFile) {
    configFile = process.env.AGRISERVER_CONFIG || process.cwd() + '/config.js';
}

var config = require(configFile);

// Annotate the config with some information about this instance.

config._nodeName = os.hostname();
if (cluster.worker) {
    config._nodeName += '.' + cluster.worker.id;
}

module.exports = config;
