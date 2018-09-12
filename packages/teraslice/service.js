#!/usr/bin/env node

'use strict';

const nodeType = process.env.NODE_TYPE || process.env.assignment;

if ((nodeType === 'execution_controller' || nodeType === 'worker')) {
    require('./lib/workers/service.js');
} else {
    require('./lib/cluster/service.js');
}
