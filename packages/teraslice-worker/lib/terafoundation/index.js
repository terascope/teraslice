'use strict';

const _ = require('lodash');
const debug = require('debug');
const { EventEmitter } = require('events');
const validateConfigs = require('terafoundation/lib/validate_configs');
const { loggerClient } = require('terafoundation/lib/logger_utils');
const registerApis = require('terafoundation/lib/api');
const readSysConfig = require('terafoundation/lib/sysconfig');

const defaultAssignment = process.env.NODE_TYPE || 'worker';

const newDebugLogger = (name, assignment = defaultAssignment) => ({
    error: (...args) => {
        debug(`teraslice-${assignment}:${name}:error`)(...args);
    },
    warn: (...args) => {
        debug(`teraslice-${assignment}:${name}:warn`)(...args);
    },
    info: (...args) => {
        debug(`teraslice-${assignment}:${name}:info`)(...args);
    },
    trace: (...args) => {
        debug(`teraslice-${assignment}:${name}:trace`)(...args);
    },
    debug: (...args) => {
        debug(`teraslice-${assignment}:${name}:debug`)(...args);
    },
    child: () => {},
    streams: [],
    flush: () => Promise.resolve()
});

function makeContext(cluster, config, sysconfig, useDebugLogger) {
    const context = {};
    let loggingConnection = 'default';
    context.sysconfig = validateConfigs(cluster, config, sysconfig);

    if (process.env.POD_IP) {
        context.sysconfig._nodeName = process.env.POD_IP;
    }

    context.name = config.name || 'terafoundation';
    context.cluster = cluster;

    if (typeof config.cluster_name === 'function') {
        context.cluster_name = config.cluster_name(context.sysconfig);
    }

    if (typeof config.loggingConnection === 'function') {
        loggingConnection = config.loggingConnection(context.sysconfig);
    }

    // Initialize the API
    registerApis(context);
    delete context.apis.foundation.startWorkers;
    delete context.foundation.startWorkers;

    delete context.apis.foundation.getSystemEvents;
    delete context.foundation.getEventEmitter;

    const events = new EventEmitter();
    context.apis.foundation.getSystemEvents = () => events;
    context.foundation.getEventEmitter = () => events;

    if (useDebugLogger) {
        context.apis.foundation.makeLogger = (arg) => {
            const workerId = cluster.worker.id;
            if (_.isString(arg)) {
                return newDebugLogger(`${workerId}:${arg}`);
            }
            if (_.isPlainObject(arg)) {
                const { module: moduleName } = arg;
                return newDebugLogger(`${workerId}:${moduleName}`);
            }
            return newDebugLogger(`${workerId}:unknown`);
        };
    }

    // Bootstrap the top level logger
    context.logger = context.apis.foundation.makeLogger(context.name, context.name);

    // FIXME: this should probably be refactored to actually create the
    // logger as it stands this function is very confusing
    loggerClient(context, context.logger, loggingConnection);

    return context;
}

module.exports = {
    readSysConfig,
    makeContext,
    newDebugLogger,
};
