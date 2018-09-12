#!/usr/bin/env node

'use strict';

const util = require('util');
const makeTerafoundation = require('terafoundation');
const nodeMaster = require('./node_master');
const clusterMaster = require('./cluster_master');
const assetService = require('./services/assets');
const { getTerasliceConfig } = require('../config');

function deprecatedFn(name) {
    return util.deprecate(() => {}, `${name} is now deprecated and no longer available`);
}

const terasliceConfig = getTerasliceConfig({
    master: nodeMaster,
    cluster_master: clusterMaster,
    assets_service: assetService,
    worker: deprecatedFn('execution_controller'),
    execution_controller: deprecatedFn('execution_controller'),
    assets_loader: deprecatedFn('assets_loader'),
    shutdownMessaging: true,
    descriptors: {
        execution_controller: true,
        worker: true,
        cluster_master: true,
        assets_service: true,
        assets_loader: false,
    },
    start_workers: false,
});

makeTerafoundation(terasliceConfig);
