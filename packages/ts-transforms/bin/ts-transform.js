#!/usr/bin/env node

'use strict';

const path = require('path');

try {
    // this path.join is only used for pkg asset injection
    path.join(__dirname, '../package.json');
    require('../dist/src/command');
} catch (err) {
    // eslint-disable-next-line
    console.error('error while attempting to invoke cli command', err.toString());
    process.exit(1);
}
