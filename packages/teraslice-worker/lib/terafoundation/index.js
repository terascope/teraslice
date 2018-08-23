'use strict';

const { EventEmitter } = require('events');
const { debugLogger } = require('@terascope/teraslice-types');
const validateConfigs = require('terafoundation/lib/validate_configs');
const { loggerClient } = require('terafoundation/lib/logger_utils');
const registerApis = require('terafoundation/lib/api');
const readSysConfig = require('terafoundation/lib/sysconfig');

const assignment = process.env.NODE_TYPE || 'worker';

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

    const events = new EventEmitter();
    context.apis.foundation.getSystemEvents = () => events;
    context.foundation.getEventEmitter = () => events;

    if (useDebugLogger) {
        context.apis.foundation.makeLogger = (...args) => debugLogger(assignment, ...args);
        context.foundation.makeLogger = context.apis.foundation.makeLogger;
    }

    // Bootstrap the top level logger
    context.logger = context.apis.foundation.makeLogger(assignment, context.name);

    // FIXME: this should probably be refactored to actually create the
    // logger as it stands this function is very confusing
    loggerClient(context, context.logger, loggingConnection);

    return context;
}

module.exports = {
    readSysConfig,
    makeContext,
};
