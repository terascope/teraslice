'use strict';

const get = require('lodash/get');
const path = require('path');
const { formats } = require('@terascope/job-components');
const { configSchema } = require('./schemas/system');

const terasliceOpPath = path.join(__dirname, '..');

function clusterName(configFile) {
    return get(configFile, 'teraslice.name', null);
}

function getTerasliceConfig(sysconfig) {
    return Object.assign({
        name: 'teraslice',
        config_schema: configSchema,
        schema_formats: formats,
        cluster_name: clusterName,
        shutdownMessaging: false,
        start_workers: false,
    }, sysconfig);
}

module.exports = {
    terasliceOpPath,
    formats,
    configSchema,
    getTerasliceConfig,
    clusterName,
};
