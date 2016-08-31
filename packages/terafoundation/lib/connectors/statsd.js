'use strict';

var events = require('events');

function create(customConfig, logger) {
    var StatsD = require('node-statsd').StatsD;
    logger.info("Using statsd host: " + customConfig.host);

    var client = new StatsD(customConfig);

    return {
        client: client
    }
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
    }
}

module.exports = {
    create: create,
    config_schema: config_schema

};