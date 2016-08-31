'use strict';

var _ = require('lodash');
var redis = require('redis');
var events = require('events');

function create(customConfig, logger) {
    logger.info("Using redis host: " + customConfig.host);

    var client = redis.createClient(customConfig.port, customConfig.host);

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
        port: {
            doc: '',
            default: 6379
        }
    }
}

module.exports = {
    create: create,
    config_schema: config_schema
};

