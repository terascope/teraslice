'use strict';

const ip = require('ip');
const shortid = require('shortid');
const { EventEmitter } = require('events');
const {
    debugLogger,
    toBoolean,
    get,
    isEmpty,
    isPlainObject,
} = require('@terascope/utils');
const validateConfigs = require('./validate-configs');
const { getArgs } = require('./sysconfig');
const registerApis = require('./api');

const assignment = process.env.NODE_TYPE || process.env.assignment || 'worker';
const useDebugLogger = toBoolean(process.env.USE_DEBUG_LOGGER);

function makeContext(cluster, config, sysconfig) {
    const context = {};
    context.sysconfig = validateConfigs(cluster, config, sysconfig);
    context.assignment = assignment;
    context.name = config.name;
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

    return context;
}

function getSysConfig(name, defaultConfigFile) {
    const { configFile } = getArgs(name, defaultConfigFile);
    return configFile;
}

function generateWorkerId(context) {
    const hostname = getHostname(context);
    const workerId = get(context, 'cluster.worker.id');
    return `${hostname}__${workerId}`;
}

function getHostname(context) {
    const hostname = get(context, ['sysconfig', context.name, 'hostname']);
    if (hostname) return hostname;

    return ip.address();
}

module.exports = function SimpleContext(config, { sysconfig: _sysconfig } = {}) {
    if (!isPlainObject(config) || isEmpty(config)) {
        throw new Error('Terafoundation requires a valid application configuration');
    }

    const sysconfig = _sysconfig || getSysConfig(config.name, config.default_config_file);
    if (!isPlainObject(sysconfig) || isEmpty(sysconfig)) {
        throw new Error('Terafoundation requires a valid system configuration');
    }

    const cluster = {
        worker: {
            id: shortid.generate(),
        }
    };

    return makeContext(cluster, config, sysconfig);
};
