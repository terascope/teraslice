'use strict';

const events = require('events');

function create(customConfig, logger) {
    const StatsD = require('node-statsd').StatsD;
    logger.info(`Using statsd host: ${customConfig.host}`);

    const client = new StatsD(customConfig);

    return {
        client
    };
}

function config_schema() {
    return {
        host: {
            doc: '',
            default: '127.0.0.1'
        },
        mock: {
            doc: '',
            default: false
        }
    };
}

module.exports = {
    create,
    config_schema

};
