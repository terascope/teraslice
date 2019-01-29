#!/usr/bin/env node

'use strict';

try {
    require('../dist/command.js');
} catch (err) {
    // eslint-disable-next-line
    console.error('error while attempting to invoke cli command', err.toString());
    process.exit(1);
}
