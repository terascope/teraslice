'use strict';

/**
 * Export of internal components and functions of teraslice.
 *
 * WARNING:
 *      Since these are internal components, breaking changes may occur if using them.
 *      For best results teraslice with an exact semver match, i.e "0.38.0".
*/

const get = require('lodash/get');
const path = require('path');
const { formats } = require('@terascope/job-components');
const { configSchema } = require('./lib/config/schemas/system');
const makeExStore = require('./lib/cluster/storage/execution');
const makeAssetStore = require('./lib/cluster/storage/assets');
const makeStateStore = require('./lib/cluster/storage/state');
const makeAnalyticsStore = require('./lib/cluster/storage/analytics');
const makeJobStore = require('./lib/cluster/storage/jobs');
const makeSliceAnalytics = require('./lib/cluster/execution_controller/slice_analytics');
const makeExecutionRecovery = require('./lib/cluster/execution_controller/recovery');
const makeExecutionRunner = require('./lib/cluster/runners/execution');
const { dateFormat, newFormattedDate } = require('./lib/utils/date_utils');
const { saveAsset } = require('./lib/utils/file_utils');

const terasliceOpPath = path.join(__dirname, 'lib');

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
        logging_connection: loggingConnection
    }, sysconfig);
}

module.exports = {
    dateFormat,
    terasliceOpPath,
    getTerasliceConfig,
    makeExStore,
    makeStateStore,
    makeAnalyticsStore,
    makeAssetStore,
    makeJobStore,
    makeSliceAnalytics,
    makeExecutionRecovery,
    makeExecutionRunner,
    saveAsset,
    newFormattedDate,
};
