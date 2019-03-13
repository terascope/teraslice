'use strict';

const _ = require('lodash');
const shortid = require('shortid');
const { EventEmitter } = require('events');
const { debugLogger } = require('@terascope/job-components');
const validateConfigs = require('terafoundation/lib/validate_configs');
const { loggerClient } = require('terafoundation/lib/logger_utils');
const { getArgs } = require('terafoundation/lib/sysconfig');
const registerApis = require('terafoundation/lib/api');
const { getTerasliceConfig } = require('../../config');
const { generateWorkerId } = require('../helpers/terafoundation');

const assignment = process.env.NODE_TYPE || process.env.assignment || 'worker';
const useDebugLogger = process.env.USE_DEBUG_LOGGER === 'true';
const contextName = 'teraslice-worker';

function makeContext(cluster, config, sysconfig) {
    const context = {};
    context.sysconfig = validateConfigs(cluster, config, sysconfig);
    context.assignment = assignment;
    context.name = contextName;
    context.cluster = cluster;
    context.arch = process.arch;
    context.platform = process.platform;

    if (process.env.POD_IP) {
        context.sysconfig._nodeName = process.env.POD_IP;
    } else {
        context.sysconfig._nodeName = generateWorkerId(context);
    }

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

function getSysConfig(defaultConfigFile) {
    const { configFile } = getArgs('teraslice', defaultConfigFile);
    return configFile;
}

module.exports = function makeTerafoundationContext({ sysconfig: _sysconfig } = {}) {
    const config = getTerasliceConfig({ name: contextName });

    const sysconfig = _sysconfig || getSysConfig(config.default_config_file);
    if (!_.isPlainObject(sysconfig) || _.isEmpty(sysconfig)) {
        throw new Error('TerafoundationContext requires a valid terafoundation configuration');
    }

    const cluster = {
        worker: {
            id: shortid.generate(),
        }
    };
    return makeContext(cluster, config, sysconfig);
};
