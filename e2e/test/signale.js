'use strict';

const { Signale } = require('signale');

module.exports = new Signale({
    logLevel: 'info',
    stream: process.stderr,
    types: {
        debug: {
            color: 'cyan'
        },
        pending: {
            badge: '*'
        }
    }
});
