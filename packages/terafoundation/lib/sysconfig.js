'use strict';

const fs = require('fs');
const yaml = require('js-yaml');
const { existsSync } = require('./file_utils');

module.exports = function sysconfig(context) {
    let configFile;

    if (existsSync('/app/config/config.yaml')) {
        configFile = '/app/config/config.yaml';
    }

    if (existsSync('/app/config/config.json')) {
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
        const path = process.cwd();
        configFile = existsSync(`${path}/config.json`) ? `${path}/config.json` : `${path}/config.yaml`;
    }

    if (configFile.indexOf('.') === 0) {
        configFile = `${process.cwd()}/${configFile}`;
    }

    if (!existsSync(configFile)) {
        throw new Error(`Could not find a usable config file at the path: ${configFile}`);
    }
    let config;

    if (configFile.match(/.yaml/)) {
        config = yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
    } else {
        config = require(configFile);
    }

    return config;
};
