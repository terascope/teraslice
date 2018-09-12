'use strict';

const util = require('util');
const nodeMaster = require('./lib/cluster/node_master');
const clusterMaster = require('./lib/cluster/cluster_master');
const assetService = require('./lib/cluster/services/assets');
const { getTerasliceConfig } = require('./lib/config');

function deprecatedUseOf(name) {
    const msg = `${name} is now deprecated and are no longer called from terafoundation directly`;
    return () => util.deprecate(() => {}, msg);
}

const terasliceConfig = getTerasliceConfig({
    master: nodeMaster,
    cluster_master: clusterMaster,
    assets_service: assetService,
    worker: deprecatedUseOf('worker'),
    execution_controller: deprecatedUseOf('execution_controller'),
    assets_loader: deprecatedUseOf('assets_loader'),
    descriptors: {
        execution_controller: true,
        cluster_master: true,
        worker: true,
        assets_service: true,
    },
    shutdownMessaging: true,
    start_workers: false,
});

require('terafoundation')(terasliceConfig);
