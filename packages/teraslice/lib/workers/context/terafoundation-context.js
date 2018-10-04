'use strict';

const _ = require('lodash');
const shortid = require('shortid');
const path = require('path');
const yargs = require('yargs');
const { EventEmitter } = require('events');
const { debugLogger } = require('@terascope/teraslice-types');
const validateConfigs = require('terafoundation/lib/validate_configs');
const { loggerClient } = require('terafoundation/lib/logger_utils');
const readSysConfig = require('terafoundation/lib/sysconfig');
const registerApis = require('terafoundation/lib/api');
const { getTerasliceConfig } = require('../../config');
const { generateWorkerId } = require('../helpers/terafoundation');

const assignment = process.env.NODE_TYPE || process.env.assignment || 'worker';
const useDebugLogger = process.env.USE_DEBUG_LOGGER === 'true';
const contextName = 'teraslice-worker';

function makeContext(cluster, config, sysconfig) {
    const context = {};
    context.sysconfig = validateConfigs(cluster, config, sysconfig);

    if (process.env.POD_IP) {
        context.sysconfig._nodeName = process.env.POD_IP;
    } else {
        context.sysconfig._nodeName = generateWorkerId(context);
    }

    context.assignment = assignment;
    context.name = contextName;
    context.cluster = cluster;

    if (typeof config.cluster_name === 'function') {
        context.cluster_name = config.cluster_name(context.sysconfig);
    }

    // Initialize the API
    registerApis(context);
    context.apis.foundation.startWorkers = () => {};
    context.foundation.startWorkers = () => {};

    const events = new EventEmitter();
    context.apis.foundation.getSystemEvents = () => events;
    context.foundation.getEventEmitter = () => events;

    if (useDebugLogger) {
        context.apis.foundation.makeLogger = (...args) => debugLogger(context.assignment, ...args);
        context.foundation.makeLogger = context.apis.foundation.makeLogger;
    }

    // Bootstrap the top level logger
    context.logger = context.apis.foundation.makeLogger(assignment, context.name);

    // FIXME: this should probably be refactored to actually create the
    // logger as it stands this function is very confusing
    loggerClient(context);

    return context;
}

function getSysConfig() {
    const { argv } = yargs.usage('Usage: $0 [options]')
        .scriptName('teraslice')
        .version()
        .alias('v', 'version')
        .help()
        .alias('h', 'help')
        .option('c', {
            alias: 'configfile',
            describe: `Terafoundation configuration file to load.
                Defaults to env TERAFOUNDATION_CONFIG.`,
            coerce: (arg) => {
                if (!arg) return '';
                return path.resolve(arg);
            },
        })
        .wrap(yargs.terminalWidth());


    return readSysConfig({
        configfile: argv.configfile
    });
}

module.exports = function makeTerafoundationContext({ sysconfig: _sysconfig } = {}) {
    const sysconfig = _sysconfig || getSysConfig();
    if (!_.isPlainObject(sysconfig) || _.isEmpty(sysconfig)) {
        throw new Error('TerafoundationContext requires a valid terafoundation configuration');
    }

    const config = getTerasliceConfig({ name: contextName });
    const cluster = {
        worker: {
            id: shortid.generate(),
        }
    };
    return makeContext(cluster, config, sysconfig);
};
