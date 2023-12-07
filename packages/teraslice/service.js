#!/usr/bin/env node

'use strict';

const util = require('util');
const { ClusterContext } = require('terafoundation');
const { safeEncode, safeDecode } = require('./dist/src/lib/utils/encoding_utils');
const { nodeMaster } = require('./dist/src/lib/cluster/node_master');
const { getTerasliceConfig } = require('./dist/src/lib/config');

const assignment = process.env.assignment || process.env.NODE_TYPE;

if (['execution_controller', 'worker'].includes(assignment)) {
    process.env.assignment = assignment;
    process.env.NODE_TYPE = assignment;

    if (process.env.EX) {
        process.env.job = JSON.stringify(safeDecode(process.env.EX));
    } else {
        process.env.EX = safeEncode(JSON.parse(process.env.job));
    }

    require('./worker-service');
} else if (['cluster_master', 'assets_service'].includes(assignment)) {
    process.env.assignment = assignment;
    process.env.NODE_TYPE = assignment;

    require('./cluster-service');
} else {
    process.env.assignment = 'node_master';
    process.env.NODE_TYPE = 'node_master';

    const terasliceConfig = getTerasliceConfig({
        master: nodeMaster,
        cluster_master: deprecatedUseOf('cluster_master'),
        assets_service: deprecatedUseOf('assets_service'),
        worker: deprecatedUseOf('worker'),
        execution_controller: deprecatedUseOf('execution_controller'),
        assets_loader: deprecatedUseOf('assets_loader'),
        descriptors: {
            execution_controller: true,
            cluster_master: true,
            worker: true,
            assets_service: true,
        },
    });

    new ClusterContext(terasliceConfig);
}

function deprecatedUseOf(name) {
    const msg = `${name} is now deprecated and is called in a separate single process context`;
    return () => util.deprecate(() => {}, msg);
}
