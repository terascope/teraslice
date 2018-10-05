#!/usr/bin/env node

'use strict';

if (process.env.heapdump === 'true') {
    require('heapdump');
    process.on('SIGUSR2', () => console.log('SIGUSR2 received, heapdump enabled'));
} else {
    // Sending SIGUSR2 could kill the process under certain conditions if
    // heapdump is not enabled, this signal handler prevents that
    process.on('SIGUSR2', () => console.log('SIGUSR2 received, heapdump disabled'));
}
require('./packages/teraslice/service.js');
