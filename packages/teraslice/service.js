#!/usr/bin/env node

'use strict';

const { formats } = require('@terascope/job-components');
const { configSchema } = require('./lib/config/schemas/system');
const worker = require('./lib/cluster/worker');
const executionController = require('./lib/cluster/execution_controller');
const assetsLoader = require('./lib/cluster/assets_loader');
const assetsService = require('./lib/cluster/services/assets');
const master = require('./lib/master');
const clusterMaster = require('./lib/cluster/cluster_master');
const { clusterName, loggingConnection } = require('.');

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
    cluster_name: clusterName,
    logging_connection: loggingConnection
});
