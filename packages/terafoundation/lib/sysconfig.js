'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const yaml = require('js-yaml');

function getDefaultConfigFile() {
    const cwd = process.cwd();

    if (process.env.TERAFOUNDATION_CONFIG) {
        return path.resolve(process.env.TERAFOUNDATION_CONFIG);
    }

    if (fs.existsSync('/app/config/config.yaml')) {
        return '/app/config/config.yaml';
    }

    if (fs.existsSync('/app/config/config.yml')) {
        return '/app/config/config.yml';
    }

    if (fs.existsSync('/app/config/config.json')) {
        return '/app/config/config.json';
    }

    if (fs.existsSync(path.join(cwd, './config.yaml'))) {
        return path.join(cwd, './config.yaml');
    }

    if (fs.existsSync(path.join(cwd, './config.yml'))) {
        return path.join(cwd, './config.yml');
    }

    if (fs.existsSync(path.join(cwd, './config.json'))) {
        return path.join(cwd, './config.json');
    }

    return undefined;
}

function getArgs(scriptName, defaultConfigFile) {
    const { argv } = yargs.usage('Usage: $0 [options]')
        .scriptName(scriptName)
        .version()
        .alias('v', 'version')
        .help()
        .alias('h', 'help')
        .detectLocale(false)
        .option('c', {
            alias: 'configfile',
            default: getDefaultConfigFile(),
            describe: `Terafoundation configuration file to load.
                        Defaults to env TERAFOUNDATION_CONFIG.`,
            coerce: arg => parseConfigFile(arg || defaultConfigFile),
        })
        .option('b', {
            alias: 'bootstrap',
            describe: 'Perform initial setup'
        })
        .wrap(yargs.terminalWidth());

    return {
        bootstrap: argv.bootstrap,
        configFile: argv.configfile,
    };
}

function parseConfigFile(file) {
    const configFile = file ? path.resolve(file) : undefined;
    if (!configFile || !fs.existsSync(configFile)) {
        throw new Error(`Could not find a usable config file at the path: ${configFile}`);
    }

    if (['.yaml', '.yml'].includes(path.extname(configFile))) {
        return yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
    }

    return _.cloneDeep(require(configFile));
}

module.exports = {
    getArgs,
    getDefaultConfigFile,
    parseConfigFile,
};
