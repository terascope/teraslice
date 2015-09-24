'use strict';

var fs = require('fs');
var os = require('os');
var cluster = require('cluster');
var yaml = require('js-yaml');


module.exports = function(context) {

    var configFile;

    if (fs.existsSync('/app/config/config.yaml')) {
        configFile = '/app/config/config.yaml';
    }

    if (fs.existsSync('/app/config/config.json')) {
        configFile = '/app/config/config.json';
    }

    // Environment overrides the specific check
    if (process.env.TERAFOUNDATION_CONFIG) {
        configFile = process.env.TERAFOUNDATION_CONFIG;
    }

    // If a config file was provided on the command line it take precedence    
    if (context.configfile) {
        configFile = context.configfile;
    }

    if (!configFile) {
        var path = process.cwd();
        var configFile = fs.existsSync(path + '/config.json') ? path + '/config.json' : path + '/config.yaml';
    }

    if (configFile.indexOf('.') === 0) {
        configFile = process.cwd() + '/' + configFile;
    }

    if (!fs.existsSync(configFile)) {
        console.log("Could not find a usable config.js at the path: " + configFile);
        return;
    }
    var config;

    if (configFile.match(/.yaml/)) {
        config = yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
    } else {
        config = require(configFile);
    }

    // Annotate the config with some information about this instance.

    config._nodeName = os.hostname();
    if (cluster.worker) {
        config._nodeName += '.' + cluster.worker.id;
    }

    return config;
};
