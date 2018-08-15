#!/usr/bin/env node

'use strict';

const { formats } = require('@teracope/teraslice-validators');
const { configSchema } = require('./lib/config/schemas/system');
const worker = require('./lib/cluster/worker');
const executionController = require('./lib/cluster/execution_controller');
const assetsLoader = require('./lib/cluster/assets_loader');
const assetsService = require('./lib/cluster/services/assets');
const master = require('./lib/master');
const clusterMaster = require('./lib/cluster/cluster_master');

function opsDirectory(configFile) {
    if (configFile.teraslice && configFile.teraslice.ops_directory) {
        return configFile.teraslice.ops_directory;
    }
    return null;
}

function clusterName(configFile) {
    if (configFile.teraslice && configFile.teraslice.name) {
        return configFile.teraslice.name;
    }
    return null;
}

function loggingConnection(configFile) {
    if (configFile.teraslice && configFile.teraslice.state) {
        return configFile.teraslice.state.connection;
    }

    return 'default';
}

require('terafoundation')({
    name: 'teraslice',
    worker,
    master,
    execution_controller: executionController,
    assets_loader: assetsLoader,
    assets_service: assetsService,
    shutdownMessaging: true,
    cluster_master: clusterMaster,
    descriptors: {
        execution_controller: true,
        worker: true,
        cluster_master: true,
        assets_loader: true,
        assets_service: true
    },
    start_workers: false,
    config_schema: configSchema,
    schema_formats: formats,
    ops_directory: opsDirectory,
    cluster_name: clusterName,
    logging_connection: loggingConnection
});
