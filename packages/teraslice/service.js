#!/usr/bin/env node

'use strict';

const util = require('util');
const { safeEncode, safeDecode } = require('./lib/utils/encoding_utils');

const nodeType = process.env.assignment || process.env.NODE_TYPE;

if (nodeType === 'execution_controller' || nodeType === 'worker') {
    process.env.assignment = nodeType || 'worker';
    process.env.NODE_TYPE = nodeType || 'worker';

    if (process.env.EX) {
        process.env.job = JSON.stringify(safeDecode(process.env.EX));
    } else {
        process.env.EX = safeEncode(JSON.parse(process.env.job));
    }

    require('./lib/workers/service.js');
} else {
    process.env.assignment = nodeType || 'node_master';
    process.env.NODE_TYPE = nodeType || 'node_master';

    const nodeMaster = require('./lib/cluster/node_master');
    const clusterMaster = require('./lib/cluster/cluster_master');
    const assetService = require('./lib/cluster/services/assets');
    const { getTerasliceConfig } = require('./lib/config');

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
}

function deprecatedUseOf(name) {
    const msg = `${name} is now deprecated and are no longer called from terafoundation directly`;
    return () => util.deprecate(() => {}, msg);
}
