'use strict';

const get = require('lodash/get');
const path = require('path');
const { formats } = require('@terascope/job-components');
const { configSchema } = require('./schemas/system');

const terasliceOpPath = path.join(__dirname, '..');

function clusterName(configFile) {
    return get(configFile, 'teraslice.name', null);
}

function loggingConnection(configFile) {
    return get(configFile, 'teraslice.state.connection', 'default');
}

function getTerasliceConfig(sysconfig) {
    return Object.assign({
        name: 'teraslice',
        config_schema: configSchema,
        schema_formats: formats,
        cluster_name: clusterName,
        logging_connection: loggingConnection,
        shutdownMessaging: true,
        start_workers: false,
    }, sysconfig);
}

module.exports = {
    terasliceOpPath,
    formats,
    configSchema,
    getTerasliceConfig,
    loggingConnection,
    clusterName,
};
