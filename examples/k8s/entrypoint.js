#!/usr/bin/env node

'use strict';

const path = require('path');

const nodeType = process.env.NODE_TYPE;
const workerPath = process.env.WORKER_PATH || path.join(process.cwd(), 'worker');

if (nodeType === 'execution_controller' || nodeType === 'worker') {
    process.chdir(workerPath);
    require(path.join(workerPath, './command.js')); /* eslint-disable-line */
} else {
    require('./service.js'); /* eslint-disable-line */
}
