'use strict';

var fs = require('fs');
var os = require('os');
var _ = require('lodash');
var cluster = require('cluster');


module.exports = function(context) {
    var logger = context.logger;

    var configFile;

    if (fs.existsSync('/app/config/config.js')) {
        configFile = '/app/config/config.js';
    }

    // Environment overrides the specific check
    if (process.env.TERAFOUNDATION_CONFIG) {
        configFile = process.env.TERAFOUNDATION_CONFIG; 
    }

    // If a config file was provided on the command line it take precedence    
    if (context.configfile) {
        configFile = context.configfile;
    }

    if (! configFile) {
        configFile = process.cwd() + '/config.js';
    }

    if (! fs.existsSync(configFile)) {
        logger.error("Could not find a usable config.js");
        return;
    }

    if (configFile.indexOf('.') === 0) {
        configFile = process.cwd() + '/' + configFile;
    }

    var config = require(configFile);

    // Annotate the config with some information about this instance.

    config._nodeName = os.hostname();
    if (cluster.worker) {
        config._nodeName += '.' + cluster.worker.id;
    }

    return config;
};
