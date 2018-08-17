#!/usr/bin/env node

'use strict';

const path = require('path');

const useTerasliceWorker = !!process.env.POD_IP;
const nodeType = process.env.NODE_TYPE;

if (useTerasliceWorker && (nodeType === 'execution_controller' || nodeType === 'worker')) {
    const workerPath = path.join(__dirname, 'packages/teraslice-worker');
    process.chdir(workerPath);
    require(path.join(workerPath, 'service.js')); /* eslint-disable-line */
} else {
    const teraslicePath = path.join(__dirname, 'packages/teraslice');
    process.chdir(teraslicePath);
    require(path.join(teraslicePath, 'service.js')); /* eslint-disable-line */
}
