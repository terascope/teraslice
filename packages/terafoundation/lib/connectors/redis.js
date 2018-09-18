'use strict';

const _ = require('lodash');
const redis = require('redis');
const events = require('events');

function create(customConfig, logger) {
    logger.info(`Using redis host: ${customConfig.host}`);

    const client = redis.createClient(customConfig.port, customConfig.host);

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
        port: {
            doc: '',
            default: 6379
        }
    };
}

module.exports = {
    create,
    config_schema
};
