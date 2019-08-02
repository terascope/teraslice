'use strict';

const { Signale } = require('signale');

module.exports = new Signale({
    logLevel: 'info',
    stream: process.stderr,
    types: {
        log: {
            stream: [process.stdout]
        },
        debug: {
            color: 'cyan'
        },
        pending: {
            badge: '*'
        }
    }
});
