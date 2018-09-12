#!/usr/bin/env node

'use strict';

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

    require('./worker-service');
} else {
    process.env.assignment = nodeType || 'node_master';
    process.env.NODE_TYPE = nodeType || 'node_master';

    require('./cluster-service');
}
